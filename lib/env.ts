import { z } from "zod";

// Validacija environment varijabli na runtime
// Dodaj ovde sve env varijable koje projekat koristi

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("Dvaipometraknjigauraznimbojama"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Dodaj po potrebi:
  // NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  // DATABASE_URL: z.string().url(),
  // AUTH_SECRET: z.string().min(32),
});

// Ovo ce baciti gresku ako env varijable nisu ispravno postavljene
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Neispravne environment varijable:");
  console.error(parsed.error.flatten().fieldErrors);
  // U produkciji, odmah zaustavi aplikaciju
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
