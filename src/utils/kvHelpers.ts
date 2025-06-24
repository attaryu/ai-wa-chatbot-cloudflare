// Helper functions untuk operasi KV database
export interface TaskData {
  id: string;
  task: string;
  createdAt: string;
  chatId: string;
  participant: string;
  completed?: boolean;
}

export interface ReminderData {
  id: string;
  message: string;
  date: string; // format: YYYY-MM-DD
  chatId: string;
  participant: string;
  url?: string;
}

// KV Operations untuk Tasks
export class KVTaskManager {
  constructor(private kv: KVNamespace) {}

  // Simpan task baru
  async saveTask(taskData: TaskData): Promise<void> {
    const key = `task:${taskData.id}`;
    await this.kv.put(key, JSON.stringify(taskData));
  }

  // Ambil task berdasarkan ID
  async getTask(taskId: string): Promise<TaskData | null> {
    const key = `task:${taskId}`;
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Ambil semua task
  async getAllTasks(): Promise<TaskData[]> {
    const list = await this.kv.list({ prefix: "task:" });
    const tasks: TaskData[] = [];
    
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        tasks.push(JSON.parse(data));
      }
    }
    
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Hapus task
  async deleteTask(taskId: string): Promise<void> {
    const key = `task:${taskId}`;
    await this.kv.delete(key);
  }

  // Update task (mark as completed)
  async updateTask(taskId: string, updates: Partial<TaskData>): Promise<void> {
    const existingTask = await this.getTask(taskId);
    if (existingTask) {
      const updatedTask = { ...existingTask, ...updates };
      await this.saveTask(updatedTask);
    }
  }
}

// KV Operations untuk Reminders
export class KVReminderManager {
  constructor(private kv: KVNamespace) {}

  // Simpan reminder baru
  async saveReminder(reminderData: ReminderData): Promise<void> {
    const key = `reminder:${reminderData.id}`;
    await this.kv.put(key, JSON.stringify(reminderData));
  }

  // Ambil reminder berdasarkan ID
  async getReminder(reminderId: string): Promise<ReminderData | null> {
    const key = `reminder:${reminderId}`;
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Ambil reminders untuk hari tertentu
  async getRemindersForDate(date: string): Promise<ReminderData[]> {
    const list = await this.kv.list({ prefix: "reminder:" });
    const reminders: ReminderData[] = [];
    
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        const reminder: ReminderData = JSON.parse(data);
        if (reminder.date === date) {
          reminders.push(reminder);
        }
      }
    }
    
    return reminders;
  }

  // Hapus reminder
  async deleteReminder(reminderId: string): Promise<void> {
    const key = `reminder:${reminderId}`;
    await this.kv.delete(key);
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
