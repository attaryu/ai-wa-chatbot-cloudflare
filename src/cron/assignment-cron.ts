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
  
  // Debug log untuk melihat tanggal hari ini vs deadline
  console.log("=== DEBUG isDeadlineToday ===");
  console.log("Input deadline:", deadline);
  console.log("Today (raw):", today.toISOString());
  console.log("Today (local):", today.toLocaleDateString('id-ID'));
  console.log("Today parts - Year:", today.getFullYear(), "Month:", today.getMonth(), "Date:", today.getDate());
  console.log("Deadline (parsed):", deadlineDate.toISOString());
  console.log("Deadline (local):", deadlineDate.toLocaleDateString('id-ID'));
  console.log("Deadline parts - Year:", deadlineDate.getFullYear(), "Month:", deadlineDate.getMonth(), "Date:", deadlineDate.getDate());
  
  const isToday = (
    today.getFullYear() === deadlineDate.getFullYear() &&
    today.getMonth() === deadlineDate.getMonth() &&
    today.getDate() === deadlineDate.getDate()
  );
  
  console.log("Match result:", isToday);
  console.log("=== END DEBUG ===");
  return isToday;
}

// Helper: cek apakah deadline sudah lewat (hanya tanggal, abaikan jam)
function isDeadlinePast(deadline: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0,0,0,0);
  
  console.log("=== DEBUG isDeadlinePast ===");
  console.log("Input deadline:", deadline);
  console.log("Today (normalized):", today.toISOString());
  console.log("Deadline (normalized):", deadlineDate.toISOString());
  console.log("Is past?", deadlineDate < today);
  console.log("=== END DEBUG PAST ===");
  
  return deadlineDate < today;
}

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const db = env["db-tugas"];
    
    try {
      console.log("=== STARTING ASSIGNMENT CRON ===");
      console.log("Current time:", new Date().toISOString());
      console.log("Current time (local):", new Date().toLocaleDateString('id-ID'));
      
      // Ambil semua tugas dari D1
      const manager = new D1AssignmentManager(db);
      const assignments = await manager.getAllAssignments();
      console.log("Total assignments found:", assignments.length);
      
      // Debug: print all assignments with their deadlines
      console.log("=== ALL ASSIGNMENTS ===");
      assignments.forEach((assignment, idx) => {
        console.log(`${idx + 1}. ${assignment.mata_kuliah} - Deadline: ${assignment.deadline}`);
      });
      
      // Filter tugas yang deadline-nya hari ini
      console.log("=== FILTERING TODAY'S ASSIGNMENTS ===");
      const todayAssignments = assignments.filter(a => isDeadlineToday(a.deadline || ''));
      console.log("Today assignments count:", todayAssignments.length);
      
      // Filter tugas yang deadline-nya sudah lewat
      console.log("=== FILTERING PAST ASSIGNMENTS ===");
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
        console.log("Sending reminder to group:", targetGroupId);
        console.log("Message to send:", taskList);
        
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
        console.log("No assignments with deadline today - no message sent");
      }
      
      console.log("=== ASSIGNMENT CRON COMPLETED ===");
    } catch (error) {
      console.error("Error in assignment cron:", error);
    }
  },
};
