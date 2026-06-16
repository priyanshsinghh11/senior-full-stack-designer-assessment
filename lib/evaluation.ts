import Anthropic from "@anthropic-ai/sdk";
import { GridFSBucket, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

// Rubric dimensions — mirrors the assessment's "What We Will Evaluate" list.
// Each is graded out of 10 by a deliberately strict examiner.
const RUBRIC = [
  { key: "visual_design", label: "Strength of visual design and craft" },
  { key: "hierarchy_layout", label: "Quality of hierarchy and layout" },
  { key: "website_conversion", label: "Website thinking and conversion awareness" },
  { key: "motion_interaction", label: "Motion and interaction design judgment" },
  { key: "product_ux", label: "UX quality in the healthcare product flow" },
  { key: "healthcare_trust", label: "Clarity and trustworthiness of the healthcare UI" },
  { key: "consistency", label: "Consistency across product, web, and brand surfaces" },
  { key: "linkedin_quality", label: "Quality of the LinkedIn content and graphic" },
  { key: "ai_workflow", label: "AI-native workflow maturity" },
] as const;

const MODEL = "claude-opus-4-8";
const SCORE_1_TO_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildInputSchema(): Anthropic.Tool.InputSchema {
  const dimensionProps: Record<string, unknown> = {};
  for (const d of RUBRIC) {
    dimensionProps[d.key] = {
      type: "object",
      description: d.label,
      properties: {
        score: {
          type: "integer",
          enum: SCORE_1_TO_10,
          description: "Strict score out of 10. Be harsh; see the grading bands.",
        },
        critique: {
          type: "string",
          description:
            "Blunt, specific critique justifying the score: what is wrong, what is missing, what would a top candidate have done.",
        },
      },
      required: ["score", "critique"],
      additionalProperties: false,
    };
  }

  return {
    type: "object",
    properties: {
      dimensions: {
        type: "object",
        properties: dimensionProps,
        required: RUBRIC.map((d) => d.key),
        additionalProperties: false,
      },
      overall_score: {
        type: "integer",
        enum: SCORE_1_TO_10,
        description: "Overall strict score out of 10 for the whole submission.",
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "Genuine strengths only. Leave empty if there are none.",
      },
      weaknesses: {
        type: "array",
        items: { type: "string" },
        description: "The concrete problems that held the score down.",
      },
      verdict: {
        type: "string",
        description:
          "2-4 sentence final verdict in the voice of a strict examiner. No flattery.",
      },
      recommendation: {
        type: "string",
        enum: ["strong_hire", "hire", "borderline", "no_hire"],
        description: "Hiring recommendation based strictly on the evidence.",
      },
    },
    required: [
      "dimensions",
      "overall_score",
      "strengths",
      "weaknesses",
      "verdict",
      "recommendation",
    ],
    additionalProperties: false,
  } as Anthropic.Tool.InputSchema;
}

const STRICT_EXAMINER_SYSTEM = `You are an extremely strict, demanding senior design examiner grading a Senior Full-Stack Designer assessment. You grade like the hardest professor a candidate has ever had — exacting, unsentimental, and impossible to impress with polish alone.

Hard rules:
- Score every dimension and the overall out of 10, where 10 is reserved for truly exceptional, portfolio-defining, production-ready work that you would be unable to improve. Almost no real submission earns it.
- Default to skepticism. Most submissions are mediocre and should land in the 3-5 range. Award 6-7 only for genuinely strong, considered work, and 8+ only for outstanding work backed by concrete evidence.
- Grade what is ACTUALLY in front of you. If a deliverable is only a link you cannot open, or a design file is missing, treat that dimension as largely unproven and score it low (1-3) — never give credit for work you cannot see.
- Weight the actual uploaded design files most heavily. Vague written explanations without strong visual work do not earn high marks. A confident write-up cannot rescue weak or absent design files.
- Be specific and blunt in every critique: name the exact flaws (hierarchy, spacing, contrast, typography, conversion logic, accessibility, HIPAA/clinical-trust gaps, motion judgment, brand fit) and state what a top candidate would have done instead.
- Do not inflate scores to be kind. Do not hedge. Do not pad with praise.

When finished, call submit_grade with the strict scorecard.`;

/**
 * Strictly grade one submission with Claude, acting as a harsh examiner.
 * Reads the candidate's text answers + uploaded design files from
 * MongoDB/GridFS, sends both to the model, scores everything out of 10,
 * and saves the scorecard to `assessment_evaluations`.
 */
export async function evaluateSubmission(sessionId: string) {
  if (!ObjectId.isValid(sessionId)) {
    throw new Error("A valid assessment session id is required.");
  }

  const db = await getMongoDb();
  const submission = await db
    .collection("assessment_submissions")
    .findOne({ assessment_session_id: sessionId });

  if (!submission) {
    throw new Error("No submission found for this session.");
  }

  // 1. The text the examiner reads.
  const textParts = [
    "Grade this candidate's Senior Full-Stack Designer assessment submission strictly.",
    "Score every dimension and the overall out of 10. Grade only what is present.",
    "The uploaded design files matter most — weigh them above the written text.",
    "",
    "=== TASK 1 — Website Redesign ===",
    `Figma link (you cannot open links): ${submission.website_figma_link || "(none)"}`,
    `Walkthrough URL (you cannot open links): ${submission.website_walkthrough_url || "(none)"}`,
    `Explanation: ${submission.website_explanation || "(none provided)"}`,
    "",
    "=== TASK 2 — Healthcare Product UI Flow ===",
    `Figma link (you cannot open links): ${submission.healthcare_figma_link || "(none)"}`,
    `Explanation: ${submission.healthcare_explanation || "(none provided)"}`,
    "",
    "=== TASK 3 — LinkedIn B2B Asset ===",
    `Figma link (you cannot open links): ${submission.linkedin_graphic_figma_link || "(none)"}`,
    `LinkedIn post:\n${submission.linkedin_post || "(none provided)"}`,
    "",
    submission.ai_workflow_note
      ? `=== AI workflow note ===\n${submission.ai_workflow_note}`
      : "",
    "",
    "The attached image/PDF files below are the candidate's actual design deliverables. Judge them rigorously, then call submit_grade.",
  ];

  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: textParts.filter(Boolean).join("\n") },
  ];

  // 2. Attach each uploaded design file from GridFS (image or PDF).
  const files = [
    {
      task: "Task 1 — Website Redesign design",
      fileId: submission.website_file_id as string | null | undefined,
      fileName: submission.website_file_name as string | null | undefined,
    },
    {
      task: "Task 2 — Healthcare UI flow design",
      fileId: submission.healthcare_file_id as string | null | undefined,
      fileName: submission.healthcare_file_name as string | null | undefined,
    },
    {
      task: "Task 3 — LinkedIn graphic",
      fileId: submission.linkedin_graphic_file_id as string | null | undefined,
      fileName: submission.linkedin_graphic_file_name as string | null | undefined,
    },
  ].filter(
    (f): f is { task: string; fileId: string; fileName: string | null | undefined } =>
      typeof f.fileId === "string" && ObjectId.isValid(f.fileId),
  );

  const bucket = new GridFSBucket(db, { bucketName: "uploads" });

  for (const f of files) {
    const _id = new ObjectId(f.fileId);
    const meta = await db.collection("uploads.files").findOne({ _id });
    if (!meta) continue;

    const chunks: Buffer[] = [];
    for await (const chunk of bucket.openDownloadStream(_id)) {
      chunks.push(chunk as Buffer);
    }
    const data = Buffer.concat(chunks).toString("base64");
    const contentType =
      (meta.metadata as { contentType?: string } | undefined)?.contentType ||
      (meta.contentType as string | undefined) ||
      "";

    content.push({
      type: "text",
      text: `\n[Candidate's design file for ${f.task}: ${f.fileName || meta.filename}]`,
    });

    if (contentType === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else if (contentType === "image/png" || contentType === "image/jpeg") {
      content.push({
        type: "image",
        source: { type: "base64", media_type: contentType, data },
      });
    }
  }

  // 3. Call Claude, forcing the strict structured grade.
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: STRICT_EXAMINER_SYSTEM,
    tools: [
      {
        name: "submit_grade",
        description: "Submit the strict out-of-10 scorecard for this submission.",
        input_schema: buildInputSchema(),
      },
    ],
    tool_choice: { type: "tool", name: "submit_grade" },
    messages: [{ role: "user", content }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("The examiner did not return a structured grade.");
  }

  const scorecard = toolUse.input;

  // 4. Persist the scorecard.
  const now = new Date();
  await db.collection("assessment_evaluations").updateOne(
    { assessment_session_id: sessionId },
    {
      $set: {
        assessment_session_id: sessionId,
        candidate_id: submission.candidate_id,
        model: MODEL,
        grading_style: "strict_examiner_out_of_10",
        graded_files: files.map((f) => ({ task: f.task, fileId: f.fileId })),
        scorecard,
        evaluation_status: "done",
        evaluated_at: now,
        updated_at: now,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true },
  );

  return scorecard;
}
