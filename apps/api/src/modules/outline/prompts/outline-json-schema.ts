export const OUTLINE_OUTPUT_SCHEMA = {
  name: 'outline_result',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'objective', 'sections'],
    properties: {
      title: { type: 'string' },
      objective: { type: 'string' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['sectionKey', 'heading', 'objective', 'targetWords'],
          properties: {
            sectionKey: { type: 'string' },
            heading: { type: 'string' },
            objective: { type: 'string' },
            targetWords: { type: 'number' },
          },
        },
      },
    },
  },
} as const;
