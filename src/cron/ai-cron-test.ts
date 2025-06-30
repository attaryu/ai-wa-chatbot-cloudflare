import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

// AI Cron Test - Kirim pesan WhatsApp setiap menit menggunakan AI
export async function aiCronTest(env: any) {
  try {
    // Get OpenRouter API key from environment (secret store)
    const openrouterKey = env.openrouter_key ? await env.openrouter_key.get() : undefined;
    if (!openrouterKey) {
      console.error('OpenRouter API key not found in environment');
      return;
    }

    // Get WhatsApp API credentials (plain string bindings)
    const baseUrl = env.base_url_name;
    const session = env.session_name;
    const apiKey = env.api_key ? await env.api_key.get() : undefined;

    if (!baseUrl || !session || !apiKey) {
      console.error('WhatsApp API credentials not found in environment');
      return;
    }

    // Initialize OpenRouter
    const openrouter = createOpenRouter({
      apiKey: openrouterKey,
    });

    // Generate AI response
    const { text } = await generateText({
      model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
      prompt: 'Berikan satu tips motivasi singkat dalam bahasa Indonesia untuk mahasiswa yang sedang belajar. Maksimal 50 kata.',
    });

    // Target group chat ID (ganti dengan ID grup yang sesuai)
    const targetChatId = "120363399604541928@g.us"; // ID grup target

    // Send message to WhatsApp
    const apiUrl = "https://waha-qxjcatc8.sumopod.in/api/sendText";
    const bodyData = {
      chatId: targetChatId,
      reply_to: null,
      text: `🤖 *Tips Motivasi AI*\n\n${text}\n\n⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
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
    console.log('AI Cron Test - Message sent successfully:', apiResult);
    
    return { status: "sent", result: apiResult };
  } catch (error) {
    console.error('AI Cron Test - Error:', error);
    throw error;
  }
}