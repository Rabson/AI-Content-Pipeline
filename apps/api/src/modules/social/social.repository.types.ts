export interface LinkedInDraftPayload {
  platform: 'LINKEDIN';
  headline: string;
  post: string;
  hashtags: string[];
  callToAction: string;
}

export interface SocialUsagePayload {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface PersistGeneratedLinkedInDraftParams {
  topicId: string;
  payload: LinkedInDraftPayload;
  model: string;
  promptHash: string;
  usage?: SocialUsagePayload;
}
