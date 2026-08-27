import type { Db, Document, Filter } from "mongodb";
import { describe, expect, it } from "vitest";
import { tenantCollection } from "./tenant";
import type { TenantId } from "./types";

const TENANT_A = "org_a" as TenantId;
const TENANT_B = "org_b" as TenantId;
interface Rec extends Document {
  tenantId: TenantId;
  name: string;
}

interface FakeCollection {
  find: (filter: Filter<Rec>) => { toArray: () => Promise<Rec[]> };
  findOne: (filter: Filter<Rec>) => Promise<Rec | null>;
  insertOne: (doc: Rec) => Promise<{ insertedId: string }>;
  updateOne: () => Promise<{ modifiedCount: number }>;
  deleteOne: () => Promise<{ deletedCount: number }>;
}

function fakeDb() {
  const store: Rec[] = [];
  const collection: FakeCollection = {
    find: (filter: Filter<Rec>) => ({
      toArray: async () => store.filter((d) => match(d, filter)),
    }),
    findOne: async (filter: Filter<Rec>) =>
      store.find((d) => match(d, filter)) ?? null,
    insertOne: async (doc: Rec) => {
      store.push(doc);
      return { insertedId: "x" };
    },
    updateOne: async () => ({ modifiedCount: 1 }),
    deleteOne: async () => ({ deletedCount: 1 }),
  };
  const mongo = { collection: () => collection } as unknown as Db;
  return { mongo, store };
}

function match(doc: Rec, filter: Filter<Rec>): boolean {
  return Object.entries(filter).every(
    ([k, v]) => (doc as Record<string, unknown>)[k] === v,
  );
}

describe("tenantCollection", () => {
  it("injects tenantId on insert and scopes reads", async () => {
    const { mongo, store } = fakeDb();
    const repo = tenantCollection<Rec>(mongo, "recs", TENANT_A);
    await repo.insertOne({ name: "x" });
    const scoped = await repo.findMany();
    expect(scoped).toHaveLength(1);
    expect(scoped[0]?.tenantId).toBe(TENANT_A);

    store.push({ tenantId: TENANT_B, name: "y" });
    const stillScoped = await repo.findMany();
    expect(stillScoped).toHaveLength(1);
    expect(stillScoped[0]?.name).toBe("x");
  });

  it("overrides a caller-supplied tenantId in the filter", async () => {
    const { mongo } = fakeDb();
    const repo = tenantCollection<Rec>(mongo, "recs", TENANT_A);
    const res = await repo.findMany({ tenantId: TENANT_B } as Filter<Rec>);
    expect(res).toEqual([]);
  });
});
