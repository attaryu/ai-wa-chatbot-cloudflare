import { KVAssignmentManager, AssignmentData, generateId } from '../utils/kvHelpers';

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
  kv?: KVNamespace
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

  if (kv) {
    try {
      // Simpan dengan key = assignment:namaMataKuliah, value = JSON AssignmentData
      const data = {
        id: generateId(),
        namaMataKuliah,
        deskripsi,
        createdAt: new Date().toISOString(),
        participant,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      };
      await kv.put(`assignment:${namaMataKuliah}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving assignment to KV:', error);
    }
  }

  const successResponse = `✅ Tugas berhasil ditambahkan!\n\n📚 Mata Kuliah: ${namaMataKuliah}\n📝 Deskripsi: ${deskripsi}\n⏰ Deadline: ${deadline}\n🗓️ Ditambahkan: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
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
    // Ambil semua keys dari KV
    const list = await kv.list();
    if (list.keys.length === 0) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "📝 Belum ada tugas yang tersimpan");
    }
    
    let taskList = "📋 *DAFTAR TUGAS*\n\n";
    list.keys.forEach((key, idx) => {
      taskList += `${idx + 1}. 📝 ${key.name}\n`;
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
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }
  try {
    // Cek apakah tugas ada
    const value = await kv.get(namaTugas);
    if (!value) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas tidak ditemukan");
    }
    
    // Hapus tugas
    await kv.delete(namaTugas);
    const response = `🗑️ Tugas berhasil dihapus!\n\n� Nama Tugas: ${namaTugas}`;
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
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
  const helpText = `🤖 *BANTUAN COMMAND BOT*

📝 *MANAJEMEN TUGAS:*
• \`/tugas [nama tugas]\` - Menambah tugas baru
• \`/list-tugas\` - Melihat semua tugas
• \`/hapus [nama tugas]\` - Hapus tugas

👋 *SAPAAN:*
• \`/pagi\` - Sapaan pagi
• \`/malam\` - Sapaan malam

👥 *GRUP:*
• \`/presensi\` - Mention semua member

🤖 *AI:*
• \`/ai [pertanyaan]\` - Tanya AI

ℹ️ *BANTUAN:*
• \`/help\` - Tampilkan bantuan ini

*Contoh penggunaan:*
\`/tugas Data Mining\`
\`/hapus Data Mining\``;

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