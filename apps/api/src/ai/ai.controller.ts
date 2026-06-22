import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { CreateAiSessionInput, ChatRequest } from '@ripple-studio/shared';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sessions')
  createSession(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAiSessionInput) {
    return this.aiService.createSession(user.userId, body);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.listSessions(user.userId);
  }

  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getMessages(id, user.userId);
  }

  @Post('chat')
  async streamChat(
    @Body() body: ChatRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.aiService.streamChat(
        user.userId,
        body.message,
        body.sessionId,
        body.collectionId,
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chat failed';
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      res.write('data: [DONE]\n\n');
    }

    res.end();
  }
}