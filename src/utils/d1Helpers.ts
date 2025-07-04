// Helper functions untuk operasi D1 database
export interface AssignmentData {
  id: string;
  mata_kuliah: string; // Sesuaikan dengan database schema
  deskripsi: string;
  createdAt: string;
  participant: string;
  deadline?: string;
}

export class D1AssignmentManager {
  constructor(private db: D1Database) {}

  // Skip auto table creation, assume table already exists
  async initializeTable(): Promise<void> {
    // Table should be created manually via migration
    
    // CREATE TABLE IF NOT EXISTS assignments (
    //   id TEXT PRIMARY KEY,
    //   namaMataKuliah TEXT NOT NULL,
    //   deskripsi TEXT NOT NULL,
    //   createdAt TEXT NOT NULL,
    //   participant TEXT NOT NULL,
    //   deadline TEXT
    // );
    console.log('Skipping table initialization - assuming table exists');
  }

  // Simpan assignment baru
  async saveAssignment(data: AssignmentData): Promise<void> {
    try {
      console.log('Saving assignment to D1:', data);
      // Untuk field createdAt, biarkan database menggunakan DEFAULT CURRENT_TIMESTAMP
      // Untuk deadline, convert dari string ke format DATETIME yang valid
      const result = await this.db.prepare(`
        INSERT INTO assignments (id, mata_kuliah, deskripsi, participant, deadline)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        data.id,
        data.mata_kuliah,
        data.deskripsi,
        data.participant,
        data.deadline || null
      ).run();
      console.log('D1 save result:', result);
    } catch (error) {
      console.error('Error saving to D1:', error);
      throw error;
    }
  }

  // Ambil semua assignment
  async getAllAssignments(): Promise<AssignmentData[]> {
    try {
      console.log('Fetching all assignments from D1');
      const result = await this.db.prepare(`
        SELECT id, mata_kuliah, deskripsi, createdAt, participant, deadline 
        FROM assignments 
        ORDER BY deadline DESC
      `).all();
      console.log('D1 fetch result:', result);
      return result.results as unknown as AssignmentData[];
    } catch (error) {
      console.error('Error fetching from D1:', error);
      throw error;
    }
  }

  // Ambil assignment berdasarkan mata_kuliah
  async getAssignmentByMataKuliah(mataKuliah: string): Promise<AssignmentData | null> {
    const result = await this.db.prepare(`
      SELECT id, mata_kuliah, deskripsi, createdAt, participant, deadline 
      FROM assignments 
      WHERE mata_kuliah = ? LIMIT 1
    `).bind(mataKuliah).first();
    
    return result as AssignmentData | null;
  }

  // Hapus assignment berdasarkan mata_kuliah
  async deleteAssignmentByMataKuliah(mataKuliah: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM assignments WHERE mata_kuliah = ?
    `).bind(mataKuliah).run();
    
    return result.meta.changes > 0;
  }

  // Cek apakah assignment ada
  async assignmentExists(mataKuliah: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM assignments WHERE mata_kuliah = ?
    `).bind(mataKuliah).first();
    
    return (result as any).count > 0;
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
