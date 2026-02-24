export interface Lead {
  id: string;
  created_at: string;
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  company_size?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  user_id: string;
  ai_score?: number;
  last_scored?: string;
  score_reason?: string;
  source?: string;
  potential_value?: number;
}

export interface Task {
  id: string;
  created_at: string;
  lead_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  user_id: string;
}

export interface Note {
  id: string;
  created_at: string;
  lead_id: string;
  content: string;
  user_id: string;
}

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  company_size?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  user_id: string;
  ai_score?: number;
  last_scored?: string;
  score_reason?: string;
  source?: string;
  potential_value?: number;
  is_favorite?: boolean;  // ✨ NY!
}

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  company_size?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  user_id: string;
  ai_score?: number;
  last_scored?: string;
  score_reason?: string;
  source?: string;
  potential_value?: number;
  is_favorite?: boolean;  // ✨ NY!
}

export interface Task {
  id: string;
  created_at: string;
  lead_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  user_id: string;
}

export interface Note {
  id: string;
  created_at: string;
  lead_id: string;
  content: string;
  user_id: string;
}