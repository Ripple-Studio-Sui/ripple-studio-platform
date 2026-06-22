export const APP_NAME = 'Ripple Studio';

export const COLLECTION_STATUSES = [
  'draft',
  'generating',
  'generated',
  'deploying',
  'deployed',
  'published',
  'archived',
] as const;

export const EXPERIENCE_MODES = ['beginner', 'creator', 'builder'] as const;

export const SUPPORTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'svg', 'gif'] as const;

export const MVP_MAX_SUPPLY = 500;

export const API_ROUTES = {
  health: '/health',
  collections: '/collections',
  auth: '/auth',
} as const;