export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIModelOption {
  id: AIProvider;
  name: string;
  description: string;
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'gemini', name: 'Gemini Flash', description: 'Fast and cost-effective' },
  { id: 'openai', name: 'GPT-4o', description: 'High accuracy' },
  { id: 'anthropic', name: 'Claude Sonnet', description: 'Balanced performance' },
];
