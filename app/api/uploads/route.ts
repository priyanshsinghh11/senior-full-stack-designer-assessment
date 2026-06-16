import { GridFSBucket } from "mongodb";
import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "application/pdf"];

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, or PDF allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 15MB)." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const fileId = await new Promise<string>((resolve, reject) => {
      const stream = bucket.openUploadStream(file.name, {
        metadata: { contentType: file.type },
      });

      stream.on("error", reject);
      stream.on("finish", () => resolve(stream.id.toString()));
      stream.end(buffer);
    });

    return NextResponse.json({
      fileId,
      fileName: file.name,
      contentType: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}
