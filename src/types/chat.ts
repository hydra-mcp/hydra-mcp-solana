import { ApiResponse } from "./api";

// Message sender type
export type MessageSender = 'user' | 'ai' | 'system';

// Chat message
export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  createdAt: string;
}

// Chat session
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>; // Metadata for additional chat information like stages
}

// Processing stage
export interface ProcessingStage {
  content: string;
  message: string;
  // 0: In progress 1: Completed 2: Failed
  status: number;
}

// Chat API response
export interface ChatResponse extends ApiResponse {
  choices?: {
    message?: {
      content: string;
    };
    delta?: {
      content: string;
    };
  }[];
}

/**
 * OpenAI响应格式
 */
export interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    delta?: {
      content: string;
    };
  }[];
}