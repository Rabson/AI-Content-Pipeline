import prismaPkg from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();
const users = [
  { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', password: 'AdminPass123!' },
  { email: 'editor@example.com', name: 'Editor User', role: 'EDITOR', password: 'EditorPass123!' },
  { email: 'reviewer@example.com', name: 'Reviewer User', role: 'REVIEWER', password: 'ReviewerPass123!' },
  { email: 'normal_user@example.com', name: 'Normal User', role: 'USER', password: 'UserPass123!' },
];

const seeds = [
  {
    title: 'BullMQ retry policy patterns for AI content pipelines',
    slug: 'bullmq-retry-policy-patterns-for-ai-content-pipelines',
    brief: 'Document practical retry classification and replay patterns for queue-backed content systems.',
    audience: 'platform engineers',
    status: 'APPROVED',
    createdBy: 'seed-script',
    approvedBy: 'seed-script',
    approvedAt: new Date(),
  },
  {
    title: 'Designing section-level revision workflows with immutable draft versions',
    slug: 'designing-section-level-revision-workflows-with-immutable-draft-versions',
    brief: 'Explain why draft regeneration must stay section-scoped for auditability and human review.',
    audience: 'engineering managers',
    status: 'SCORED',
    createdBy: 'seed-script',
  },
];

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function seedUsers() {
  const created = [];
  for (const user of users) {
    created.push(await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true, passwordHash: hashPassword(user.password) },
      create: { email: user.email, name: user.name, role: user.role, passwordHash: hashPassword(user.password) },
    }));
  }
  return created;
}

async function main() {
  const seededUsers = await seedUsers();
  const defaultOwner = seededUsers.find((user) => user.role === 'USER');
  const approvedTopics = [];

  for (const seed of seeds) {
    const topic = await prisma.topic.upsert({
      where: { slug: seed.slug },
      update: { brief: seed.brief, audience: seed.audience, status: seed.status, ownerUserId: seed.status === 'APPROVED' ? defaultOwner?.id : null },
      create: { ...seed, ownerUserId: seed.status === 'APPROVED' ? defaultOwner?.id : undefined },
    });
    if (topic.status === 'APPROVED') {
      approvedTopics.push(topic);
    }
  }

  for (const topic of approvedTopics) {
    const draft = await prisma.draftVersion.upsert({
      where: { topicId_versionNumber: { topicId: topic.id, versionNumber: 1 } },
      update: {
        status: 'APPROVED',
        assembledMarkdown: '# BullMQ retry policy patterns for AI content pipelines\n\nThis is a seeded approved draft for publish workflow verification.',
        approvedBy: 'seed-script',
        approvedAt: new Date(),
      },
      create: {
        topicId: topic.id,
        versionNumber: 1,
        status: 'APPROVED',
        assembledMarkdown: '# BullMQ retry policy patterns for AI content pipelines\n\nThis is a seeded approved draft for publish workflow verification.',
        createdBy: 'seed-script',
        approvedBy: 'seed-script',
        approvedAt: new Date(),
      },
    });

    const contentItem = topic.contentItemId
      ? await prisma.contentItem.update({
        where: { id: topic.contentItemId },
        data: {
          currentState: 'READY_TO_PUBLISH',
          currentDraftVersionId: draft.id,
          latestApprovedDraftVersionId: draft.id,
          lockedForPublish: false,
        },
      })
      : await prisma.contentItem.create({
        data: {
          currentState: 'READY_TO_PUBLISH',
          currentDraftVersionId: draft.id,
          latestApprovedDraftVersionId: draft.id,
        },
      });

    if (topic.contentItemId !== contentItem.id) {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { contentItemId: contentItem.id },
      });
    }
  }

  console.log(`Seeded ${seededUsers.length} users, ${seeds.length} demo topics, and ${approvedTopics.length} publish-ready drafts.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
