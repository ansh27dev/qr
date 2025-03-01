/*
  # QR Attendance System Database Schema

  1. New Tables
    - `users` - Store user information
    - `classes` - Store class information
    - `sessions` - Store class sessions with QR codes
    - `attendance` - Store attendance records
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  3. Views
    - `attendance_with_details` - Combines attendance with class information
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  date TIMESTAMPTZ NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create view for attendance with class details
CREATE OR REPLACE VIEW attendance_with_details AS
SELECT 
  a.id,
  s.date,
  c.name as class_name,
  a.status,
  a.user_id
FROM 
  attendance a
JOIN 
  sessions s ON a.session_id = s.id
JOIN 
  classes c ON s.class_id = c.id;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for classes table
CREATE POLICY "Anyone can view classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can insert classes"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id);

-- Create policies for sessions table
CREATE POLICY "Anyone can view sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for attendance table
CREATE POLICY "Users can view their own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance"
  ON attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);