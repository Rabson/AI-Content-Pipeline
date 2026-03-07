export interface OutlineSectionInput {
  sectionKey: string;
  heading: string;
  objective: string;
  targetWords: number;
}

export interface PersistGeneratedOutlineParams {
  topicId: string;
  model: string;
  promptHash: string;
  payload: Record<string, unknown>;
  outline: {
    title: string;
    objective: string;
    sections: OutlineSectionInput[];
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
