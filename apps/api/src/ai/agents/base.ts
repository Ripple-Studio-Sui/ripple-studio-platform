import type { AgentContext } from './types';
import { MODE_INSTRUCTIONS } from './types';

export function appendSharedContext(parts: string[], context: AgentContext): void {
  parts.push(`Coaching style (${context.experienceMode} mode): ${MODE_INSTRUCTIONS[context.experienceMode]}`);

  if (context.displayName) {
    parts.push(`Creator: ${context.displayName}`);
  }

  if (context.memoryContext) {
    parts.push(
      'Creator memory (from previous sessions and projects — use to personalize advice):',
      context.memoryContext,
    );
  }

  if (context.collection) {
    const c = context.collection;
    const layerDetail = c.traitLayers?.length
      ? ` Layers: ${c.traitLayers.map((l) => `${l.name} (${l.assetCount})`).join(', ')}.`
      : '';
    parts.push(
      `Active collection: "${c.name}" (status: ${c.status}, supply: ${c.supply}, royalty: ${((c.royaltyBps ?? 500) / 100).toFixed(1)}%, layers: ${c.layerCount}, NFTs: ${c.nftCount}, Walrus: ${c.walrusUploaded}, metadata: ${c.metadataGenerated}).${layerDetail}`,
    );
  }

  if (context.ragContext) {
    parts.push('Relevant Sui / Ripple Studio knowledge:', context.ragContext);
  }

  parts.push('Keep responses under 300 words unless the user asks for detail. Use markdown sparingly.');
}