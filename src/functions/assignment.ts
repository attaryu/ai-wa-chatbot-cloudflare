import { D1AssignmentManager, AssignmentData, generateId } from '../db/d1Helpers';

// Interface untuk command mapping
interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/tambah-tugas": "Tugas berhasil ditambahkan!",
};

// Function untuk menangkap pesan yang dimulai dengan /tugas
export async function handleTambahTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  fullMessage: string,
  participant: string,
  db?: D1Database
) {
  // Format: /tugas [nama tugas], [deskripsi], [deadline]
  const content = fullMessage.replace("/tugas", "").trim();
  if (!content) {
    const errorResponse = "Format salah! Gunakan: /tugas [nama tugas], [deskripsi], [deadline]\n\nContoh: /tugas Data Mining, dikumpulkan ke ethol, 7/7";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  // Split by comma, expecting 3 parts
  const parts = content.split(",").map(p => p.trim());
  if (parts.length < 3) {
    const errorResponse = "Format salah! Gunakan: /tugas [nama tugas], [deskripsi], [deadline]\n\nContoh: /tugas Data Mining, dikumpulkan ke ethol, 7/7";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }
  const [namaMataKuliah, deskripsi, deadline] = parts;

  // Format deadline ke format database DATETIME
  const formattedDeadline = formatDateForDatabase(deadline);
  if (!formattedDeadline) {
    const errorResponse = "Format tanggal salah! Gunakan format DD/MM/YYYY\n\nContoh: 15/12/2025";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  if (db) {
    try {
      console.log('Database object received:', !!db);
      const manager = new D1AssignmentManager(db);
      // await manager.initializeTable();
      
      const data: AssignmentData = {
        id: generateId(),
        mata_kuliah: namaMataKuliah, // Sesuaikan dengan schema database
        deskripsi,
        createdAt: '', // Akan di-set oleh database dengan DEFAULT CURRENT_TIMESTAMP
        participant,
        deadline: formattedDeadline
      };
      console.log('Attempting to save assignment:', data);
      await manager.saveAssignment(data);
      console.log('Assignment saved successfully');
    } catch (error) {
      console.error('Error saving assignment to D1:', error);
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, `❌ Error menyimpan tugas: ${error}`);
    }
  } else {
    console.error('D1 database not available');
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }

  const successResponse = `✅ Tugas berhasil ditambahkan!\n\n📚 Mata Kuliah: ${namaMataKuliah}\n📝 Deskripsi: ${deskripsi}\n⏰ Deadline: ${formatDateForDisplay(formattedDeadline)}\n🗓️ Ditambahkan: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, successResponse);
}

// Function untuk melihat daftar tugas
export async function handleLihatTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  participant: string,
  db?: D1Database
) {
  if (!db) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    // Ambil semua assignment dari D1
    const manager = new D1AssignmentManager(db);
    // await manager.initializeTable();
    const assignments = await manager.getAllAssignments();
    if (assignments.length === 0) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "📝 Belum ada tugas yang tersimpan");
    }

    let taskList = "📋 *DAFTAR TUGAS*\n\n";
    assignments.forEach((item: AssignmentData, idx: number) => {
      const deadlineStr = item.deadline ? formatDateForDisplay(item.deadline) : '-';
      taskList += `${idx + 1}. *${item.mata_kuliah}*\n ${item.deskripsi}\n ⏰ Deadline: ${deadlineStr}\n\n`;
    });

    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, taskList);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error mengambil daftar tugas");
  }
}

// Function untuk menghapus tugas
export async function handleHapusTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  namaTugas: string,
  db?: D1Database
) {
  if (!db) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    const manager = new D1AssignmentManager(db);
    // await manager.initializeTable();
    
    // Cek apakah tugas ada
    const exists = await manager.assignmentExists(namaTugas);
    if (!exists) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas tidak ditemukan");
    }
    
    // Hapus tugas
    const deleted = await manager.deleteAssignmentByMataKuliah(namaTugas);
    if (deleted) {
      const response = `🗑️ Tugas berhasil dihapus!\n\n📚 Nama Tugas: ${namaTugas}`;
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
    } else {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Gagal menghapus tugas");
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error menghapus tugas");
  }
}

// Function untuk melihat detail tugas berdasarkan namaMataKuliah

// Function untuk menampilkan bantuan/help command
export async function handleHelp(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  const helpText = `🤖 *BOT Kuliyah*

📝 *MANAJEMEN TUGAS:*
• \`/tugas [nama tugas]\` - Menambah tugas baru
• \`/list-tugas\` - Melihat semua tugas
• \`/hapus [nama tugas]\` - Hapus tugas

CRON:
• Reminder tugas tenggat hari ini
• Rekap tugas tiap minggu

👥 *GRUP:*
• \`/presensi\` - Mention semua member untuk melakukan presensi

🤖 *AI:*
• \`/ai [pertanyaan]\` - Tanya AI

ℹ️ *BANTUAN:*
• \`/help\` - Tampilkan bantuan command

*Contoh penggunaan:*
\`/tugas Data Mining\`
\`/hapus Data Mining\``;

  return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, helpText);
}

// Function untuk mengkonversi format tanggal DD/MM/YYYY ke YYYY-MM-DD HH:MM:SS
function formatDateForDatabase(dateInput: string): string | null {
  try {
    // Expected format: DD/MM/YYYY
    const parts = dateInput.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2020) return null;
    
    // Format ke YYYY-MM-DD HH:MM:SS (set waktu ke 23:59:59 sebagai deadline)
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 23:59:59`;
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

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

// Helper function untuk mengirim pesan
async function sendMessage(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  text: string
) {
  const apiUrl = baseUrl + "/api/sendText";
  const bodyData = {
    chatId: chatId,
    reply_to: reply_to,
    text: text,
    session: session,
  };

  const apiResp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(bodyData),
  });

  const apiResult = await apiResp.text();
  return { status: "sent", sent: bodyData, apiResult };
}

// Basic command handler yang fleksibel
export async function basicCommands(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  command: string,
  customResponse?: string
) {
  // Gunakan custom response jika ada, atau ambil dari predefined responses
  const responseText = customResponse || COMMAND_RESPONSES[command];
  
  if (!responseText) {
    throw new Error(`Command "${command}" not found and no custom response provided`);
  }

  const apiUrl = baseUrl + "/api/sendText";
  const bodyData = {
    chatId: chatId,
    reply_to: reply_to,
    text: responseText,
    session: session,
  };

  const apiResp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(bodyData),
  });

  const apiResult = await apiResp.text();
  return { status: "sent", sent: bodyData, apiResult };
}