import { BaseAIProvider } from './base.js';
import { OpenAIProvider } from './openai.js';
import { ClaudeProvider } from './claude.js';
import { OllamaProvider } from './ollama.js';
import { Config, AIProviderType } from '../types/index.js';

export class AIProviderFactory {
  static create(config: Config): BaseAIProvider {
    switch (config.aiProvider) {
      case 'openai':
        if (!config.openai) {
          throw new Error('OpenAI configuration is missing');
        }
        return new OpenAIProvider(config.openai.apiKey, config.openai.model);

      case 'claude':
        if (!config.claude) {
          throw new Error('Claude configuration is missing');
        }
        return new ClaudeProvider(config.claude.apiKey, config.claude.model);

      case 'ollama':
        if (!config.ollama) {
          throw new Error('Ollama configuration is missing');
        }
        return new OllamaProvider(config.ollama.url, config.ollama.model);

      default:
        throw new Error(`Unsupported AI provider: ${config.aiProvider}. Use 'openai', 'claude', or 'ollama'`);
    }
  }

  static getSupportedProviders(): AIProviderType[] {
    return ['openai', 'claude', 'ollama'];
  }
} 