import { Client, Databases, Account } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);
export const account = new Account(client);
export { client };

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";

// Collection IDs — will be created via setup script
export const COLLECTIONS = {
  USERS: "users",
  AI_PROVIDERS: "ai_providers",
  SAAYA_JOBS: "saaya_jobs",
  SAAYA_ARTIFACTS: "saaya_artifacts",
} as const;
