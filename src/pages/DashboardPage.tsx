import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { QrCode, FileDown, LogOut } from "lucide-react";
import AttendanceChart from "../components/AttendanceChart";
import AttendanceList from "../components/AttendanceList";
import OfflineAlert from "../components/OfflineAlert";
import { useNetwork } from "../contexts/NetworkContext";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { exportToCSV, getCurrentMonthData } from "../utils/csvExport";

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: "present" | "absent";
  eventTitle?: string;
}

const DashboardPage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isOnline } = useNetwork();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        if (isOnline && user) {
          // Fetch attendance records
          const attendanceRef = collection(db, "attendance");
          const attendanceQuery = query(
            attendanceRef,
            where("userId", "==", user.uid)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);

          // Fetch event details
          const eventsRef = collection(db, "events");
          const eventsSnapshot = await getDocs(eventsRef);
          const eventsMap = new Map(
            eventsSnapshot.docs.map((doc) => [doc.id, doc.data()])
          );

          // Map attendance records with event details
          const records = await Promise.all(
            attendanceSnapshot.docs.map(async (doc) => {
              const data = doc.data();
              const event = eventsMap.get(data.eventId);
              return {
                id: doc.id,
                date: (data.timestamp as Timestamp).toDate().toISOString(),
                className: event?.title || `Event ${data.eventId}`,
                status: data.status as "present" | "absent",
                eventTitle: event?.title,
              };
            })
          );

          setAttendanceRecords(records);
          localStorage.setItem("attendanceData", JSON.stringify(records));
        } else {
          // Load from cache if offline
          const cachedData = localStorage.getItem("attendanceData");
          if (cachedData) {
            setAttendanceRecords(JSON.parse(cachedData));
          }
        }
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to load attendance data");

        // Try to load from cache if online fetch fails
        const cachedData = localStorage.getItem("attendanceData");
        if (cachedData) {
          setAttendanceRecords(JSON.parse(cachedData));
        }
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [isOnline, user]);

  const handleScanClick = () => {
    navigate("/scan");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to logout");
    }
  };

  const generateReport = () => {
    const monthlyData = getCurrentMonthData(attendanceRecords);
    const now = new Date();
    const filename = `attendance_report_${now.getFullYear()}-${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.csv`;
    exportToCSV(monthlyData, filename);
  };

  // Calculate attendance statistics
  const presentCount = attendanceRecords.filter(
    (record) => record.status === "present"
  ).length;
  const absentCount = attendanceRecords.filter(
    (record) => record.status === "absent"
  ).length;

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
            <p className="text-muted mb-0">User ID: {user.uid}</p>
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
              <AttendanceChart
                presentCount={presentCount}
                absentCount={absentCount}
              />
            </Card.Body>
            <Card.Footer className="bg-white">
              <div className="d-flex justify-content-between">
                <div>
                  <strong>Present:</strong> {presentCount} (
                  {Math.round(
                    (presentCount / (presentCount + absentCount || 1)) * 100
                  )}
                  %)
                </div>
                <div>
                  <strong>Absent:</strong> {absentCount} (
                  {Math.round(
                    (absentCount / (presentCount + absentCount || 1)) * 100
                  )}
                  %)
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
