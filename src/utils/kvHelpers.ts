// Helper functions untuk operasi KV database
export interface AssignmentData {
  id: string;
  namaMataKuliah: string;
  deskripsi: string;
  createdAt: string;
  participant: string;
  deadline?: Date; // ubah ke Date object
}

// KV Operations untuk Assignment (Task/Reminder)
export class KVAssignmentManager {
  constructor(private kv: KVNamespace) {}

  // Simpan assignment baru
  async saveAssignment(data: AssignmentData): Promise<void> {
    const key = `${data.namaMataKuliah}`;
    // Convert Date object ke string saat simpan
    const dataToSave = {
      ...data,
      deadline: data.deadline ? data.deadline.toISOString() : undefined
    };
    await this.kv.put(key, JSON.stringify(dataToSave));
  }

  // Ambil semua assignment
  async getAllAssignments(): Promise<AssignmentData[]> {
    const list = await this.kv.list({ prefix: "assignment:" });
    const assignments: AssignmentData[] = [];
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert string deadline kembali ke Date object
        if (parsed.deadline) {
          parsed.deadline = new Date(parsed.deadline);
        }
        assignments.push(parsed);
      }
    }
    return assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Ambil assignment berdasarkan namaMataKuliah
  async getAssignmentByNamaMataKuliah(namaMataKuliah: string): Promise<AssignmentData | null> {
    const list = await this.kv.list({ prefix: "assignment:" });
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        const assignment = JSON.parse(data);
        // Convert string deadline kembali ke Date object
        if (assignment.deadline) {
          assignment.deadline = new Date(assignment.deadline);
        }
        if (assignment.namaMataKuliah === namaMataKuliah) {
          return assignment;
        }
      }
    }
    return null;
  }

  // Hapus assignment berdasarkan namaMataKuliah
  async deleteAssignmentByNamaMataKuliah(namaMataKuliah: string): Promise<boolean> {
    const list = await this.kv.list({ prefix: "assignment:" });
    let deleted = false;
    for (const key of list.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        const assignment: AssignmentData = JSON.parse(data);
        if (assignment.namaMataKuliah === namaMataKuliah) {
          await this.kv.delete(key.name);
          deleted = true;
        }
      }
    }
    return deleted;
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
