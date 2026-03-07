const MODEL_RATES_PER_MILLION_TOKENS: Record<
  string,
  { promptUsd: number; completionUsd: number }
> = {
  'gpt-4.1-mini': { promptUsd: 0.4, completionUsd: 1.6 },
  'gpt-4.1': { promptUsd: 2, completionUsd: 8 },
  'gpt-4o-mini': { promptUsd: 0.15, completionUsd: 0.6 },
};

export function estimateLlmCostUsd(params: {
  model: string;
  promptTokens: number;
  completionTokens: number;
}): number {
  const rates = MODEL_RATES_PER_MILLION_TOKENS[params.model] ?? MODEL_RATES_PER_MILLION_TOKENS['gpt-4.1-mini'];
  const promptCost = (params.promptTokens / 1_000_000) * rates.promptUsd;
  const completionCost = (params.completionTokens / 1_000_000) * rates.completionUsd;
  return Number((promptCost + completionCost).toFixed(6));
}
