// Cron untuk reminder assignment (menggunakan D1 database)
import { GroupIds } from '../config/env';
import { D1AssignmentManager } from '../utils/d1Helpers';

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const db = env["db-tugas"];
    
    try {
      // Ambil semua tugas dari D1
      const manager = new D1AssignmentManager(db);
      // await manager.initializeTable();
      const assignments = await manager.getAllAssignments();
      
      if (assignments.length > 0) {
        let taskList = "📋 *Reminder Tugas Harian*\n\n";
        assignments.forEach((assignment, idx) => {
          const deadlineStr = assignment.deadline || '-';
          taskList += `${idx + 1}. 📚 *${assignment.namaMataKuliah}*\n   📝 ${assignment.deskripsi}\n   ⏰ Deadline: ${deadlineStr}\n\n`;
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
