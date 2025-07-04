import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { D1AssignmentManager } from '../utils/d1Helpers'; // pastikan path sesuai

let openrouter: any;

interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/ai": "yo, tanyakan padaku tentang tugas ataupun itu",
};

// Basic command handler yang fleksibel
export async function basicCommands(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  command: string,
  customResponse?: string,
  fullMessage?: string, // tambahkan argumen untuk pesan penuh
  openRouterKey?: string // tambahkan argumen untuk openrouter key
  db?: D1Database // pastikan argumen db diteruskan

) {
  // Initialize openrouter dengan API key dari environment
  if (openRouterKey) {
    openrouter = createOpenRouter({ apiKey: openRouterKey });
  }
  
  // Gunakan custom response jika ada, atau ambil dari predefined responses
  let prompt = customResponse || COMMAND_RESPONSES[command];

  // Jika command adalah /ai dan ada fullMessage, ambil kalimat setelah /ai
  if (command === '/ai' && fullMessage) {
    prompt = fullMessage.replace('/ai', '').trim();
    if (!prompt) prompt = 'yo, tanyakan padaku tentang tugas ataupun itu';
  }

  const { text } = await generateText({
    model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
    tools: {
      database_tugas: tool({
        description: 'Get the database of assignments',
        parameters: z.object({
          query: z.string().describe('Query for assignments, e.g. "all"'),
        }),
        execute: async ({ query }) => {
          if (!db) return { error: "Database not available" };
          const manager = new D1AssignmentManager(db);
          const assignments = await manager.getAllAssignments();
          // Return as array of objects
          return { assignments };
        },
      }),
    },
    maxSteps: 2,
    prompt,
  });

  if (!prompt) {
    throw new Error(`Command "${command}" not found and no custom response provided`);
  }

  const apiUrl = baseUrl + "/api/sendText";
  const bodyData = {
    chatId: chatId,
    reply_to: reply_to,
    text: text,
    session: session,
  };

  const apiResp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(bodyData),
  });

  const apiResult = await apiResp.text();
  return { status: "sent", sent: bodyData, apiResult };
}

// Wrapper functions untuk backward compatibility (opsional) (dan gakepake)
export async function handleAIResponse(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  fullMessage?: string, // tambahkan argumen untuk pesan penuh
  openRouterKey?: string // tambahkan argumen untuk openrouter key
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/ai", undefined, fullMessage, openRouterKey);
}
