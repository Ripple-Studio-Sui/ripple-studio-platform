import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenAiService {
  private client: OpenAI | null = null;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'AI is not configured — set OPENAI_API_KEY in your environment',
        );
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const client = this.getClient();
    const stream = await client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}