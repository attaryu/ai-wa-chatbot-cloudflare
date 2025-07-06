import { env } from 'cloudflare:workers';

// Grup WA Spesifik (wajib)
export const GroupIds = [
	'120363399604541928@g.us', //AAAAA
	'120363183408730771@g.us', //jamaah wahyu sdt
	//   "120363123456789@g.us",
	//   "6281234567890@c.us",
];

// Spesifik personal contact (default:everyone)
export const PersonalIds = [
	'6285174346212@c.us',
	// '6289687381878@c.us',
	//   "120363123456789@g.us",
	//   "6281234567890@c.us",
];

export async function getWorkerEnv(env: Env) {
	const APIkey = await env.WAHA_KEY.get();
	const baseUrl = await env.BASE_URL.get();
	const session = await env.SESSION.get();
	const openrouterKey = await env.OPENROUTER_KEY.get();

	if (!baseUrl) throw new Error('BASE_URL environment variable is missing or empty.');
	if (!session) throw new Error('SESSION environment variable is missing or empty.');
	if (!APIkey) throw new Error('X_API_KEY environment variable is missing or empty.');
	if (!openrouterKey) throw new Error('OPENROUTER_API_KEY environment variable is missing or empty.');

	return { baseUrl, session, APIkey, openrouterKey };
}

// Fungsi untuk cek apakah pesan dari grup/individu yang diizinkan
export function isAllowedSource(payload: any): boolean {
	// Cek grup
	if (payload.from && GroupIds.includes(payload.from)) return true;
	// Cek personal
	if (payload.from && PersonalIds.includes(payload.from)) return true;
	return false;
}
