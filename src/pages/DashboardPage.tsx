import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { QrCode, FileDown, LogOut } from 'lucide-react';
import AttendanceChart from '../components/AttendanceChart';
import AttendanceList, { AttendanceRecord } from '../components/AttendanceList';
import OfflineAlert from '../components/OfflineAlert';
import { useNetwork } from '../contexts/NetworkContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchAttendanceRecords } from '../api/supabaseApi';
import { exportToCSV, getCurrentMonthData } from '../utils/csvExport';

const DashboardPage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOnline } = useNetwork();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        if (isOnline) {
          // Fetch from API if online
          const records = await fetchAttendanceRecords();
          setAttendanceRecords(records);
          
          // Store in localStorage for offline access
          localStorage.setItem('attendanceData', JSON.stringify(records));
        } else {
          // Load from cache if offline
          const cachedData = localStorage.getItem('attendanceData');
          if (cachedData) {
            setAttendanceRecords(JSON.parse(cachedData));
          }
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
        
        // Try to load from cache if online fetch fails
        const cachedData = localStorage.getItem('attendanceData');
        if (cachedData) {
          setAttendanceRecords(JSON.parse(cachedData));
        }
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [isOnline]);

  const handleScanClick = () => {
    navigate('/scan');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const generateReport = () => {
    // Get current month data
    const monthlyData = getCurrentMonthData(attendanceRecords);
    
    // Generate filename with current month and year
    const now = new Date();
    const filename = `attendance_report_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.csv`;
    
    // Export to CSV
    exportToCSV(monthlyData, filename);
  };

  // Calculate attendance statistics
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;

  return (
    <Container className="py-4">
      {!isOnline && <OfflineAlert />}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">
          <QrCode className="me-2" size={32} />
          Attendance Dashboard
        </h1>
        <Button variant="outline-danger" onClick={handleLogout}>
          <LogOut size={18} className="me-2" />
          Logout
        </Button>
      </div>
      
      {user && (
        <Card className="mb-4">
          <Card.Body>
            <h5>Welcome, {user.email}</h5>
            <p className="text-muted mb-0">User ID: {user.id}</p>
          </Card.Body>
        </Card>
      )}
      
      <Row>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Attendance Overview</h5>
            </Card.Header>
            <Card.Body>
              <AttendanceChart presentCount={presentCount} absentCount={absentCount} />
            </Card.Body>
            <Card.Footer className="bg-white">
              <div className="d-flex justify-content-between">
                <div>
                  <strong>Present:</strong> {presentCount} ({Math.round((presentCount / (presentCount + absentCount || 1)) * 100)}%)
                </div>
                <div>
                  <strong>Absent:</strong> {absentCount} ({Math.round((absentCount / (presentCount + absentCount || 1)) * 100)}%)
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Attendance</h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={generateReport}
                disabled={!isOnline || attendanceRecords.length === 0}
              >
                <FileDown size={16} className="me-1" />
                Export CSV
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p className="text-center">Loading attendance records...</p>
              ) : error ? (
                <p className="text-danger">{error}</p>
              ) : (
                <AttendanceList records={attendanceRecords.slice(0, 10)} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="text-center mt-3">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleScanClick}
          disabled={!isOnline}
          className="px-5"
        >
          <QrCode size={20} className="me-2" />
          Scan QR Code
        </Button>
        {!isOnline && (
          <p className="text-muted mt-2">
            <small>QR scanning requires an internet connection</small>
          </p>
        )}
      </div>
    </Container>
  );
};

export default DashboardPage;