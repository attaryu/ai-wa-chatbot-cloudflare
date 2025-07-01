import { getWorkerEnv, PersonalIds } from "./config/env";
import {
  mentionAll,
  basicCommands,
  handleTambahTugas,
  handleLihatTugas,
  handleHapusTugas,
  handleHelp,
  handleAIResponse,
  checkToxic,
  getToxicWarning,
} from "./functions";
import { aiCronTest } from "./cron/ai-cron-test";
import assignmentCron from "./cron/assignment-cron";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { APIkey, baseUrl, session, openrouterKey } = await getWorkerEnv(env);
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

      console.log("Received event:", JSON.stringify(data));

      const payload = data.payload || {};
      const chatId = payload.from;
      const text = payload.body;
      const participant = payload.participant;
      const reply_to = payload.id;

      // Deteksi toxic sebelum proses lain
      if (text) {
        const toxicResult = checkToxic(text);
        if (toxicResult.isToxic) {
          // Kirim pesan peringatan ke WhatsApp
          await fetch(baseUrl + "/api/sendText", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "Content-Type": "application/json",
              "X-Api-Key": APIkey,
            },
            body: JSON.stringify({
              chatId: chatId,
              reply_to: reply_to,
              text: getToxicWarning(toxicResult.found),
              session: session,
            }),
          });
        }
      }

      if (text?.startsWith("/presensi") && chatId) {
        try {
          const mentionResult = await mentionAll(baseUrl, session, chatId, APIkey);
          return new Response(
            JSON.stringify({ status: "mention sent", result: mentionResult }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (chatId && text === "/malam" && reply_to && PersonalIds.includes(participant)) {
        try {
          const result = await basicCommands(baseUrl, session, APIkey, chatId, reply_to, "/malam");
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (chatId && text === "/pagi" && reply_to && PersonalIds.includes(participant)) {
        try {
          const result = await basicCommands(baseUrl, session, APIkey, chatId, reply_to, "/pagi");
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text?.startsWith("/tugas") && chatId && reply_to && PersonalIds.includes(participant)) {
        try {
          const result = await handleTambahTugas(baseUrl, session, APIkey, chatId, reply_to, text, participant, env["kv-database"]);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text === "/list-tugas" && chatId && reply_to && PersonalIds.includes(participant)) {
        try {
          const result = await handleLihatTugas(baseUrl, session, APIkey, chatId, reply_to, participant, env["kv-database"]);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text?.startsWith("/hapus ") && chatId && reply_to && PersonalIds.includes(participant)) {
        try {
          const namaTugas = text.replace("/hapus ", "").trim();
          const result = await handleHapusTugas(baseUrl, session, APIkey, chatId, reply_to, namaTugas, env["kv-database"]);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text === "/help" && chatId && reply_to) {
        try {
          const result = await handleHelp(baseUrl, session, APIkey, chatId, reply_to);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text?.startsWith("/ai") && chatId && reply_to) {
        try {
          const result = await handleAIResponse(baseUrl, session, APIkey, chatId, reply_to, text, openrouterKey);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      return new Response(JSON.stringify({ status: "received", event: data }), { status: 200, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },

  async scheduled(event: any, env: any, ctx: ExecutionContext): Promise<void> {
    try {
      // Assignment reminder cron - kirim daftar tugas setiap hari
      await assignmentCron.scheduled(event, env, ctx);
      console.log("Assignment cron executed successfully");
    } catch (error) {
      console.error("Assignment cron failed:", error);
    }
  },
};
