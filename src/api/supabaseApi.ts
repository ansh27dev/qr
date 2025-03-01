import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../components/AttendanceList';

// User authentication functions
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const registerUser = async (email: string, password: string, name: string) => {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Then add the user profile data
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        { id: authData.user.id, email, name }
      ]);

    if (profileError) throw profileError;
  }

  return authData;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Attendance functions
export const fetchAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('attendance_with_details')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;

  return data.map(record => ({
    id: record.id,
    date: new Date(record.date).toISOString().split('T')[0],
    className: record.class_name,
    status: record.status as 'present' | 'absent',
  }));
};

export const submitAttendance = async (
  sessionId: string, 
  location: { lat: number, lng: number }
): Promise<{ success: boolean, message: string }> => {
  // First, verify the session exists and get its details
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    throw new Error('Invalid session ID');
  }

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if the user is within the allowed distance from the class location
  // This is a simplified version - in a real app, you'd use a proper distance calculation
  const MAX_DISTANCE = 0.001; // Roughly 100 meters in lat/lng units
  
  if (
    sessionData.location_lat && 
    sessionData.location_lng && 
    (
      Math.abs(sessionData.location_lat - location.lat) > MAX_DISTANCE ||
      Math.abs(sessionData.location_lng - location.lng) > MAX_DISTANCE
    )
  ) {
    throw new Error('You are not in the correct location for this class');
  }

  // Insert the attendance record
  const { error: attendanceError } = await supabase
    .from('attendance')
    .insert([
      {
        session_id: sessionId,
        user_id: user.id,
        status: 'present',
        location_lat: location.lat,
        location_lng: location.lng
      }
    ]);

  if (attendanceError) {
    // Check if it's a unique constraint violation (user already marked attendance)
    if (attendanceError.code === '23505') {
      return {
        success: false,
        message: 'You have already marked attendance for this session'
      };
    }
    throw attendanceError;
  }

  return {
    success: true,
    message: 'Attendance marked successfully'
  };
};

// Classes and sessions functions
export const fetchClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select('*');

  if (error) throw error;
  return data;
};

export const fetchSessions = async (classId?: string) => {
  let query = supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false });
    
  if (classId) {
    query = query.eq('class_id', classId);
  }
  
  const { data, error } = await query;

  if (error) throw error;
  return data;
};