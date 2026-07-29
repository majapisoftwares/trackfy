import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

declare global {
  var _trackfyMongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoClientOptions: MongoClientOptions = {
  appName: "trackfy.web",
  maxIdleTimeMS: 5_000,
};

function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MISSING_MONGODB_URI");
  }

  if (!global._trackfyMongoClientPromise) {
    const client = new MongoClient(uri, mongoClientOptions);
    attachDatabasePool(client);
    global._trackfyMongoClientPromise = client.connect();
  }

  return global._trackfyMongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db(process.env.MONGODB_DB?.trim() || "trackfy");
}
