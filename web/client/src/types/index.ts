export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error' | 'image';
  content: string;
  timestamp: string;
  imageData?: string; // base64 image data
  imageAlt?: string; // alt text for the image
  savedFilename?: string; // filename if saved to downloads
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
}

export interface Config {
  aiProvider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  hasOpenAIKey: boolean;
  hasClaudeKey: boolean;
  ollamaUrl?: string;
} 