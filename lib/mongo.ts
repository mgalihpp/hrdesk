import type { Db } from "mongodb";
import { MongoClient } from "mongodb";

// Shared native client. Better Auth (PR-2) and pay-run transactions (Phase 2)
// reuse this exact instance.
const url = process.env.DATABASE_URL ?? "mongodb://localhost:27017";

const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };

export const client: MongoClient =
  globalForMongo._mongoClient ?? new MongoClient(url);

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClient = client;
}

export const db: Db = client.db(process.env.DATABASE_NAME ?? "saasdesk");
