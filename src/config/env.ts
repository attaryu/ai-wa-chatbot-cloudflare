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

// Fungsi untuk mengambil env dari Cloudflare Worker
export function getWorkerEnv(env: any) {
  // Ambil dari env Worker (Cloudflare) lebih dulu
  let apiKey = env["X_API_KEY"] || env["x-api-key"];
  let session = env["SESSION"] || env["session"];
  let baseUrl = env["BASE_URL"] || env["base-url"];

  // Fallback ke globalThis.process.env (untuk dev lokal Node.js/.dev.vars)
  const proc = (globalThis as any).process;
  if (proc && proc.env) {
    apiKey = apiKey || proc.env["x-api-key"] || proc.env["X_API_KEY"];
    session = session || proc.env["session"] || proc.env["SESSION"];
    baseUrl = baseUrl || proc.env["base_url"] || proc.env["BASE_URL"];
  }

  if (!apiKey) {
    throw new Error("X_API_KEY environment variable is required");
  }
  if (!session) {
    throw new Error("SESSION environment variable is required");
  }
  if (!baseUrl) {
    throw new Error("BASE_URL environment variable is required");
  }

  return { apiKey, session, baseUrl };
}