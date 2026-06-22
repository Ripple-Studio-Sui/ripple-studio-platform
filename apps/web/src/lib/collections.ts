import {
  API_ROUTES,
  type Collection,
  type CollectionDetail,
  type CreateCollectionInput,
  type UpdateAssetRarityInput,
  type UpdateCollectionInput,
  type UpdateLayersInput,
  type UploadTraitsResult,
} from '@ripple-studio/shared';
import { apiFetch } from './api';
import { getAccessToken, getRefreshToken, setTokens } from './auth/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function authHeaders(): Promise<Headers> {
  const headers = new Headers();
  let token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function listCollections(): Promise<Collection[]> {
  return apiFetch<Collection[]>(API_ROUTES.collections);
}

export async function getCollectionDetail(id: string): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`${API_ROUTES.collections}/${id}/detail`);
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  return apiFetch<Collection>(API_ROUTES.collections, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<Collection> {
  return apiFetch<Collection>(`${API_ROUTES.collections}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function uploadTraits(
  collectionId: string,
  files: File[],
): Promise<UploadTraitsResult> {
  const formData = new FormData();
  const paths: string[] = [];

  files.forEach((file) => {
    formData.append('files', file);
    paths.push((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
  });
  formData.append('paths', JSON.stringify(paths));

  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${API_ROUTES.collections}/${collectionId}/traits`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Upload failed (${res.status})`);
  }

  return res.json();
}

export async function updateLayers(
  collectionId: string,
  input: UpdateLayersInput,
): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`${API_ROUTES.collections}/${collectionId}/layers`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function updateAssetRarity(
  collectionId: string,
  input: UpdateAssetRarityInput,
): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`${API_ROUTES.collections}/${collectionId}/assets/rarity`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}