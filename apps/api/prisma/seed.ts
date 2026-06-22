import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const saltVault = await prisma.saltVault.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      encryptedSalt: 'seed-encrypted-salt-placeholder',
    },
  });

  const user = await prisma.user.upsert({
    where: {
      zkloginIss_zkloginSub_zkloginAud: {
        zkloginIss: 'https://demo.ripple.studio',
        zkloginSub: 'demo-user',
        zkloginAud: 'ripple-studio-demo',
      },
    },
    update: {},
    create: {
      zkloginIss: 'https://demo.ripple.studio',
      zkloginSub: 'demo-user',
      zkloginAud: 'ripple-studio-demo',
      suiAddress: '0x' + '1'.repeat(64),
      saltRefId: saltVault.id,
      displayName: 'Demo Creator',
      email: 'demo@ripple.studio',
      wallets: {
        create: {
          suiAddress: '0x' + '1'.repeat(64),
          isPrimary: true,
        },
      },
      memorySpaces: {
        create: [
          { spaceType: 'profile' },
          { spaceType: 'collections' },
          { spaceType: 'conversations' },
          { spaceType: 'preferences' },
        ],
      },
    },
  });

  const existing = await prisma.collection.findFirst({
    where: { userId: user.id, slug: 'cyber-explorers' },
  });

  if (!existing) {
    await prisma.collection.create({
      data: {
        userId: user.id,
        name: 'Cyber Explorers',
        slug: 'cyber-explorers',
        description: 'A fearless crew navigating the neon void of the Sui ecosystem.',
        supply: 500,
        status: 'draft',
        royaltyBps: 500,
        symbol: 'CYBER',
      },
    });
  }

  console.log('Seed complete:', { userId: user.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });