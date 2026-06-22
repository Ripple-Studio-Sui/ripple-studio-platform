import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AiMessage, AiSession, CreateAiSessionInput } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreatorCoachAgent, type CoachContext } from './creator-coach.agent';
import { OpenAiService } from './openai.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiService,
    private readonly coach: CreatorCoachAgent,
  ) {}

  async createSession(userId: string, input: CreateAiSessionInput = {}): Promise<AiSession> {
    if (input.collectionId) {
      await this.assertCollectionAccess(input.collectionId, userId);
    }

    const session = await this.prisma.aiSession.create({
      data: {
        userId,
        collectionId: input.collectionId,
        agentType: 'creator_coach',
      },
      include: { _count: { select: { messages: true } } },
    });

    return this.toSession(session);
  }

  async listSessions(userId: string): Promise<AiSession[]> {
    const sessions = await this.prisma.aiSession.findMany({
      where: { userId, agentType: 'creator_coach' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { _count: { select: { messages: true } } },
    });

    return sessions.map((s) => this.toSession(s));
  }

  async getMessages(sessionId: string, userId: string): Promise<AiMessage[]> {
    await this.assertSessionAccess(sessionId, userId);

    const messages = await this.prisma.aiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role as AiMessage['role'],
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async *streamChat(
    userId: string,
    message: string,
    sessionId?: string,
    collectionId?: string,
  ): AsyncGenerator<{ type: string; sessionId?: string; content?: string; messageId?: string; message?: string }> {
    let session = sessionId
      ? await this.prisma.aiSession.findUnique({ where: { id: sessionId } })
      : null;

    if (session && session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (!session) {
      session = await this.prisma.aiSession.create({
        data: {
          userId,
          collectionId: collectionId ?? null,
          agentType: 'creator_coach',
        },
      });
    } else if (collectionId && !session.collectionId) {
      await this.prisma.aiSession.update({
        where: { id: session.id },
        data: { collectionId },
      });
      session.collectionId = collectionId;
    }

    yield { type: 'session', sessionId: session.id };

    await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: 'user', content: message },
    });

    const [user, history, coachContext] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.aiMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
      this.buildCoachContext(userId, session.collectionId ?? collectionId),
    ]);

    const chatMessages = this.coach.buildMessages(
      message,
      history
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      {
        experienceMode: user?.experienceMode ?? 'beginner',
        displayName: user?.displayName,
        collection: coachContext,
      },
    );

    let fullResponse = '';

    try {
      for await (const token of this.openai.streamChat(chatMessages)) {
        fullResponse += token;
        yield { type: 'token', content: token };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'AI request failed';
      yield { type: 'error', message: errMsg };
      return;
    }

    const assistantMessage = await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: fullResponse },
    });

    yield { type: 'done', messageId: assistantMessage.id };
  }

  private async buildCoachContext(userId: string, collectionId?: string | null) {
    if (!collectionId) return undefined;

    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: {
        traitLayers: { select: { id: true } },
        nftItems: { select: { id: true, imageBlobId: true } },
      },
    });

    if (!collection) return undefined;

    const [metadataCount] = await Promise.all([
      this.prisma.metadataRecord.count({
        where: { nftItem: { collectionId } },
      }),
    ]);

    return {
      id: collection.id,
      name: collection.name,
      status: collection.status,
      supply: collection.supply,
      layerCount: collection.traitLayers.length,
      nftCount: collection.nftItems.length,
      walrusUploaded: collection.nftItems.filter((i) => i.imageBlobId).length,
      metadataGenerated: metadataCount,
    };
  }

  private async assertSessionAccess(sessionId: string, userId: string) {
    const session = await this.prisma.aiSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');
    return session;
  }

  private async assertCollectionAccess(collectionId: string, userId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
  }

  private toSession(session: {
    id: string;
    agentType: string | null;
    collectionId: string | null;
    createdAt: Date;
    _count: { messages: number };
  }): AiSession {
    return {
      id: session.id,
      agentType: 'creator_coach',
      collectionId: session.collectionId ?? undefined,
      createdAt: session.createdAt.toISOString(),
      messageCount: session._count.messages,
    };
  }
}