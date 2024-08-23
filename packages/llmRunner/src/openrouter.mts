import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
async function main() {
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-4o-2024-08-06",
    messages: [{ role: "user", content: "write a 5-line poem" }],
  });

  console.log(completion.choices[0].message);
}
main();
