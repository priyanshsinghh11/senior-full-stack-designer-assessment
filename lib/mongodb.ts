import { MongoClient, type Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || "senior_assessment";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri() {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return mongoUri;
}

export function getMongoClient() {
  if (process.env.NODE_ENV === "development") {
    globalThis.mongoClientPromise ??= new MongoClient(getMongoUri()).connect();
    return globalThis.mongoClientPromise;
  }

  return new MongoClient(getMongoUri()).connect();
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}
