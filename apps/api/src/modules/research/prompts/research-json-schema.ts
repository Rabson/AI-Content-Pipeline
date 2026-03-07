export const RESEARCH_OUTPUT_SCHEMA = {
  name: 'research_notes',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'keyPoints', 'examples', 'openQuestions', 'sources', 'confidenceScore'],
    properties: {
      summary: { type: 'string' },
      confidenceScore: { type: 'number' },
      openQuestions: {
        type: 'array',
        items: { type: 'string' },
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'url', 'title', 'credibilityScore'],
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            title: { type: 'string' },
            credibilityScore: { type: 'number' },
          },
        },
      },
      keyPoints: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'point', 'importance', 'sourceIds'],
          properties: {
            id: { type: 'string' },
            point: { type: 'string' },
            importance: { type: 'string' },
            sourceIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      examples: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'title', 'description', 'takeaway', 'sourceIds'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            takeaway: { type: 'string' },
            sourceIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
} as const;
