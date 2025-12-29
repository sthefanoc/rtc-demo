import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};