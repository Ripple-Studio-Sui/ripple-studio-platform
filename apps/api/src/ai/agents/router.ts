import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';

interface RouteRule {
  agent: AiAgentType;
  keywords: string[];
  weight: number;
}

const ROUTE_RULES: RouteRule[] = [
  {
    agent: 'metadata',
    weight: 3,
    keywords: [
      'metadata',
      'attribute',
      'display',
      'json',
      'schema',
      'trait_type',
      'image_url',
      'project_url',
      'export',
      'zip',
    ],
  },
  {
    agent: 'marketplace',
    weight: 3,
    keywords: [
      'marketplace',
      'tradeport',
      'bluemove',
      'clutchy',
      'listing',
      'list',
      'sell',
      'floor',
      'pricing',
      'launch price',
      'secondary',
    ],
  },
  {
    agent: 'deployment',
    weight: 3,
    keywords: [
      'deploy',
      'deployment',
      'move',
      'package',
      'gas',
      'mint',
      'on-chain',
      'onchain',
      'testnet',
      'mainnet',
      'publisher',
      'transfer policy',
      'kiosk',
    ],
  },
  {
    agent: 'nft_architect',
    weight: 2,
    keywords: [
      'trait',
      'layer',
      'rarity',
      'supply',
      'lore',
      'theme',
      'combination',
      'combinations',
      'design',
      'art style',
      'collection structure',
      'similar to',
      'darker',
      'variant',
    ],
  },
  {
    agent: 'support',
    weight: 2,
    keywords: [
      'error',
      'failed',
      'stuck',
      'not working',
      "doesn't work",
      'broken',
      'why is',
      'status',
      'troubleshoot',
      'fix',
      'help me with',
    ],
  },
];

@Injectable()
export class IntentRouter {
  route(message: string, preferred?: AiAgentType): AiAgentType {
    if (preferred) return preferred;

    const lower = message.toLowerCase();
    const scores = new Map<AiAgentType, number>();

    for (const rule of ROUTE_RULES) {
      let score = 0;
      for (const keyword of rule.keywords) {
        if (lower.includes(keyword)) score += rule.weight;
      }
      if (score > 0) scores.set(rule.agent, (scores.get(rule.agent) ?? 0) + score);
    }

    if (!scores.size) return 'creator_coach';

    return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
}