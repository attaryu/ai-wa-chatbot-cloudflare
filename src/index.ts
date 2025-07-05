import { getWorkerEnv, PersonalIds } from "./config/env";
import {
  mentionAll,
  basicCommands,
  handleTambahTugas,
  handleLihatTugas,
  handleHapusTugas,
  handleHelp,
  checkToxic,
  getToxicWarning,
  handleDevInfo,
} from "./functions";
import assignmentCron from "./cron/assignment-cron";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { D1AssignmentManager } from './db/d1Helpers';

import { generateObject } from 'ai';
import { z } from "zod";

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

      // // Handle group join events
      // if (data.event === "group.v2.participants") {
      //   const groupPayload = data.payload;
      //   if (groupPayload.type === "join" && groupPayload.group && groupPayload.participants) {
      //     const groupId = groupPayload.group.id;
      //     const joinedParticipants = groupPayload.participants;
          
      //     for (const participant of joinedParticipants) {
      //       const participantId = participant.id;
      //       const welcomeMessage = `🎉 Selamat datang @${participantId.replace("@c.us", "")} di grup ini!\n\nSemoga betah dan aktif ya! 😊`;
            
      //       try {
      //         await fetch(baseUrl + "/api/sendText", {
      //           method: "POST",
      //           headers: {
      //             "accept": "application/json",
      //             "Content-Type": "application/json",
      //             "X-Api-Key": APIkey,
      //           },
      //           body: JSON.stringify({
      //             chatId: groupId,
      //             text: welcomeMessage,
      //             session: session,
      //             mentions: [participantId],
      //           }),
      //         });
      //       } catch (error) {
      //         console.error("Error sending welcome message:", error);
      //       }
      //     }
          
      //     return new Response(JSON.stringify({ status: "welcome message sent" }), { 
      //       status: 200, 
      //       headers: { "Content-Type": "application/json", ...corsHeaders } 
      //     });
      //   }
      // }

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
          const result = await handleTambahTugas(baseUrl, session, APIkey, chatId, reply_to, text, participant, env["db-tugas"]);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text === "/list-tugas" && chatId && reply_to && PersonalIds.includes(participant)) {
        try {
          const result = await handleLihatTugas(baseUrl, session, APIkey, chatId, reply_to, participant, env["db-tugas"]);
          return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      if (text?.startsWith("/hapus ") && chatId && reply_to && PersonalIds.includes(participant)) {
        try {
          const namaTugas = text.replace("/hapus ", "").trim();
          const result = await handleHapusTugas(baseUrl, session, APIkey, chatId, reply_to, namaTugas, env["db-tugas"]);
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
          // Ambil semua data assignments dari D1 dan jadikan context
          const db = env["db-tugas"];
          const manager = new D1AssignmentManager(db);
          const assignments = await manager.getAllAssignments();
          const contextString = assignments.map(a =>
            `- [${a.mata_kuliah}] ${a.deskripsi} (Deadline: ${a.deadline || '-'} | By: ${a.participant})`
          ).join("\n");

          const openrouter = createOpenRouter({ apiKey: openrouterKey });
          const result = await generateObject({
            model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
            schema: z.object({ tugas: z.string() }),
            system:
              'Kamu adalah asisten handal untuk mahasiswa' +
              'Jawab pertanyaan user dengan informasi yang relevan dari daftar tugas yang ada di database.' +
              'Jika tidak ada informasi yang relevan, berikan jawaban umum yang sesuai.' +
              'Jawab sesingkat mungkin, tidak lebih dari 50 kata',
            prompt: `Berikut adalah daftar tugas di database:\n${contextString}\n\nJawab pertanyaan user atau bantu sesuai konteks tugas di atas.\nPertanyaan user: ${text.replace('/ai', '').trim()}`,
          });

          // Post-process: ganti ** jadi *, hapus semua baris yang hanya berisi pagra
            let tugas = result.object.tugas
              .replace(/\*\*/g, '*') // ganti ** jadi *
              .replace(/^#+\s*/gm, ''); // hapus simbol # di awal baris (contoh: #, ##, ## )

          const apiUrl = baseUrl + "/api/sendText";
          const bodyData = {
            chatId: chatId,
            reply_to: reply_to,
            text: tugas,
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
          return new Response(JSON.stringify({ status: "sent", sent: bodyData, apiResult, assignments }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
      }

      // if (text === "/list-tugas" && chatId && reply_to && PersonalIds.includes(participant)) {
      //   try {
      //     const result = await handleLihatTugas(baseUrl, session, APIkey, chatId, reply_to, participant, env["db-tugas"]);
      //     return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
      //   } catch (e: any) {
      //     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      //   }
      // }

      if (text === "/dev" && chatId && reply_to) {
        try {
          const result = await handleDevInfo(baseUrl, session, APIkey, chatId, reply_to);
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
      // Assignment reminder cron - hanya kirim reminder tugas yang deadline hari ini dan hapus yang sudah lewat
      await assignmentCron.scheduled(event, env, ctx);
      console.log("Assignment cron executed successfully");
    } catch (error) {
      console.error("Assignment cron failed:", error);
    }
  },
};