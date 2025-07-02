// Cron untuk reminder assignment (menggunakan D1 database)
import { GroupIds } from '../config/env';
import { D1AssignmentManager } from '../utils/d1Helpers';

// Function untuk memformat tanggal dari database ke format yang user-friendly
function formatDateForDisplay(dbDate: string): string {
  try {
    const date = new Date(dbDate);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return dbDate; // fallback ke format asli jika error
  }
}

// Helper: cek apakah deadline sama dengan hari ini (hanya tanggal, abaikan jam)
function isDeadlineToday(deadline: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  return (
    today.getFullYear() === deadlineDate.getFullYear() &&
    today.getMonth() === deadlineDate.getMonth() &&
    today.getDate() === deadlineDate.getDate()
  );
}

// Helper: cek apakah deadline sudah lewat (hanya tanggal, abaikan jam)
function isDeadlinePast(deadline: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0,0,0,0);
  return deadlineDate < today;
}

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const db = env["db-tugas"];
    
    try {
      // Ambil semua tugas dari D1
      const manager = new D1AssignmentManager(db);
      console.log("Database connected:", !!db);
      
      const assignments = await manager.getAllAssignments();
      console.log("Total assignments found:", assignments.length);
      
      // Filter tugas yang deadline-nya hari ini
      const todayAssignments = assignments.filter(a => isDeadlineToday(a.deadline || ''));
      console.log("Today assignments:", todayAssignments.length, todayAssignments);
      
      // Filter tugas yang deadline-nya sudah lewat
      const pastAssignments = assignments.filter(a => isDeadlinePast(a.deadline || ''));
      console.log("Past assignments to delete:", pastAssignments.length);

      // Hapus tugas yang deadline-nya sudah lewat
      for (const past of pastAssignments) {
        console.log("Deleting past assignment:", past.mata_kuliah);
        await manager.deleteAssignmentByMataKuliah(past.mata_kuliah);
      }

      if (todayAssignments.length > 0) {
        let taskList = "📋 *Reminder Tugas Deadline Hari Ini*\n\n";
        todayAssignments.forEach((assignment, idx) => {
          const deadlineStr = assignment.deadline ? formatDateForDisplay(assignment.deadline) : '-';
          taskList += `${idx + 1}. 📚 *${assignment.mata_kuliah}*\n   📝 ${assignment.deskripsi}\n   ⏰ Deadline: ${deadlineStr}\n\n`;
        });
        
        // Kirim ke grup utama
        const targetGroupId = GroupIds[1]; // ambil grup kedua dari env
        console.log("Sending reminder to group:", targetGroupId, "with text:", taskList);
        
        if (targetGroupId) {
          const baseUrl = await env.base_url_name.get();
          const apiKey = await env.api_key.get();
          const session = await env.session_name.get();
          
          console.log("API details:", { baseUrl, apiKey: !!apiKey, session: !!session });
          
          const response = await fetch(`${baseUrl}/api/sendText`, {
            method: "POST",
            headers: {
              "accept": "application/json",
              "Content-Type": "application/json",
              "X-Api-Key": apiKey,
            },
            body: JSON.stringify({
              chatId: targetGroupId,
              reply_to: null,
              text: taskList,
              session: session,
            }),
          });
          
          const result = await response.text();
          console.log("WhatsApp API response:", response.status, result);
        } else {
          console.error("Target group ID is empty or undefined");
        }
      } else {
        console.log("No assignments with deadline today");
      }
    } catch (error) {
      console.error('Assignment cron error:', error);
    }
  },
};
