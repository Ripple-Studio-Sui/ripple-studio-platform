import { Injectable } from '@nestjs/common';
import { formatKnowledgeContext, retrieveKnowledge } from '@ripple-studio/ai-knowledge';

@Injectable()
export class RagService {
  getContextForQuery(query: string): string {
    const chunks = retrieveKnowledge(query, 4);
    return formatKnowledgeContext(chunks);
  }
}