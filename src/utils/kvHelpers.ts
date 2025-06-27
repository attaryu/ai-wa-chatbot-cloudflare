// Helper functions untuk operasi KV database
export interface AssignmentData {
  id: string;
  namaMataKuliah: string;
  deskripsi: string;
  createdAt: string;
  chatId: string;
  participant: string;
  deadline?: string; // opsional agar kompatibel dengan data baru
  groupId?: string; // tambahkan groupId
}

// KV Operations untuk Assignment (Task/Reminder)
export class KVAssignmentManager {
  constructor(private kv: KVNamespace) {}

  // Simpan assignment baru
  async saveAssignment(data: AssignmentData): Promise<void> {
    const key = `assignment:${data.id}`;
    await this.kv.put(key, JSON.stringify(data));
  }

  // Ambil assignment berdasarkan ID
  async getAssignment(id: string): Promise<AssignmentData | null> {
    const key = `assignment:${id}`;
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Ambil semua assignment
  async getAllAssignments(): Promise<AssignmentData[]> {
    const list = await this.kv.list({ prefix: "assignment:" });
    const assignments: AssignmentData[] = [];
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        assignments.push(JSON.parse(data));
      }
    }
    return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Hapus assignment
  async deleteAssignment(id: string): Promise<void> {
    const key = `assignment:${id}`;
    await this.kv.delete(key);
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
