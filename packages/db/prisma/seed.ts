import { PrismaClient, PlanTier, TeamRole } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  // passwordHash below is a real bcrypt hash (10 rounds, matches auth.service.ts) —
  // ask whoever set it up for the plaintext password rather than storing it here.
  const user = await prisma.user.upsert({
    where: { email: 'demo@sourcetool.io' },
    update: {},
    create: {
      email: 'demo@sourcetool.io',
      name: 'Demo User',
      passwordHash: '$2b$10$QsMsLOyXiMBRoUVZU7XdmOA6/H32L4Oq5td7YQ2GwiSNVdemJPqFq',
    },
  });

  // Create demo team
  const team = await prisma.team.upsert({
    where: { id: 'demo-team' },
    update: {},
    create: {
      id: 'demo-team',
      name: 'Demo Team',
      ownerId: user.id,
    },
  });

  // Add user as team owner
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
      role: TeamRole.OWNER,
      joinedAt: new Date(),
    },
  });

  // Create free subscription
  await prisma.subscription.upsert({
    where: { teamId: team.id },
    update: {},
    create: {
      teamId: team.id,
      planTier: PlanTier.FREE,
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
