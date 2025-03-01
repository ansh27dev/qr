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
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { exportToCSV, getCurrentMonthData } from "../utils/csvExport";

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: string;
}

interface Session {
  id: string;
  courseId: string;
  title: string;
  location: string;
  startTime: Timestamp;
  endTime: Timestamp;
  type: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: "present" | "absent";
  courseCode?: string;
  location?: string;
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
    let isMounted = true;

    const loadAttendanceData = async () => {
      try {
        if (!isOnline || !user) {
          // Load from cache if offline or no user
          const cachedData = localStorage.getItem("attendanceData");
          if (cachedData) {
            if (isMounted) {
              setAttendanceRecords(JSON.parse(cachedData));
              setLoading(false);
            }
          } else {
            if (isMounted) {
              setAttendanceRecords([]);
              setLoading(false);
            }
          }
          return;
        }

        // Fetch attendance records with limit
        const attendanceRef = collection(db, "attendance");
        const attendanceQuery = query(
          attendanceRef,
          where("userId", "==", user.uid),
          limit(50) // Limit to last 50 records
        );

        const [attendanceSnapshot, sessionsSnapshot, coursesSnapshot] =
          await Promise.all([
            getDocs(attendanceQuery),
            getDocs(collection(db, "sessions")),
            getDocs(collection(db, "courses")),
          ]);

        // Create sessions map
        const sessionsMap = new Map<string, Session>(
          sessionsSnapshot.docs.map((doc) => [
            doc.id,
            { id: doc.id, ...doc.data() } as Session,
          ])
        );

        // Create courses map
        const coursesMap = new Map<string, Course>(
          coursesSnapshot.docs.map((doc) => [
            doc.id,
            { id: doc.id, ...doc.data() } as Course,
          ])
        );

        // Process attendance records
        const records = attendanceSnapshot.docs.map((doc) => {
          const data = doc.data();
          const session = sessionsMap.get(data.sessionId) || ({} as Session);
          const course = session.courseId
            ? coursesMap.get(session.courseId)
            : null;

          const className = course
            ? `${course.code} - ${course.title}`
            : session.title
            ? session.title
            : "Class Session";

          // Get location from the attendance record's location object
          const locationName =
            data.location?.locationName || session.location || "N/A";

          return {
            id: doc.id,
            date: (data.timestamp as Timestamp).toDate().toISOString(),
            className: className,
            status: data.status as "present" | "absent",
            courseCode: course?.code,
            location: locationName,
          };
        });

        if (isMounted) {
          setAttendanceRecords(records);
          localStorage.setItem("attendanceData", JSON.stringify(records));
        }
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        // Try to load from cache if fetch fails
        const cachedData = localStorage.getItem("attendanceData");
        if (isMounted) {
          if (cachedData) {
            setAttendanceRecords(JSON.parse(cachedData));
          } else {
            setAttendanceRecords([]);
          }
          setError("Failed to load latest attendance data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAttendanceData();

    return () => {
      isMounted = false;
    };
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
