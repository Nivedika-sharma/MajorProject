export interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  designation: string;
  department_id: string | null;
  contact: string;
  working_hours: string;
  employee_id: string;
  avatar_url: string;
  responsibilities: string;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  summary: string;
  content: string;
  urgency: 'high' | 'medium' | 'low';
  department_id: string | null;
  uploaded_by: string | null;
  file_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id: string;
  permission_level: 'view' | 'edit' | 'admin';
  granted_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id: string;
  document_id: string;
  user_id: string;
  text: string;
  position: Record<string, unknown>;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  position: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  changed_by: string | null;
  change_summary: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  document_id: string;
  created_at: string;
}

export interface DocumentWithDetails extends Document {
  department?: Department;
  profile?: Profile;
}
