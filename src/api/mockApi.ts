import { AttendanceRecord } from '../components/AttendanceList';

// Mock API functions to simulate backend interactions
// In a real app, these would make actual API calls

export const loginUser = async (username: string, password: string): Promise<{ token: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // For demo purposes, accept any non-empty credentials
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Return a mock token
  return { token: 'mock-jwt-token-' + Math.random().toString(36).substring(2) };
};

export const fetchAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock attendance data
  return [
    { id: '1', date: '2025-05-01', className: 'Mathematics', status: 'present' },
    { id: '2', date: '2025-05-02', className: 'Physics', status: 'present' },
    { id: '3', date: '2025-05-03', className: 'Chemistry', status: 'absent' },
    { id: '4', date: '2025-05-04', className: 'Biology', status: 'present' },
    { id: '5', date: '2025-05-05', className: 'English', status: 'present' },
    { id: '6', date: '2025-05-06', className: 'History', status: 'absent' },
    { id: '7', date: '2025-05-07', className: 'Geography', status: 'present' },
    { id: '8', date: '2025-05-08', className: 'Computer Science', status: 'present' },
    { id: '9', date: '2025-05-09', className: 'Art', status: 'absent' },
    { id: '10', date: '2025-05-10', className: 'Physical Education', status: 'present' },
  ];
};

export const submitAttendance = async (sessionId: string, location: { lat: number, lng: number }): Promise<{ success: boolean, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Validate inputs
  if (!sessionId) {
    throw new Error('Invalid session ID');
  }
  
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Invalid location data');
  }
  
  // Return success response
  return {
    success: true,
    message: 'Attendance marked successfully'
  };
};