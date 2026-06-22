export type MetadataJobPhase = 'generating' | 'uploading' | 'done';

export interface MetadataJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  phase: MetadataJobPhase;
  progress: number;
  total: number;
  generated: number;
  uploaded: number;
  failed: number;
  error?: string;
}

export interface SuiNftMetadataPreview {
  name: string;
  description?: string;
  image_url: string;
  attributes: Array<{ trait_type: string; value: string }>;
  project_url?: string;
}

export interface MetadataSummary {
  total: number;
  generated: number;
  uploaded: number;
  readyForExport: boolean;
}