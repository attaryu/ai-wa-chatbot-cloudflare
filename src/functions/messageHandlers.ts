// Interface untuk command mapping
interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/pagi": "selamat pagi bang, saya siap membantu anda",
  "/malam": "selamat malam bang, ada yang bisa saya bantu?",
  // Tambahkan command lain di sini sesuai kebutuhan
  "/siang": "selamat siang bang, ada yang bisa dibantu?",
  "/sore": "selamat sore bang, semoga hari anda menyenangkan!",
};

// Basic command handler yang fleksibel
export async function basicCommands(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  command: string,
  customResponse?: string
) {
  // Gunakan custom response jika ada, atau ambil dari predefined responses
  const responseText = customResponse || COMMAND_RESPONSES[command];
  
  if (!responseText) {
    throw new Error(`Command "${command}" not found and no custom response provided`);
  }

  const apiUrl = baseUrl + "/api/sendText";
  const bodyData = {
    chatId: chatId,
    reply_to: reply_to,
    text: responseText,
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

// Handler untuk command /dev
export async function handleDevInfo(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  const devInfo = `👨‍💻 *Developer Bot*

Nama: Wahyu Desu
GitHub: github.com/wahyudesu

*Ketentuan penggunaan:*
- Bot ini hanya untuk keperluan pembelajaran dan komunitas
- Jangan gunakan untuk spam atau tindakan melanggar hukum
- Fitur dapat berubah sewaktu-waktu

Terima kasih telah menggunakan bot ini!`;
  const apiUrl = baseUrl + "/api/sendText";
  const bodyData = {
    chatId: chatId,
    reply_to: reply_to,
    text: devInfo,
    session: session,
  };
  await fetch(apiUrl, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(bodyData),
  });
  return { status: "sent", sent: bodyData };
}

// Wrapper functions untuk backward compatibility (opsional) (dan gakepake)
export async function handleSelamatPagi(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/pagi");
}

export async function handleSelamatMalam(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/malam");
}
