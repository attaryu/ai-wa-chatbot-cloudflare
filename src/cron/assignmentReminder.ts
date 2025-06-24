// Masih belum cuy wkwk
export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const list = await env.MY_KV.list({ prefix: "reminder:" });

    for (const key of list.keys) {
      const raw = await env.MY_KV.get(key.name);
      if (!raw) continue;

      const data = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      if (data.date === today) {
        await fetch(data.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: data.message }),
        });
      }
    }
  },
};
