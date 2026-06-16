import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateSubmission } from "@/lib/evaluation";

export const runtime = "nodejs";

const evaluateRequestSchema = z.object({
  sessionId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const { sessionId } = evaluateRequestSchema.parse(await request.json());
    const scorecard = await evaluateSubmission(sessionId);

    return NextResponse.json({ scorecard });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while evaluating the submission.",
      },
      { status: 400 },
    );
  }
}
