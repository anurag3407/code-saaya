import { Client, Databases, Query } from "node-appwrite";

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    databases: new Databases(client),
    client,
  };
}

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

export const COLLECTIONS = {
  USERS: "users",
  AI_PROVIDERS: "ai_providers",
  SAAYA_JOBS: "saaya_jobs",
  SAAYA_ARTIFACTS: "saaya_artifacts",
} as const;

export { Query };
