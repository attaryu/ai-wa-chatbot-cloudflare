import { env } from "cloudflare:workers";

// Grup WA Spesifik (wajib)
export const GroupIds = [
  "120363399604541928@g.us",
//   "120363123456789@g.us",
//   "6281234567890@c.us", 
];

// Spesifik personal contact di grup (default:everyone)
export const GroupAdminIds = [
  "120363399604541928@g.us",
//   "120363123456789@g.us",
//   "6281234567890@c.us", 
];

// Spesifik personal contact (default:None)
export const PersonalChatIds = [
  "6285174346212@c.us",
//   "120363123456789@g.us",
//   "6281234567890@c.us", 
];


export async function getWorkerEnv(env: any) {
  const APIkey = await env.api_key.get()
  const baseUrl = await env.base_url_name.get()
  const session = await env.session_name.get()

  if (!baseUrl) throw new Error("BASE_URL environment variable is missing or empty.");
  if (!session) throw new Error("SESSION environment variable is missing or empty.");
  if (!APIkey) throw new Error("X_API_KEY environment variable is missing or empty.");

  return { baseUrl, session, APIkey };
}