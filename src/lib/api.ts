import { OpenAIResponse } from '@/types/chat';

const MOCK_DELAY = 1000;
const MOCK_RESPONSES = [
  "I understand your question. Let me help you with that.",
  "That's an interesting point. Here's what I think...",
  "Based on my analysis, I would suggest...",
  "Let me break this down for you...",
];

export async function sendMessage(message: string): Promise<OpenAIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  // Simulate OpenAI response format
  return {
    id: Date.now().toString(),
    choices: [
      {
        message: {
          content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)] +
            " " + message,
        },
      },
    ],
  };
}