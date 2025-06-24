import { getWorkerEnv } from "./config/env";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request: Request, env: any): Promise<Response> {
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
      const session = data.session;

      // Ambil env dari Worker (secure, tidak hardcode)
      let apiEnv;
      try {
        apiEnv = getWorkerEnv(env);
      } catch (e) {
        return new Response((e as Error).message, { status: 500, headers: corsHeaders });
      }

      // Kirim POST ke API eksternal jika data ada dan participant sesuai
      if (chatId && text && apiEnv.session && reply_to && participant === "6285174346212@c.us") {
        const apiUrl = apiEnv.baseUrl + "/api/sendText";
        const bodyData = {
          chatId: chatId,
          reply_to: reply_to,
          text: text,
          session: apiEnv.session,
        };
        const apiResp = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": apiEnv.apiKey,
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