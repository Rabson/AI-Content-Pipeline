import { PrismaClient, TopicStatus } from '@prisma/client';

const prisma = new PrismaClient();

const seeds = [
  {
    title: 'BullMQ retry policy patterns for AI content pipelines',
    slug: 'bullmq-retry-policy-patterns-for-ai-content-pipelines',
    brief: 'Document practical retry classification and replay patterns for queue-backed content systems.',
    audience: 'platform engineers',
    status: TopicStatus.APPROVED,
    createdBy: 'seed-script',
    approvedBy: 'seed-script',
    approvedAt: new Date(),
  },
  {
    title: 'Designing section-level revision workflows with immutable draft versions',
    slug: 'designing-section-level-revision-workflows-with-immutable-draft-versions',
    brief: 'Explain why draft regeneration must stay section-scoped for auditability and human review.',
    audience: 'engineering managers',
    status: TopicStatus.SCORED,
    createdBy: 'seed-script',
  },
];

async function main() {
  for (const seed of seeds) {
    await prisma.topic.upsert({
      where: { slug: seed.slug },
      update: {
        brief: seed.brief,
        audience: seed.audience,
        status: seed.status,
      },
      create: seed,
    });
  }

  console.log(`Seeded ${seeds.length} demo topics.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
