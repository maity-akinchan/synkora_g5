// import "dotenv/config";
// import { defineConfig, env } from "prisma/config";

// export default defineConfig({
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//   },
//   engine: "classic",
//   datasource: {
//     url: env("DATABASE_URL"),
//   },
// });

// prisma.config.ts
import path from "path";
import dotenv from "dotenv";
import { defineConfig, env as prismaEnv } from "prisma/config";

// load .env then .env.local so local overrides take precedence
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// If user set MONGODB_URI but not DATABASE_URL, use it as a fallback
if (!process.env.DATABASE_URL && process.env.MONGODB_URI) {
  process.env.DATABASE_URL = process.env.MONGODB_URI;
}

// helpful diagnostic if missing
if (!process.env.DATABASE_URL) {
  // prettier-ignore
  throw new Error(
    "Missing DATABASE_URL environment variable. Add DATABASE_URL to .env or .env.local (or set MONGODB_URI and ensure schema.prisma uses mongodb)."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // use prismaEnv helper (reads from process.env)
    url: prismaEnv("DATABASE_URL"),
  },
});
