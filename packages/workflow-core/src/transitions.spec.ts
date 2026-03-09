import { ContentState, TopicStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  canContentTransition,
  canTopicTransition,
  topicToContentState,
} from './transitions';

describe('workflow transitions', () => {
  it('validates topic transitions', () => {
    expect(canTopicTransition(TopicStatus.SUBMITTED, TopicStatus.SCORED)).toBe(true);
    expect(canTopicTransition(TopicStatus.SUBMITTED, TopicStatus.RESEARCH_READY)).toBe(false);
  });

  it('validates content transitions', () => {
    expect(canContentTransition(ContentState.OUTLINE_READY, ContentState.DRAFT_IN_PROGRESS)).toBe(true);
    expect(canContentTransition(ContentState.OUTLINE_READY, ContentState.PUBLISHED)).toBe(false);
  });

  it('maps topic status to content state', () => {
    expect(topicToContentState(TopicStatus.APPROVED)).toBe(ContentState.APPROVED);
    expect(topicToContentState(TopicStatus.ARCHIVED)).toBe(ContentState.ARCHIVED);
  });
});
