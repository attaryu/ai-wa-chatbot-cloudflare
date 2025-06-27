// Cron untuk reminder assignment H-1
import { KVAssignmentManager } from '../utils/kvHelpers';

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const kv = env.MY_KV;
    const kvManager = new KVAssignmentManager(kv);
    const assignments = await kvManager.getAllAssignments();
    const today = new Date();
    for (const assignment of assignments) {
      if (!assignment.deadline || !assignment.groupId) continue;
      // Deadline format bebas, coba parse
      const deadlineDate = new Date(assignment.deadline);
      if (isNaN(deadlineDate.getTime())) continue;
      // H-1
      const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        // Kirim pesan ke grup
        const message = `⏰ *Reminder Tugas Besok!*\n\n📚 Mata Kuliah: ${assignment.namaMataKuliah}\n📝 Deskripsi: ${assignment.deskripsi}\n⏰ Deadline: ${assignment.deadline}`;
        await fetch(`${env.base_url}/api/sendText`, {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": env.x_api_key,
          },
          body: JSON.stringify({
            chatId: assignment.groupId,
            reply_to: null,
            text: message,
            session: env.session,
          }),
        });
      }
    }
  },
};
