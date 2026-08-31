import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import config from "../config";

const connectionString = config.database_url || "";
const adapter = new PrismaPg({ connectionString });

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma = global.globalPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.globalPrisma = prisma;
}
