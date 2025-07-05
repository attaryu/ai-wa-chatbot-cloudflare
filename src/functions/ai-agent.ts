
import { Agent } from "agents";
import { generateText } from "ai";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { D1AssignmentManager } from '../db/d1Helpers';
import { getWorkerEnv } from "../config/env";
import { generateObject } from 'ai';
import { z } from "zod";

export interface AssignmentData {
  id: string;
  mata_kuliah: string;
  deskripsi: string;
  createdAt: string;
  participant: string;
  deadline?: string;
}

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    // Extract env from the request if your framework provides it, otherwise adjust as needed
    // @ts-ignore
    const { openrouterKey } = await getWorkerEnv(env);
    const env: Env = (request as any).env;
    const db = env["db-tugas"];
    const manager = new D1AssignmentManager(db);
    const assignments = await manager.getAllAssignments();

    // Jadikan assignments sebagai context untuk LLM
    const contextString = assignments.map(a =>
      `- [${a.mata_kuliah}] ${a.deskripsi} (Deadline: ${a.deadline || '-'} | By: ${a.participant})`
    ).join("\n");

    const openrouter = createOpenRouter({
      apiKey: openrouterKey,
    });

    const result = await generateObject({
      model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
      schema: z.object({
          tugas: z.string(),
      }),
      system:
        'Kamu adalah asisten handal untuk mahasiswa' +
        'Jawab pertanyaan user dengan informasi yang relevan dari daftar tugas yang ada di database.' +
        'Jika tidak ada informasi yang relevan, berikan jawaban umum yang sesuai.' +
        'Jawab sesingkat mungkin, tidak lebih dari 50 kata',
      prompt: `Berikut adalah daftar tugas di database:\n${contextString}\n\nJawab pertanyaan user atau bantu sesuai konteks tugas di atas.`,
    });

    // Post-process: ganti ** jadi *, hapus semua baris yang hanya berisi pagra
    let tugas = result.object.tugas
      .replace(/\*\*/g, '*') // ganti ** jadi *
      .replace(/^pagra.*$/gim, '') // hapus baris yang hanya berisi pagra (case-insensitive)
      .replace(/\n{2,}/g, '\n') // rapikan double newline
      .trim();

    return Response.json({ modelResponse: { ...result, tugas }, assignments });
  }
}