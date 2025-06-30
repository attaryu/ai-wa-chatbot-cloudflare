import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: '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',
});

interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/ai": "selamat pagi bang, saya siap membantu anda",
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
  fullMessage?: string // tambahkan argumen untuk pesan penuh
) {
  // Gunakan custom response jika ada, atau ambil dari predefined responses
  let prompt = customResponse || COMMAND_RESPONSES[command];

  // Jika command adalah /ai dan ada fullMessage, ambil kalimat setelah /ai
  if (command === '/ai' && fullMessage) {
    prompt = fullMessage.replace('/ai', '').trim();
    if (!prompt) prompt = 'Halo! Ada yang bisa saya bantu?';
  }

  const { text } = await generateText({
    model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
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
  fullMessage?: string // tambahkan argumen untuk pesan penuh
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/ai", undefined, fullMessage);
}
