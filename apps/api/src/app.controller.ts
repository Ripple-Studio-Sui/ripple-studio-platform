import { Controller, Get } from '@nestjs/common';
import { APP_NAME } from '@ripple-studio/shared';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: APP_NAME,
      version: '0.0.1',
      status: 'ok',
    };
  }
}