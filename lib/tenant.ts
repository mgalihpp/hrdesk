import type {
  Db,
  Filter,
  MatchKeysAndValues,
  OptionalUnlessRequiredId,
} from "mongodb";
import type { TenantId } from "./types";

// Every tenant-scoped record carries tenantId. The repository factory injects it
// from the session, so a caller cannot formulate a raw cross-tenant query. This
// is the MongoDB substitute for Postgres row-level security.
export interface TenantScoped {
  tenantId: TenantId;
}

export function tenantCollection<T extends TenantScoped>(
  mongo: Db,
  name: string,
  tenantId: TenantId,
) {
  const col = mongo.collection<T>(name);
  return {
    findMany(filter: Filter<T> = {}) {
      return col.find({ ...filter, tenantId } as Filter<T>).toArray();
    },
    findOne(filter: Filter<T> = {}) {
      return col.findOne({ ...filter, tenantId } as Filter<T>);
    },
    insertOne(doc: Omit<T, "_id" | "tenantId">) {
      return col.insertOne({ ...doc, tenantId } as OptionalUnlessRequiredId<T>);
    },
    updateOne(filter: Filter<T>, update: Partial<Omit<T, "tenantId">>) {
      return col.updateOne({ ...filter, tenantId } as Filter<T>, {
        $set: { ...update, tenantId } as MatchKeysAndValues<T>,
      });
    },
    deleteOne(filter: Filter<T> = {}) {
      return col.deleteOne({ ...filter, tenantId } as Filter<T>);
    },
  };
}
