export interface SuiNftMetadata {
  name: string;
  description?: string;
  image_url: string;
  attributes: Array<{ trait_type: string; value: string }>;
  project_url?: string;
}

export interface BuildMetadataInput {
  collectionId: string;
  collectionName: string;
  collectionDescription?: string | null;
  tokenId: number;
  name?: string | null;
  imageUrl: string;
  imageBlobId?: string | null;
  traits: Array<{ trait_type: string; value: string }>;
  projectUrl?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}