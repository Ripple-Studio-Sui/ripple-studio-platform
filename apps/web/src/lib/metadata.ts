import { API_ROUTES } from '@ripple-studio/shared';
import type { MetadataJobStatus, MetadataSummary } from '@ripple-studio/shared';
import { getAccessToken, getRefreshToken, setTokens } from './auth/storage';
import { apiFetch } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function startMetadataGeneration(collectionId: string): Promise<MetadataJobStatus> {
  return apiFetch<MetadataJobStatus>(`/collections/${collectionId}/metadata/generate`, {
    method: 'POST',
  });
}

export async function getMetadataStatus(collectionId: string): Promise<MetadataJobStatus> {
  return apiFetch<MetadataJobStatus>(`/collections/${collectionId}/metadata/status`);
}

export async function getMetadataSummary(collectionId: string): Promise<MetadataSummary> {
  return apiFetch<MetadataSummary>(`/collections/${collectionId}/metadata/summary`);
}

export async function downloadMetadataZip(collectionId: string, filename: string): Promise<void> {
  const headers = new Headers();
  let token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(`${API_URL}/collections/${collectionId}/metadata/export`, { headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshRes = await fetch(`${API_URL}${API_ROUTES.authRefresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      headers.set('Authorization', `Bearer ${data.tokens.accessToken}`);
      res = await fetch(`${API_URL}/collections/${collectionId}/metadata/export`, { headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}