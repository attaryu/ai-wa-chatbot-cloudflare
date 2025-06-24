import { getWorkerEnv } from "./config/env";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Function to fetch group participants
async function getGroupParticipants(baseUrl: string, session: string, chatId: string, apiKey: string) {
  const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
    method: "GET",
    headers: {
      "accept": "*/*",
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch participants: ${response.statusText}`);
  }

  const participantsJson = await response.json();
  if (!Array.isArray(participantsJson)) {
    throw new Error("Participants response is not an array");
  }
  // Extract and return only the 'id' values, converting format
  const participantIds = participantsJson.map((participant: { id: string }) =>
    participant.id.replace("@s.whatsapp.net", "@c.us")
  );
  return participantIds;
}

// Function to mention all group members
async function mentionAll(baseUrl: string, session: string, chatId: string, apiKey: string) {
  const participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);
  const response = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      chatId: chatId,
      reply_to: null,
      text: participants.map((id: string) => `@${id.replace("@c.us", "")}`).join(" "),
      session: session,
      mentions: participants,
    }),
  });
  const result = await response.json();
  return result;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { APIkey, baseUrl, session } = await getWorkerEnv(env);
    const url = new URL(request.url);

    // Handle preflight OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Route home
    if (url.pathname === "/" && request.method === "GET") {
      return new Response("Cloudflare Worker Webhook is ready!", { status: 200, headers: corsHeaders });
    }

    // Route /event
    if (url.pathname === "/event" && request.method === "POST") {
      let data: any;
      try {
        data = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
      }

      // Debug event ke log (Cloudflare dashboard log)
      console.log("Received event:", JSON.stringify(data));

      // Ambil value dari payload
      const payload = data.payload || {};
      const chatId = payload.from;
      const text = payload.body;
      const participant = payload.participant;
      const reply_to = payload.id;

      // Jika text adalah /presensi, mention semua member
      if (text === "/presensi" && chatId && participant === "6285174346212@c.us") {
        try {
          const mentionResult = await mentionAll(baseUrl, session, chatId, APIkey);
          return new Response(
            JSON.stringify({ status: "mention sent", result: mentionResult }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ error: e.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      if (chatId && text === "/malam" && reply_to && participant === "6285174346212@c.us") {
        // const apiUrl = (env["API_BASE_URL"]) + "/api/sendText";
        const apiUrl = baseUrl + "/api/sendText";
        const bodyData = {
          chatId: chatId,
          reply_to: reply_to,
          text: "selamat malam bang, ada yang bisa saya bantu?",
          // session: env["session"] || session,
          session: session,
        };
        const apiResp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": APIkey,
          },
          body: JSON.stringify(bodyData),
        });
        const apiResult = await apiResp.text();
        return new Response(
          JSON.stringify({ status: "sent", sent: bodyData, apiResult }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (chatId && text === "selamat pagi" && reply_to && participant === "6285174346212@c.us") {
        const apiUrl = baseUrl + "/api/sendText";
        const bodyData = {
          chatId: chatId,
          reply_to: reply_to,
          text: "selamat pagi bang, saya siap membantu anda",
          session: session,
        };
        const apiResp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": APIkey,
          },
          body: JSON.stringify(bodyData),
        });
        const apiResult = await apiResp.text();
        return new Response(
          JSON.stringify({ status: "sent", sent: bodyData, apiResult }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Jika data tidak lengkap, balas event saja
      return new Response(
        JSON.stringify({ status: "received", event: data }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
};