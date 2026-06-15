import { NextResponse } from "next/server";
import { z } from "zod";
import { getMongoDb } from "@/lib/mongodb";

const candidateSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  resumeLink: z.string().trim().url(),
});

export async function POST(request: Request) {
  try {
    const values = candidateSchema.parse(await request.json());
    const now = new Date();
    const db = await getMongoDb();

    const result = await db.collection("candidates").insertOne({
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      resume_url: values.resumeLink.trim(),
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ id: result.insertedId.toString() });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving candidate information.",
      },
      { status: 400 },
    );
  }
}
