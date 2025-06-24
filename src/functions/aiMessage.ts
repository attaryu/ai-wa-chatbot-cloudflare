// Interface untuk command mapping
interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/tambah-tugas": "Tugas berhasil ditambahkan!",
};

// Function untuk menangkap pesan yang dimulai dengan /tambah-tugas
export async function handleTambahTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  fullMessage: string
) {
  // Ekstrak tugas dari pesan (hapus "/tambah-tugas" dan ambil sisanya)
  const taskContent = fullMessage.replace("/tambah-tugas", "").trim();
  
  if (!taskContent) {
    const errorResponse = "Format salah! Gunakan: /tambah-tugas [deskripsi tugas]";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  // Format response dengan tugas yang ditangkap
  const successResponse = `✅ Tugas berhasil ditambahkan!\n\nTugas: ${taskContent}\nWaktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  
  return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, successResponse);
}

// Helper function untuk mengirim pesan
async function sendMessage(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  text: string
) {
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
