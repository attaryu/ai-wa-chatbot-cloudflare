// Common function to send text message
async function sendTextMessage(
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

// Handler untuk pesan selamat pagi
export async function handleSelamatPagi(
  baseUrl: string, 
  session: string, 
  apiKey: string,
  chatId: string, 
  reply_to: string
) {
  return await sendTextMessage(
    baseUrl, 
    session, 
    apiKey, 
    chatId, 
    reply_to, 
    "selamat pagi bang, saya siap membantu anda"
  );
}

// Handler untuk pesan selamat malam
export async function handleSelamatMalam(
  baseUrl: string, 
  session: string, 
  apiKey: string,
  chatId: string, 
  reply_to: string
) {
  return await sendTextMessage(
    baseUrl, 
    session, 
    apiKey, 
    chatId, 
    reply_to, 
    "selamat malam bang, ada yang bisa saya bantu?"
  );
}
