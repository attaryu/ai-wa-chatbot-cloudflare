// Cron untuk reminder assignment (menggunakan D1 database)
import { GroupIds } from '../config/env';
import { D1AssignmentManager } from '../db/d1Helpers';

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

  // Ambil tanggal hari ini di GMT+7
  const today = new Date();
  const wibOffset = 7 * 60; // GMT+7 in minutes
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const wibToday = new Date(utc + (wibOffset * 60000));

  const deadlineDate = new Date(deadline);

  return (
    wibToday.getFullYear() === deadlineDate.getFullYear() &&
    wibToday.getMonth() === deadlineDate.getMonth() &&
    wibToday.getDate() === deadlineDate.getDate()
  );
}

// Helper: cek apakah deadline sudah lewat (hanya tanggal, abaikan jam)
function isDeadlinePast(deadline: string): boolean {
  if (!deadline) return false;

  // Ambil tanggal hari ini di GMT+7
  const today = new Date();
  const wibOffset = 7 * 60; // GMT+7 in minutes
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const wibToday = new Date(utc + (wibOffset * 60000));
  wibToday.setHours(0,0,0,0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0,0,0,0);

  return deadlineDate < wibToday;
}

export default {
  async scheduled(event: any, env: any, ctx: ExecutionContext) {
    const db = env["db-tugas"];

    try {

      // Ambil semua tugas dari D1
      const manager = new D1AssignmentManager(db);
      const assignments = await manager.getAllAssignments();

      // Filter tugas yang deadline-nya hari ini
      const todayAssignments = assignments.filter(a => isDeadlineToday(a.deadline || ''));

      // Filter tugas yang deadline-nya sudah lewat
      const pastAssignments = assignments.filter(a => isDeadlinePast(a.deadline || ''));

      // Hapus tugas yang deadline-nya sudah lewat
      for (const past of pastAssignments) {
        await manager.deleteAssignmentByMataKuliah(past.mata_kuliah);
      }

      if (todayAssignments.length > 0) {
        let taskList = "📋 *Reminder Tugas Deadline Hari Ini*\n\n";
        todayAssignments.forEach((assignment, idx) => {
          const deadlineStr = assignment.deadline ? formatDateForDisplay(assignment.deadline) : '-';
          taskList += `${idx + 1}. *${assignment.mata_kuliah}*\n ${assignment.deskripsi}\n Deadline: ${deadlineStr}\n\n`;
        });

        // Kirim ke grup utama
        const targetGroupId = GroupIds[1]; // ambil grup kedua dari env

        if (targetGroupId) {
          const baseUrl = await env.base_url_name.get();
          const apiKey = await env.api_key.get();
          const session = await env.session_name.get();

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
        } else {
          console.error("Target group ID is empty");
        }
      } else {
      }

    } catch (error) {
      console.error("Error in assignment cron:", error);
    }
  },
};
