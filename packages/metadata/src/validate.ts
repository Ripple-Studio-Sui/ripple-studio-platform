import type { SuiNftMetadata, ValidationResult } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateSuiMetadata(
  metadata: unknown,
  options?: { imageBlobId?: string | null; requireWalrusImage?: boolean },
): ValidationResult {
  const errors: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, errors: ['Metadata must be a JSON object'] };
  }

  const record = metadata as Record<string, unknown>;

  if (!isNonEmptyString(record.name)) {
    errors.push('name is required and must be a non-empty string');
  }

  if (record.description !== undefined && typeof record.description !== 'string') {
    errors.push('description must be a string when provided');
  }

  if (!isNonEmptyString(record.image_url)) {
    errors.push('image_url is required and must be a non-empty string');
  } else if (!isValidUrl(record.image_url as string)) {
    errors.push('image_url must be a valid URL');
  } else if (options?.requireWalrusImage && !record.image_url.toString().includes('walrus')) {
    errors.push('image_url must point to Walrus storage before metadata upload');
  }

  if (options?.imageBlobId && isNonEmptyString(record.image_url)) {
    if (!record.image_url.includes(options.imageBlobId)) {
      errors.push('image_url must reference the NFT image blob ID');
    }
  }

  if (!Array.isArray(record.attributes)) {
    errors.push('attributes must be an array');
  } else {
    record.attributes.forEach((attr, index) => {
      if (!attr || typeof attr !== 'object') {
        errors.push(`attributes[${index}] must be an object`);
        return;
      }
      const trait = attr as Record<string, unknown>;
      if (!isNonEmptyString(trait.trait_type)) {
        errors.push(`attributes[${index}].trait_type is required`);
      }
      if (!isNonEmptyString(trait.value)) {
        errors.push(`attributes[${index}].value is required`);
      }
    });
  }

  if (record.project_url !== undefined) {
    if (!isNonEmptyString(record.project_url) || !isValidUrl(record.project_url as string)) {
      errors.push('project_url must be a valid URL when provided');
    }
  }

  return { valid: errors.length === 0, errors };
}