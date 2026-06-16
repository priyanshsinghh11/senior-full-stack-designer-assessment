import { GridFSBucket, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return new Response("Invalid file id.", { status: 400 });
  }

  const _id = new ObjectId(id);
  const db = await getMongoDb();
  const meta = await db.collection("uploads.files").findOne({ _id });

  if (!meta) {
    return new Response("File not found.", { status: 404 });
  }

  const bucket = new GridFSBucket(db, { bucketName: "uploads" });
  const chunks: Buffer[] = [];

  try {
    for await (const chunk of bucket.openDownloadStream(_id)) {
      chunks.push(chunk as Buffer);
    }
  } catch {
    return new Response("Could not read file.", { status: 500 });
  }

  const contentType =
    (meta.metadata?.contentType as string | undefined) ||
    (meta.contentType as string | undefined) ||
    "application/octet-stream";

  return new Response(Buffer.concat(chunks), {
    headers: {
      "Content-Type": contentType,
      // inline = show in the browser; the filename is used if the user saves it
      "Content-Disposition": `inline; filename="${meta.filename ?? "file"}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
