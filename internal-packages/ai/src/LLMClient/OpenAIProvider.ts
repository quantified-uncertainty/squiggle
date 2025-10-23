import OpenAI, { ClientOptions } from "openai";

import { MODEL_CONFIGS } from "../modelConfigs.js";
import { squiggleSystemPrompt } from "../prompts.js";
import { Message, StandardizedChatCompletion } from "./types.js";

function convertOpenAIToStandardFormat(
  openAIResponse: OpenAI.Chat.Completions.ChatCompletion
): StandardizedChatCompletion {
  const choice = openAIResponse.choices[0];
  return {
    id: openAIResponse.id,
    object: openAIResponse.object,
    created: openAIResponse.created,
    model: openAIResponse.model,
    content: choice.message.content || "",
    role: "assistant",
    finish_reason: choice.finish_reason || null,
    usage: openAIResponse.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

export class OpenAIProvider {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private modelConfig: Extract<
      (typeof MODEL_CONFIGS)[number],
      { provider: "openai" | "openrouter" }
    >,
    options: Omit<ClientOptions, "apiKey"> = {}
  ) {
    this.client = new OpenAI({
      apiKey,
      ...options,
    });
  }

  async run(conversationHistory: Message[]) {
    const messages = this.modelConfig.allowsSystemPrompt
      ? [
          { role: "system", content: squiggleSystemPrompt },
          ...conversationHistory,
        ]
      : [
          {
            role: "user",
            content: `Here are the basics of Squiggle. Read them, and then say 'Okay'. ${squiggleSystemPrompt}`,
          },
          { role: "assistant", content: "Okay." },
          ...conversationHistory,
        ];
    const completion = await this.client.chat.completions.create({
      model: this.modelConfig.model,
      messages: messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      })),
    });

    return convertOpenAIToStandardFormat(
      completion as OpenAI.Chat.Completions.ChatCompletion
    );
  }
}
