import type { BuildMetadataInput, SuiNftMetadata } from './types';

function buildDescription(input: BuildMetadataInput): string {
  if (input.collectionDescription?.trim()) {
    const traitSummary = input.traits.map((t) => `${t.trait_type}: ${t.value}`).join(', ');
    return `${input.collectionDescription.trim()} Traits — ${traitSummary}.`;
  }

  const traitSummary = input.traits.map((t) => `${t.trait_type}: ${t.value}`).join(', ');
  return `A unique piece from the ${input.collectionName} collection.${traitSummary ? ` Traits — ${traitSummary}.` : ''}`;
}

export function buildSuiMetadata(input: BuildMetadataInput): SuiNftMetadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

  return {
    name: input.name ?? `${input.collectionName} #${input.tokenId}`,
    description: buildDescription(input),
    image_url: input.imageUrl,
    attributes: input.traits.map((t) => ({
      trait_type: t.trait_type,
      value: t.value,
    })),
    project_url: input.projectUrl ?? `${appUrl}/collections/${input.collectionId}`,
  };
}