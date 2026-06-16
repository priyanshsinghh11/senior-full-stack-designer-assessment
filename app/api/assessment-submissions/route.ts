import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateSubmission } from "@/lib/evaluation";
import { getMongoDb } from "@/lib/mongodb";

const draftSchema = z.object({
  websiteFigmaLink: z.string(),
  websiteFileName: z.string(),
  websiteFileId: z.string().optional().default(""),
  websiteExplanation: z.string(),
  healthcareFigmaLink: z.string(),
  healthcareFileName: z.string(),
  healthcareFileId: z.string().optional().default(""),
  healthcareExplanation: z.string(),
  linkedinPost: z.string(),
  marketingFileName: z.string(),
  marketingFileId: z.string().optional().default(""),
  marketingFigmaLink: z.string(),
  videoUrl: z.string(),
  aiWorkflowNote: z.string().optional().default(""),
  aiAssistLevel: z.string().optional().default(""),
});

const submissionSchema = z.object({
  candidateId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  draft: draftSchema,
});

export async function POST(request: Request) {
  try {
    const values = submissionSchema.parse(await request.json());

    if (
      !ObjectId.isValid(values.candidateId) ||
      !ObjectId.isValid(values.sessionId)
    ) {
      return NextResponse.json(
        { error: "Valid candidate and session ids are required." },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    const session = await db.collection("assessment_sessions").findOne({
      _id: new ObjectId(values.sessionId),
      candidate_id: values.candidateId,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Assessment session was not found. Please start again." },
        { status: 404 },
      );
    }

    const submittedAt = new Date();
    const draft = values.draft;

    await db.collection("assessment_submissions").updateOne(
      { assessment_session_id: values.sessionId },
      {
        $set: {
          candidate_id: values.candidateId,
          assessment_session_id: values.sessionId,
          website_figma_link: draft.websiteFigmaLink.trim() || null,
          website_file_name: draft.websiteFileName || null,
          website_file_id: draft.websiteFileId || null,
          website_explanation: draft.websiteExplanation.trim(),
          website_walkthrough_url: draft.videoUrl.trim(),
          healthcare_figma_link: draft.healthcareFigmaLink.trim() || null,
          healthcare_file_name: draft.healthcareFileName || null,
          healthcare_file_id: draft.healthcareFileId || null,
          healthcare_explanation: draft.healthcareExplanation.trim(),
          linkedin_post: draft.linkedinPost.trim(),
          linkedin_graphic_file_name: draft.marketingFileName || null,
          linkedin_graphic_file_id: draft.marketingFileId || null,
          linkedin_graphic_figma_link: draft.marketingFigmaLink.trim() || null,
          ai_workflow_note: draft.aiWorkflowNote.trim() || null,
          ai_assist_level: draft.aiAssistLevel || null,
          submitted_payload: draft,
          evaluation_status: "pending",
          evaluation_error: null,
          submitted_at: submittedAt,
          updated_at: submittedAt,
        },
        $setOnInsert: {
          created_at: submittedAt,
        },
      },
      { upsert: true },
    );

    await db.collection("assessment_sessions").updateOne(
      { _id: new ObjectId(values.sessionId) },
      {
        $set: {
          status: "submitted",
          submitted_at: submittedAt,
          updated_at: submittedAt,
        },
      },
    );

    void evaluateSubmission(values.sessionId).catch((error) => {
      console.error("Automatic evaluation failed:", error);
    });

    return NextResponse.json({ submitted_at: submittedAt.toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting the assessment.",
      },
      { status: 400 },
    );
  }
}
