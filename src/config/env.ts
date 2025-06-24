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

// Fungsi untuk mengambil env dari .dev.vars (atau process.env)
export function getWorkerEnv() {
  const proc = (globalThis as any).process;
  const apiKey = proc?.env?.["x_api_key"];
  const session = proc?.env?.["session"];
  const baseUrl = proc?.env?.["base_url"];

  if (!apiKey) {
    throw new Error("x_api_key environment variable is required");
  }
  if (!session) {
    throw new Error("session environment variable is required");
  }
  if (!baseUrl) {
    throw new Error("base_url environment variable is required");
  }

  return { apiKey, session, baseUrl };
}