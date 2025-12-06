/*
  # UDIS Document Intelligence & Compliance Platform Schema

  ## Overview
  This migration creates the complete database schema for the UDIS platform including
  user profiles, departments, documents, permissions, and collaboration features.

  ## New Tables

  ### 1. departments
  - `id` (uuid, primary key)
  - `name` (text) - Department name (HR, Finance, Legal, Admin, Procurement)
  - `description` (text) - Department description
  - `icon` (text) - Icon identifier
  - `color` (text) - Theme color for the department
  - `created_at` (timestamptz)

  ### 2. profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `designation` (text)
  - `department_id` (uuid, references departments)
  - `contact` (text)
  - `working_hours` (text)
  - `employee_id` (text)
  - `avatar_url` (text)
  - `responsibilities` (text)
  - `last_login` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. documents
  - `id` (uuid, primary key)
  - `title` (text)
  - `summary` (text)
  - `content` (text) - Full document content
  - `urgency` (text) - high, medium, low
  - `department_id` (uuid, references departments)
  - `uploaded_by` (uuid, references profiles)
  - `file_url` (text)
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. document_permissions
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `user_id` (uuid, references profiles)
  - `permission_level` (text) - view, edit, admin
  - `granted_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### 5. comments
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. highlights
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `user_id` (uuid, references profiles)
  - `text` (text) - Highlighted text
  - `position` (jsonb) - Position data
  - `color` (text)
  - `created_at` (timestamptz)

  ### 7. notes
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `position` (jsonb) - Position in document
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 8. document_versions
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `version_number` (integer)
  - `content` (text)
  - `changed_by` (uuid, references profiles)
  - `change_summary` (text)
  - `created_at` (timestamptz)

  ### 9. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `message` (text)
  - `type` (text) - document, comment, permission, etc.
  - `related_id` (uuid) - Related document/comment ID
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 10. bookmarks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `document_id` (uuid, references documents)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to access their permitted documents
  - Policies for managing permissions and collaboration features
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'folder',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  designation text DEFAULT '',
  department_id uuid REFERENCES departments ON DELETE SET NULL,
  contact text DEFAULT '',
  working_hours text DEFAULT '9:00 AM - 5:00 PM',
  employee_id text DEFAULT '',
  avatar_url text DEFAULT '',
  responsibilities text DEFAULT '',
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text DEFAULT '',
  content text DEFAULT '',
  urgency text DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  department_id uuid REFERENCES departments ON DELETE SET NULL,
  uploaded_by uuid REFERENCES profiles ON DELETE SET NULL,
  file_url text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_permissions table
CREATE TABLE IF NOT EXISTS document_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  permission_level text DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  granted_by uuid REFERENCES profiles ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create highlights table
CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  position jsonb DEFAULT '{}',
  color text DEFAULT '#FCD34D',
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  position jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  content text DEFAULT '',
  changed_by uuid REFERENCES profiles ON DELETE SET NULL,
  change_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text DEFAULT '',
  type text DEFAULT 'general',
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES documents ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for documents
CREATE POLICY "Users can view documents they have access to"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_permissions.document_id = documents.id
      AND document_permissions.user_id = auth.uid()
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update documents they own"
  ON documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- RLS Policies for document_permissions
CREATE POLICY "Users can view permissions for their documents"
  ON document_permissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Document owners can manage permissions"
  ON document_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Document owners can update permissions"
  ON document_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Document owners can delete permissions"
  ON document_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

-- RLS Policies for comments
CREATE POLICY "Users can view comments on accessible documents"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_permissions.document_id = comments.document_id
      AND document_permissions.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = comments.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on accessible documents"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM document_permissions
        WHERE document_permissions.document_id = comments.document_id
        AND document_permissions.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = comments.document_id
        AND documents.uploaded_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for highlights
CREATE POLICY "Users can view own highlights"
  ON highlights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create highlights"
  ON highlights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own highlights"
  ON highlights FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for notes
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for document_versions
CREATE POLICY "Users can view versions of accessible documents"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_permissions.document_id = document_versions.document_id
      AND document_permissions.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for editable documents"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM document_permissions
        WHERE document_permissions.document_id = document_versions.document_id
        AND document_permissions.user_id = auth.uid()
        AND document_permissions.permission_level IN ('edit', 'admin')
      )
      OR EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = document_versions.document_id
        AND documents.uploaded_by = auth.uid()
      )
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_document ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- Insert default departments
INSERT INTO departments (name, description, icon, color) VALUES
  ('HR', 'Human Resources Department', 'users', '#10B981'),
  ('Finance', 'Finance and Accounting Department', 'dollar-sign', '#3B82F6'),
  ('Legal', 'Legal and Compliance Department', 'scale', '#8B5CF6'),
  ('Admin', 'Administrative Department', 'briefcase', '#F59E0B'),
  ('Procurement', 'Procurement and Supply Chain Department', 'shopping-cart', '#EF4444')
ON CONFLICT (name) DO NOTHING;