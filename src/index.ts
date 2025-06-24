import { getWorkerEnv } from "./config/env";
import { mentionAll, handleSelamatPagi, handleSelamatMalam } from "./functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

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
      }      if (chatId && text === "/malam" && reply_to && participant === "6285174346212@c.us") {
        try {
          const result = await handleSelamatMalam(baseUrl, session, APIkey, chatId, reply_to);
          return new Response(
            JSON.stringify(result),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ error: e.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      if (chatId && text === "/pagi" && reply_to && participant === "6285174346212@c.us") {
        try {
          const result = await handleSelamatPagi(baseUrl, session, APIkey, chatId, reply_to);
          return new Response(
            JSON.stringify(result),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ error: e.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
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