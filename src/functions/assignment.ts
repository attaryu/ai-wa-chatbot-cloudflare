import { KVAssignmentManager, AssignmentData, generateId } from '../utils/kvHelpers';

// Interface untuk command mapping
interface CommandMapping {
  [key: string]: string;
}

// Predefined command responses
export const COMMAND_RESPONSES: CommandMapping = {
  "/tambah-tugas": "Tugas berhasil ditambahkan!",
};

// Function untuk menangkap pesan yang dimulai dengan /tambah-tugas
export async function handleTambahTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  fullMessage: string,
  participant: string,
  kv?: KVNamespace
) {
  // Format: /tambah-tugas [mata kuliah], [deskripsi], [deadline]
  const content = fullMessage.replace("/tambah-tugas", "").trim();
  const [namaMataKuliah, deskripsi, deadline] = content.split(',').map(s => s.trim());

  if (!namaMataKuliah || !deskripsi || !deadline) {
    const errorResponse = "Format salah! Gunakan: /tambah-tugas [mata kuliah], [deskripsi], [deadline]\n\nContoh: /tambah-tugas Data Mining, Tugas Akhir, 15/12/2025";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  // Validasi format tanggal
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const dateMatch = deadline.match(dateRegex);
  
  if (!dateMatch) {
    const errorResponse = "❌ Format tanggal tidak sesuai! Gunakan format: DD/MM/YYYY\n\nContoh: 15/12/2025 atau 7/6/2025";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  const [, day, month, year] = dateMatch;
  const deadlineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Validasi apakah tanggal valid
  if (deadlineDate.getDate() !== parseInt(day) || 
      deadlineDate.getMonth() !== parseInt(month) - 1 || 
      deadlineDate.getFullYear() !== parseInt(year)) {
    const errorResponse = "❌ Tanggal tidak valid! Pastikan tanggal, bulan, dan tahun benar.\n\nContoh: 15/12/2025 atau 7/6/2025";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }

  let assignmentId = generateId();
  if (kv) {
    try {
      const kvManager = new KVAssignmentManager(kv);
      const assignmentData: AssignmentData = {
        id: assignmentId,
        namaMataKuliah,
        deskripsi,
        createdAt: new Date().toISOString(),
        participant,
        deadline: deadlineDate
      };
      await kvManager.saveAssignment(assignmentData);
    } catch (error) {
      console.error('Error saving assignment to KV:', error);
    }
  }
  const formattedDeadline = deadlineDate.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  const successResponse = `✅ Tugas berhasil ditambahkan!\n\n📚 Mata Kuliah: ${namaMataKuliah}\n📝 Deskripsi: ${deskripsi}\n⏰ Deadline: ${formattedDeadline}\n🗓️ Ditambahkan: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
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
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    const kvManager = new KVAssignmentManager(kv);
    const assignments = await kvManager.getAllAssignments();
    if (assignments.length === 0) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "📝 Belum ada tugas yang tersimpan");
    }
    let list = "📋 *DAFTAR TUGAS*\n\n";
    assignments.forEach((item, idx) => {
      const formattedDeadline = item.deadline 
        ? item.deadline.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Jakarta'
          })
        : '-';
      list += `${idx + 1}. 📚 ${item.namaMataKuliah}\n   📝 ${item.deskripsi}\n   ⏰ Deadline: ${formattedDeadline}\n\n`;
    });
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, list);
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
  namaMataKuliah: string,
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    const kvManager = new KVAssignmentManager(kv);
    const deleted = await kvManager.deleteAssignmentByNamaMataKuliah(namaMataKuliah);
    if (!deleted) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas dengan mata kuliah tersebut tidak ditemukan");
    }
    const response = `🗑️ Tugas berhasil dihapus!\n\n📚 Mata Kuliah: ${namaMataKuliah}`;
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error menghapus tugas");
  }
}

// Function untuk melihat detail tugas berdasarkan namaMataKuliah
export async function handleDetailTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  namaMataKuliah: string,
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    const kvManager = new KVAssignmentManager(kv);
    const assignment = await kvManager.getAssignmentByNamaMataKuliah(namaMataKuliah);
    if (!assignment) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas dengan mata kuliah tersebut tidak ditemukan");
    }
    const date = new Date(assignment.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const formattedDeadline = assignment.deadline 
      ? assignment.deadline.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'Asia/Jakarta'
        })
      : '-';
    const response = `📋 **DETAIL TUGAS**\n\n📚 Mata Kuliah: ${assignment.namaMataKuliah}\n📝 Deskripsi: ${assignment.deskripsi}\n⏰ Deadline: ${formattedDeadline}\n📅 Dibuat: ${date}\n👤 Oleh: ${assignment.participant}`;
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
  } catch (error) {
    console.error('Error fetching assignment detail:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error mengambil detail tugas");
  }
}

// Function untuk menampilkan bantuan/help command
export async function handleHelp(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  const helpText = `🤖 **BANTUAN COMMAND BOT**

📝 **MANAJEMEN TUGAS:**
• \`/tambah-tugas [mata kuliah], [deskripsi], [deadline]\` - Menambah tugas baru
• \`/lihat-tugas\` - Melihat semua tugas
• \`/detail [nama mata kuliah]\` - Melihat detail tugas
• \`/hapus [nama mata kuliah]\` - Hapus tugas

👋 **SAPAAN:**
• \`/pagi\` - Sapaan pagi
• \`/malam\` - Sapaan malam

👥 **GRUP:**
• \`/presensi\` - Mention semua member

🤖 **AI:**
• \`/ai [pertanyaan]\` - Tanya AI

ℹ️ **BANTUAN:**
• \`/help\` - Tampilkan bantuan ini

**Contoh penggunaan:**
\`/tambah-tugas Data Mining, Tugas Akhir, 15/12/2025\`
\`/detail Data Mining\`
\`/hapus Data Mining\`

**Format tanggal:** DD/MM/YYYY (contoh: 15/12/2025)`;

  return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, helpText);
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