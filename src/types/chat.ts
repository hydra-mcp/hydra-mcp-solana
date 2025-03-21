export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: Message[];
}

export interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}