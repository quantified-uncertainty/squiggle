import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
loadEnv();

// Define schema for environment variables
const envSchema = z.object({
  // API Key for Claude
  ANTHROPIC_API_KEY: z.string().optional(),

  // LLM configuration
  LLM_MODEL: z.string().default("claude-3-5-sonnet-20240620"),
  RUNS_PER_SUBMISSION: z.coerce.number().int().positive().default(3),
});

// Parse environment variables with default values
export const config = envSchema.parse(process.env);

// Export specific types
export type Config = z.infer<typeof envSchema>;
