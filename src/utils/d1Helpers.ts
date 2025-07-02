// Helper functions untuk operasi D1 database
export interface AssignmentData {
  id: string;
  namaMataKuliah: string;
  deskripsi: string;
  createdAt: string;
  participant: string;
  deadline?: string; // string format untuk D1
}

// D1 Operations untuk Assignment (Task/Reminder)
export class D1AssignmentManager {
  constructor(private db: D1Database) {}

  // Initialize database table
  async initializeTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        namaMataKuliah TEXT NOT NULL,
        deskripsi TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        participant TEXT NOT NULL,
        deadline TEXT
      )
    `);
  }

  // Simpan assignment baru
  async saveAssignment(data: AssignmentData): Promise<void> {
    await this.db.prepare(`
      INSERT INTO assignments (id, namaMataKuliah, deskripsi, createdAt, participant, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.id,
      data.namaMataKuliah,
      data.deskripsi,
      data.createdAt,
      data.participant,
      data.deadline
    ).run();
  }

  // Ambil semua assignment
  async getAllAssignments(): Promise<AssignmentData[]> {
    const result = await this.db.prepare(`
      SELECT * FROM assignments ORDER BY createdAt DESC
    `).all();
    
    return result.results as unknown as AssignmentData[];
  }

  // Ambil assignment berdasarkan namaMataKuliah
  async getAssignmentByNamaMataKuliah(namaMataKuliah: string): Promise<AssignmentData | null> {
    const result = await this.db.prepare(`
      SELECT * FROM assignments WHERE namaMataKuliah = ? LIMIT 1
    `).bind(namaMataKuliah).first();
    
    return result as AssignmentData | null;
  }

  // Hapus assignment berdasarkan namaMataKuliah
  async deleteAssignmentByNamaMataKuliah(namaMataKuliah: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM assignments WHERE namaMataKuliah = ?
    `).bind(namaMataKuliah).run();
    
    return result.meta.changes > 0;
  }

  // Cek apakah assignment ada
  async assignmentExists(namaMataKuliah: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM assignments WHERE namaMataKuliah = ?
    `).bind(namaMataKuliah).first();
    
    return (result as any).count > 0;
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
