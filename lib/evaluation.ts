import Groq from "groq-sdk";
import { GridFSBucket, ObjectId, type Db } from "mongodb";
import { z } from "zod";
import { getMongoDb } from "@/lib/mongodb";

const GROQ_MODEL =
  process.env.GROQ_EVALUATION_MODEL ||
  "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_EVAL_IMAGE_BYTES = 4 * 1024 * 1024;

const scorecardSchema = z.object({
  dimensions: z
    .array(
      z.object({
        name: z.string(),
        score: z.coerce.number().min(1).max(10),
        note: z.string(),
      }),
    )
    .min(1),
  overall_score: z.coerce.number().min(1).max(10),
  summary: z.string(),
  score_explanation: z.string(),
  strengths: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  manual_review_flags: z.array(z.string()).default([]),
  recommendation: z.enum(["strong_yes", "yes", "maybe", "no"]),
  skipped_files: z
    .array(
      z.object({
        label: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});

export type EvaluationScorecard = z.infer<typeof scorecardSchema>;

type SubmissionDocument = {
  candidate_id?: string;
  assessment_session_id: string;
  website_figma_link?: string | null;
  website_file_name?: string | null;
  website_file_id?: string | null;
  website_explanation?: string | null;
  website_walkthrough_url?: string | null;
  healthcare_figma_link?: string | null;
  healthcare_file_name?: string | null;
  healthcare_file_id?: string | null;
  healthcare_explanation?: string | null;
  linkedin_post?: string | null;
  linkedin_graphic_file_name?: string | null;
  linkedin_graphic_file_id?: string | null;
  linkedin_graphic_figma_link?: string | null;
};

type StoredUpload = {
  id: string;
  label: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
};

type SkippedFile = {
  label: string;
  reason: string;
};

const rubricDimensions = [
  "Website visual hierarchy, clarity, and polish",
  "Website conversion thinking and responsive design",
  "Website interaction and motion direction",
  "Healthcare product flow, key screens, and states",
  "Healthcare clinical clarity, accessibility, and HIPAA-ready thinking",
  "LinkedIn post quality, audience fit, and operator-minded point of view",
  "LinkedIn supporting graphic quality and B2B clarity",
  "Written reasoning, assumptions, and decision quality",
  "Overall senior full stack design judgment",
];

export async function evaluateSubmission(sessionId: string) {
  const cleanSessionId = sessionId.trim();

  if (!cleanSessionId) {
    throw new Error("sessionId is required.");
  }

  const db = await getMongoDb();
  const now = new Date();

  await db.collection("assessment_submissions").updateOne(
    { assessment_session_id: cleanSessionId },
    {
      $set: {
        evaluation_status: "processing",
        evaluation_started_at: now,
        updated_at: now,
      },
    },
  );

  try {
    const submission =
      await db.collection<SubmissionDocument>("assessment_submissions").findOne({
        assessment_session_id: cleanSessionId,
      });

    if (!submission) {
      throw new Error("Submission was not found for this session.");
    }

    const { attachedFiles, skippedFiles } = await loadEvaluationFiles(
      db,
      submission,
    );
    const scorecard = await callGroqEvaluator(
      submission,
      attachedFiles,
      skippedFiles,
    );
    const evaluatedAt = new Date();

    await db.collection("assessment_evaluations").updateOne(
      { assessment_session_id: cleanSessionId },
      {
        $set: {
          provider: "groq",
          model: GROQ_MODEL,
          candidate_id: submission.candidate_id ?? null,
          assessment_session_id: cleanSessionId,
          scorecard,
          attached_files: attachedFiles.map((file) => ({
            id: file.id,
            label: file.label,
            filename: file.filename,
            content_type: file.contentType,
            size: file.buffer.length,
          })),
          skipped_files: [
            ...skippedFiles,
            ...scorecard.skipped_files,
          ],
          evaluated_at: evaluatedAt,
          updated_at: evaluatedAt,
        },
        $setOnInsert: {
          created_at: evaluatedAt,
        },
      },
      { upsert: true },
    );

    await db.collection("assessment_submissions").updateOne(
      { assessment_session_id: cleanSessionId },
      {
        $set: {
          evaluation_status: "done",
          evaluation_error: null,
          evaluation_scorecard: scorecard,
          evaluation_overall_score: scorecard.overall_score,
          evaluation_recommendation: scorecard.recommendation,
          evaluation_summary: scorecard.summary,
          evaluation_score_explanation: scorecard.score_explanation,
          evaluation_strengths: scorecard.strengths,
          evaluation_concerns: scorecard.concerns,
          evaluation_manual_review_flags: scorecard.manual_review_flags,
          evaluated_at: evaluatedAt,
          updated_at: evaluatedAt,
        },
      },
    );

    return scorecard;
  } catch (error) {
    const failedAt = new Date();
    const message =
      error instanceof Error ? error.message : "Evaluation failed.";

    await db.collection("assessment_submissions").updateOne(
      { assessment_session_id: cleanSessionId },
      {
        $set: {
          evaluation_status: "failed",
          evaluation_error: message,
          evaluation_failed_at: failedAt,
          updated_at: failedAt,
        },
      },
    );

    throw error;
  }
}

async function loadEvaluationFiles(
  db: Db,
  submission: SubmissionDocument,
) {
  const refs = [
    {
      label: "Website redesign file",
      id: submission.website_file_id,
    },
    {
      label: "Healthcare product flow file",
      id: submission.healthcare_file_id,
    },
    {
      label: "LinkedIn supporting graphic file",
      id: submission.linkedin_graphic_file_id,
    },
  ];

  const attachedFiles: StoredUpload[] = [];
  const skippedFiles: SkippedFile[] = [];

  for (const ref of refs) {
    if (!ref.id) continue;

    if (!ObjectId.isValid(ref.id)) {
      skippedFiles.push({
        label: ref.label,
        reason: "Invalid GridFS file id.",
      });
      continue;
    }

    const file = await downloadFromGridFS(db, ref.id, ref.label);

    if (!file) {
      skippedFiles.push({
        label: ref.label,
        reason: "File id was saved on the submission, but the GridFS file was not found.",
      });
      continue;
    }

    if (!["image/png", "image/jpeg"].includes(file.contentType)) {
      skippedFiles.push({
        label: ref.label,
        reason:
          file.contentType === "application/pdf"
            ? "PDF evaluation is skipped in the temporary Groq image-evaluation path."
            : `Unsupported content type for Groq image evaluation: ${file.contentType}.`,
      });
      continue;
    }

    if (file.buffer.length > MAX_EVAL_IMAGE_BYTES) {
      skippedFiles.push({
        label: ref.label,
        reason: "Image is too large for the temporary Groq test evaluator.",
      });
      continue;
    }

    attachedFiles.push(file);
  }

  return { attachedFiles, skippedFiles };
}

async function downloadFromGridFS(
  db: Db,
  fileId: string,
  label: string,
): Promise<StoredUpload | null> {
  const _id = new ObjectId(fileId);
  const meta = await db.collection("uploads.files").findOne({ _id });

  if (!meta) return null;

  const bucket = new GridFSBucket(db, { bucketName: "uploads" });
  const chunks: Buffer[] = [];

  for await (const chunk of bucket.openDownloadStream(_id)) {
    chunks.push(Buffer.from(chunk as Buffer));
  }

  return {
    id: fileId,
    label,
    filename: String(meta.filename ?? "uploaded-file"),
    contentType:
      (meta.metadata?.contentType as string | undefined) ||
      (meta.contentType as string | undefined) ||
      "application/octet-stream",
    buffer: Buffer.concat(chunks),
  };
}

async function callGroqEvaluator(
  submission: SubmissionDocument,
  attachedFiles: StoredUpload[],
  skippedFiles: SkippedFile[],
) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
  > = [
      {
        type: "text",
        text: buildEvaluationPrompt(submission, attachedFiles, skippedFiles),
      },
    ];

  for (const file of attachedFiles) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${file.contentType};base64,${file.buffer.toString("base64")}`,
        detail: "high",
      },
    });
  }

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_completion_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior product design evaluator. Return only valid JSON.",
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("Groq returned an empty evaluation response.");
  }

  return parseScorecard(raw);
}

function buildEvaluationPrompt(
  submission: SubmissionDocument,
  attachedFiles: StoredUpload[],
  skippedFiles: SkippedFile[],
) {
  return `
Evaluate this Senior Full Stack Designer assessment submission.

Use these rubric dimensions exactly:
${rubricDimensions.map((item) => `- ${item}`).join("\n")}

Score each dimension from 1 to 10:
1 = poor or missing
2-3 = weak
4-5 = acceptable
6-7 = strong
8-9 = excellent
10 = exceptional

Return only JSON with this exact shape:
{
  "dimensions": [
    { "name": "Website visual hierarchy, clarity, and polish", "score": 1, "note": "short evidence-backed note" }
  ],
  "overall_score": 1,
  "summary": "short hiring-review summary",
  "score_explanation": "clear paragraph explaining why the overall score was assigned, citing the strongest and weakest evidence",
  "strengths": ["specific strength visible in the submission"],
  "concerns": ["specific concern or missing evidence"],
  "manual_review_flags": ["anything a human reviewer should double-check"],
  "recommendation": "strong_yes | yes | maybe | no",
  "skipped_files": [
    { "label": "file label", "reason": "why it was not evaluated" }
  ]
}

Submission text and links:

Task 1 - Website Redesign
Figma link: ${submission.website_figma_link || "Not provided"}
Uploaded file name: ${submission.website_file_name || "Not provided"}
Walkthrough URL: ${submission.website_walkthrough_url || "Not provided"}
Explanation:
${submission.website_explanation || "Not provided"}

Task 2 - Healthcare Product UI Flow
Figma link: ${submission.healthcare_figma_link || "Not provided"}
Uploaded file name: ${submission.healthcare_file_name || "Not provided"}
Explanation:
${submission.healthcare_explanation || "Not provided"}

Task 3 - LinkedIn B2B Asset
Graphic Figma link: ${submission.linkedin_graphic_figma_link || "Not provided"}
Uploaded graphic file name: ${submission.linkedin_graphic_file_name || "Not provided"}
LinkedIn post:
${submission.linkedin_post || "Not provided"} 

Attached image files available for visual review:
${attachedFiles.length
      ? attachedFiles
        .map(
          (file, index) =>
            `${index + 1}. ${file.label}: ${file.filename} (${file.contentType})`,
        )
        .join("\n")
      : "None"
    }

Files skipped before model evaluation:
${skippedFiles.length
      ? skippedFiles
        .map((file) => `- ${file.label}: ${file.reason}`)
        .join("\n")
      : "None"
    }

Important:
- If a visual file is attached, use it as evidence in the relevant dimension notes.
- If a task only has a Figma link and no attached image, evaluate the written reasoning but note that the visual artifact was not directly visible.
- Keep notes concise and specific.
- The score_explanation must make it easy for a human reviewer to understand why the candidate received the overall_score.
`;
}

function parseScorecard(raw: string) {
  try {
    return scorecardSchema.parse(JSON.parse(raw));
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Groq did not return parseable JSON.");
    }

    return scorecardSchema.parse(JSON.parse(jsonMatch[0]));
  }
}
