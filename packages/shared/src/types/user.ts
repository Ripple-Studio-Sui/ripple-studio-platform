import type { EXPERIENCE_MODES } from '../constants';

export type ExperienceMode = (typeof EXPERIENCE_MODES)[number];

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  suiAddress: string;
  experienceMode: ExperienceMode;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}