import { KVTaskManager, TaskData, generateId } from '../utils/kvHelpers';

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
  // Ekstrak tugas dari pesan (hapus "/tambah-tugas" dan ambil sisanya)
  const taskContent = fullMessage.replace("/tambah-tugas", "").trim();
  
  if (!taskContent) {
    const errorResponse = "Format salah! Gunakan: /tambah-tugas [deskripsi tugas]";
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, errorResponse);
  }
  // Simpan ke KV database jika tersedia
  let taskId = generateId();
  console.log(`Attempting to save task with ID: ${taskId}`);
  console.log(`KV namespace available:`, !!kv);
  
  if (kv) {
    try {
      const kvManager = new KVTaskManager(kv);
      const taskData: TaskData = {
        id: taskId,
        task: taskContent,
        createdAt: new Date().toISOString(),
        chatId: chatId,
        participant: participant,
        completed: false
      };
      
      console.log(`Saving task data:`, JSON.stringify(taskData));
      await kvManager.saveTask(taskData);
      console.log(`Task saved to KV successfully with ID: ${taskId}`);
    } catch (error) {
      console.error('Error saving task to KV:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log('KV namespace not available - task not saved to database');
  }

  // Format response dengan tugas yang ditangkap
  const successResponse = `✅ Tugas berhasil ditambahkan!\n\n📝 Tugas: ${taskContent}\n🆔 ID: ${taskId}\n⏰ Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  
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
    const kvManager = new KVTaskManager(kv);
    const tasks = await kvManager.getAllTasks();
    
    if (tasks.length === 0) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "📝 Belum ada tugas yang tersimpan");
    }

    // Format daftar tugas
    let taskList = "📋 **DAFTAR TUGAS**\n\n";
    tasks.forEach((task, index) => {
      const status = task.completed ? "✅" : "⏳";
      const date = new Date(task.createdAt).toLocaleDateString('id-ID');
      taskList += `${index + 1}. ${status} ${task.task}\n`;
      taskList += `   🆔 ID: ${task.id}\n`;
      taskList += `   📅 ${date}\n\n`;
    });

    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, taskList);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error mengambil daftar tugas");
  }
}

// Function untuk menandai tugas selesai
export async function handleSelesaiTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  taskId: string,
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }

  try {
    const kvManager = new KVTaskManager(kv);
    const task = await kvManager.getTask(taskId);
    
    if (!task) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas dengan ID tersebut tidak ditemukan");
    }

    await kvManager.updateTask(taskId, { completed: true });
    const response = `✅ Tugas berhasil ditandai selesai!\n\n📝 ${task.task}`;
    
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
  } catch (error) {
    console.error('Error completing task:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error menandai tugas selesai");
  }
}

// Function untuk menghapus tugas
export async function handleHapusTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  taskId: string,
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }

  try {
    const kvManager = new KVTaskManager(kv);
    const task = await kvManager.getTask(taskId);
    
    if (!task) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas dengan ID tersebut tidak ditemukan");
    }

    await kvManager.deleteTask(taskId);
    const response = `🗑️ Tugas berhasil dihapus!\n\n📝 ${task.task}\n🆔 ID: ${taskId}`;
    
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
  } catch (error) {
    console.error('Error deleting task:', error);
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Error menghapus tugas");
  }
}

// Function untuk melihat detail tugas berdasarkan ID
export async function handleDetailTugas(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string,
  taskId: string,
  kv?: KVNamespace
) {
  if (!kv) {
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Database tidak tersedia");
  }

  try {
    const kvManager = new KVTaskManager(kv);
    const task = await kvManager.getTask(taskId);
    
    if (!task) {
      return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, "❌ Tugas dengan ID tersebut tidak ditemukan");
    }

    const status = task.completed ? "✅ Selesai" : "⏳ Belum Selesai";
    const date = new Date(task.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    const response = `📋 **DETAIL TUGAS**\n\n📝 Tugas: ${task.task}\n🆔 ID: ${task.id}\n📊 Status: ${status}\n📅 Dibuat: ${date}\n👤 Oleh: ${task.participant}`;
    
    return await sendMessage(baseUrl, session, apiKey, chatId, reply_to, response);
  } catch (error) {
    console.error('Error fetching task detail:', error);
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
• \`/tambah-tugas [deskripsi]\` - Menambah tugas baru
• \`/lihat-tugas\` - Melihat semua tugas
• \`/detail [task_id]\` - Melihat detail tugas
• \`/selesai [task_id]\` - Tandai tugas selesai
• \`/hapus [task_id]\` - Hapus tugas

👋 **SAPAAN:**
• \`/pagi\` - Sapaan pagi
• \`/malam\` - Sapaan malam

👥 **GRUP:**
• \`/presensi\` - Mention semua member

ℹ️ **BANTUAN:**
• \`/help\` - Tampilkan bantuan ini

**Contoh penggunaan:**
\`/tambah-tugas Beli groceries\`
\`/selesai abc123def456\`
\`/hapus abc123def456\``;

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

// Wrapper functions untuk backward compatibility (opsional) (dan gakepake)
export async function handleSelamatPagi(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/pagi");
}

export async function handleSelamatMalam(
  baseUrl: string,
  session: string,
  apiKey: string,
  chatId: string,
  reply_to: string
) {
  return await basicCommands(baseUrl, session, apiKey, chatId, reply_to, "/malam");
}
