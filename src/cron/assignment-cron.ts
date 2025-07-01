// Cron untuk reminder assignment (disederhanakan karena tidak ada deadline)
import { GroupIds } from '../config/env';

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const kv = env["kv-database"];
    
    try {
      // Ambil semua tugas dari KV
      const list = await kv.list();
      
      if (list.keys.length > 0) {
        let taskList = "📋 *Reminder Tugas Hari Ini*\n\n";
        list.keys.forEach((key: any, idx: any) => {
          taskList += `${idx + 1}. 📝 ${key.name}\n`;
        });
        
        // Kirim ke grup utama
        const targetGroupId = GroupIds[1]; // ambil grup kedua dari env
        if (targetGroupId) {
          await fetch(`${await env.base_url_name.get()}/api/sendText`, {
            method: "POST",
            headers: {
              "accept": "application/json",
              "Content-Type": "application/json",
              "X-Api-Key": await env.api_key.get(),
            },
            body: JSON.stringify({
              chatId: "120363183408730771@g.us",
              reply_to: null,
              text: taskList,
              session: await env.session_name.get(),
            }),
          });
        }
      }
    } catch (error) {
      console.error('Assignment cron error:', error);
    }
  },
};
