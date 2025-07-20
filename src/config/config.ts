import dotenv from "dotenv";
import { Config, AIProviderType } from '../types/index.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    dotenv.config();
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    const aiProvider = (process.env.AI_PROVIDER || "openai") as AIProviderType;
    
    if (!['openai', 'claude', 'ollama'].includes(aiProvider)) {
      throw new Error(`Invalid AI_PROVIDER: ${aiProvider}. Must be 'openai', 'claude', or 'ollama'`);
    }

    const config: Config = {
      aiProvider,
    };

    switch (aiProvider) {
      case 'openai':
        const openaiKey = process.env.OPENAI_API_KEY;
        const openaiModel = process.env.OPENAI_MODEL;
        if (!openaiKey) {
          throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
        }
        if (!openaiModel) {
          throw new Error('OPENAI_MODEL is required when using OpenAI provider (e.g., gpt-4o-mini, gpt-4o, gpt-3.5-turbo)');
        }
        config.openai = {
          apiKey: openaiKey,
          model: openaiModel,
        };
        break;

      case 'claude':
        const claudeKey = process.env.ANTHROPIC_API_KEY;
        const claudeModel = process.env.CLAUDE_MODEL;
        if (!claudeKey) {
          throw new Error('ANTHROPIC_API_KEY is required when using Claude provider');
        }
        if (!claudeModel) {
          throw new Error('CLAUDE_MODEL is required when using Claude provider (e.g., claude-3-5-sonnet-20241022, claude-3-haiku-20240307)');
        }
        config.claude = {
          apiKey: claudeKey,
          model: claudeModel,
        };
        break;

      case 'ollama':
        const ollamaUrl = process.env.OLLAMA_URL;
        const ollamaModel = process.env.OLLAMA_MODEL;
        if (!ollamaUrl) {
          throw new Error('OLLAMA_URL is required when using Ollama provider (e.g., http://localhost:11434)');
        }
        if (!ollamaModel) {
          throw new Error('OLLAMA_MODEL is required when using Ollama provider (e.g., llama3.2, qwen2.5, mistral)');
        }
        config.ollama = {
          url: ollamaUrl,
          model: ollamaModel,
        };
        break;
    }

    return config;
  }

  getConfig(): Config {
    return { ...this.config };
  }

  getAIProvider(): AIProviderType {
    return this.config.aiProvider;
  }

  // Utility methods for easy access
  getOpenAIConfig() {
    return this.config.openai;
  }

  getClaudeConfig() {
    return this.config.claude;
  }

  getOllamaConfig() {
    return this.config.ollama;
  }

  // Print configuration summary (without sensitive data)
  printConfigSummary(): void {
    console.log(`🤖 AI Provider: ${this.config.aiProvider.toUpperCase()}`);
    
    switch (this.config.aiProvider) {
      case 'openai':
        console.log(`   Model: ${this.config.openai?.model}`);
        console.log(`   API Key: ${this.config.openai?.apiKey ? '***configured***' : '❌ missing'}`);
        break;
      case 'claude':
        console.log(`   Model: ${this.config.claude?.model}`);
        console.log(`   API Key: ${this.config.claude?.apiKey ? '***configured***' : '❌ missing'}`);
        break;
      case 'ollama':
        console.log(`   URL: ${this.config.ollama?.url}`);
        console.log(`   Model: ${this.config.ollama?.model}`);
        break;
    }
  }
} 