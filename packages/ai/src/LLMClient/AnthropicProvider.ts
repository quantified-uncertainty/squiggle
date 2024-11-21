import Anthropic from "@anthropic-ai/sdk";

import { MODEL_CONFIGS } from "../modelConfigs.js";
import { squiggleSystemPrompt } from "../prompts.js";
import { Message, StandardizedChatCompletion } from "./types.js";

function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter(
      (block): block is Extract<Anthropic.ContentBlock, { type: "text" }> =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n");
}

function convertToClaudeMessages(history: Message[]): Anthropic.MessageParam[] {
  return history
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role as Exclude<Message["role"], "system">,
      content: msg.content,
    }));
}

function compressAssistantMessages(messages: Message[]): Message[] {
  return messages.reduce((acc, current, index, array) => {
    if (current.role !== "assistant") {
      acc.push(current);
    } else if (index === 0 || array[index - 1].role !== "assistant") {
      acc.push(current);
    } else {
      acc[acc.length - 1].content += "\n\n" + current.content;
    }
    return acc;
  }, [] as Message[]);
}

function convertClaudeToStandardFormat(
  claudeResponse: Anthropic.Message
): StandardizedChatCompletion {
  return {
    id: claudeResponse.id,
    object: "chat.completion",
    created: Date.now(),
    model: claudeResponse.model,
    content: extractTextContent(claudeResponse.content),
    role: "assistant",
    finish_reason: claudeResponse.stop_reason || null,
    usage: {
      prompt_tokens: claudeResponse.usage.input_tokens,
      completion_tokens: claudeResponse.usage.output_tokens,
      total_tokens:
        claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
    },
  };
}

export class AnthropicProvider {
  client: Anthropic;

  constructor(
    apiKey: string,
    private modelConfig: Extract<
      (typeof MODEL_CONFIGS)[number],
      { provider: "anthropic" }
    >
  ) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  async run(conversationHistory: Message[]) {
    const compressedMessages = compressAssistantMessages(conversationHistory);
    const claudeMessages = convertToClaudeMessages(compressedMessages);

    if (claudeMessages.length === 0) {
      throw new Error("At least one message is required");
    }

    const completion = await this.client.beta.promptCaching.messages.create({
      max_tokens: this.modelConfig.maxTokens,
      messages: claudeMessages,
      model: this.modelConfig.model,
      system: [
        {
          text: squiggleSystemPrompt,
          type: "text",
          cache_control: { type: "ephemeral" },
        },
      ],
    });

    return convertClaudeToStandardFormat(completion as Anthropic.Message);
  }
}
