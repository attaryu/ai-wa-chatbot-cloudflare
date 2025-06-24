import { getWorkerEnv } from "./config/env";
import { mentionAll, basicCommands, handleTambahTugas, handleLihatTugas, handleSelesaiTugas } from "./functions";

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
          const result = await basicCommands(baseUrl, session, APIkey, chatId, reply_to, "/malam");
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
          const result = await basicCommands(baseUrl, session, APIkey, chatId, reply_to, "/pagi");
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
      }      // Jika text dimulai dengan /tambah-tugas, tangkap tugas yang ditambahkan
      if (text && text.startsWith("/tambah-tugas") && chatId && reply_to && participant === "6285174346212@c.us") {
        try {
          const result = await handleTambahTugas(baseUrl, session, APIkey, chatId, reply_to, text, participant, env["kv-database"]);
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

      // Jika text adalah /lihat-tugas, tampilkan daftar tugas
      if (text === "/lihat-tugas" && chatId && reply_to && participant === "6285174346212@c.us") {
        try {
          const result = await handleLihatTugas(baseUrl, session, APIkey, chatId, reply_to, participant, env["kv-database"]);
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

      // Jika text dimulai dengan /selesai, tandai tugas selesai
      if (text && text.startsWith("/selesai ") && chatId && reply_to && participant === "6285174346212@c.us") {
        try {
          const taskId = text.replace("/selesai ", "").trim();
          const result = await handleSelesaiTugas(baseUrl, session, APIkey, chatId, reply_to, taskId, env["kv-database"]);
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