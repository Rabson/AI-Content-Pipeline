import { TopicStatus } from '@prisma/client';

export interface TopicEntity {
  id: string;
  title: string;
  slug: string;
  brief: string | null;
  audience: string | null;
  status: TopicStatus;
  scoreTotal: string | null;
  scoreBreakdown: Record<string, unknown> | null;
  createdBy: string;
  approvedBy: string | null;
  rejectedBy: string | null;
  approvalNote: string | null;
  rejectionReason: string | null;
  researchJobId: string | null;
  researchEnqueuedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
