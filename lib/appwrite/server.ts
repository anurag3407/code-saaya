import { Client, Databases, Query } from "node-appwrite";

export function createAdminClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "placeholder";
  const key = process.env.APPWRITE_API_KEY || "placeholder";

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);

  return {
    databases: new Databases(client),
    client,
  };
}

export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "saaya_db";

export const COLLECTIONS = {
  USERS: "users",
  AI_PROVIDERS: "ai_providers",
  SAAYA_JOBS: "saaya_jobs",
  SAAYA_ARTIFACTS: "saaya_artifacts",
} as const;

export { Query };
