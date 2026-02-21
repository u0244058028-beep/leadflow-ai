export interface Lead {
  id: string;
  created_at: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  user_id: string;
  ai_score?: number; // 1-10
}

export interface Task {
  id: string;
  created_at: string;
  lead_id: string;
  title: string;
  due_date?: string;
  completed: boolean;
  user_id: string;
}

export interface Note {
  id: string;
  created_at: string;
  lead_id: string;
  content: string;
  user_id: string;
}