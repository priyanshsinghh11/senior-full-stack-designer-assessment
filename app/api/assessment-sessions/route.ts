import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getMongoDb } from "@/lib/mongodb";

const sessionSchema = z.object({
  candidateId: z.string().trim().min(1),
  assessmentName: z.string().trim().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { error: "A valid assessment session id is required." },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    const session = await db.collection("assessment_sessions").findOne({
      _id: new ObjectId(sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Assessment session was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: session._id.toString(),
      candidate_id: session.candidate_id,
      assessment_name: session.assessment_name,
      status: session.status,
      started_at: session.started_at?.toISOString() ?? null,
      expires_at: session.expires_at?.toISOString() ?? null,
      submitted_at: session.submitted_at?.toISOString() ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the assessment session.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const values = sessionSchema.parse(await request.json());

    if (!ObjectId.isValid(values.candidateId)) {
      return NextResponse.json(
        { error: "A valid candidate id is required." },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    const candidate = await db.collection("candidates").findOne({
      _id: new ObjectId(values.candidateId),
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate information was not found. Please complete Page 1 again." },
        { status: 404 },
      );
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 4 * 60 * 60 * 1000);

    const result = await db.collection("assessment_sessions").insertOne({
      candidate_id: values.candidateId,
      assessment_name: values.assessmentName,
      status: "started",
      started_at: startedAt,
      expires_at: expiresAt,
      submitted_at: null,
      created_at: startedAt,
      updated_at: startedAt,
    });

    return NextResponse.json({
      id: result.insertedId.toString(),
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while starting the assessment.",
      },
      { status: 400 },
    );
  }
}
