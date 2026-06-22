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
  authMe: '/auth/me',
  authRefresh: '/auth/refresh',
  authZkLoginComplete: '/auth/zklogin/complete',
} as const;

export const WIZARD_STEPS = [
  'details',
  'upload',
  'layers',
  'rarity',
  'preview',
  'generate',
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  details: 'Collection info',
  upload: 'Upload traits',
  layers: 'Configure layers',
  rarity: 'Set rarity',
  preview: 'Preview',
  generate: 'Generate',
};

export const MAX_PREVIEW_COMBOS = 100;
export const PREVIEW_SAMPLE_COUNT = 12;

export const ZKLOGIN_PROVIDERS = {
  google: {
    iss: 'https://accounts.google.com',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
  },
  apple: {
    iss: 'https://appleid.apple.com',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    jwksUrl: 'https://appleid.apple.com/auth/keys',
  },
} as const;

export const EPHEMERAL_KEY_SESSION_KEY = 'ripple_ephemeral_key_pair';
export const JWT_RANDOMNESS_SESSION_KEY = 'ripple_jwt_randomness';
export const MAX_EPOCH_SESSION_KEY = 'ripple_max_epoch';
export const ACCESS_TOKEN_KEY = 'ripple_access_token';
export const REFRESH_TOKEN_KEY = 'ripple_refresh_token';