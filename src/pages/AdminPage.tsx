import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Alert,
  Card,
  Row,
  Col,
  Badge,
  Tabs,
  Tab,
} from "react-bootstrap";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { initializeSampleData } from "../utils/initSampleData";
import SessionQRCode from "../components/SessionQRCode";

interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: string;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Session {
  id: string;
  courseId: string;
  instructorId: string;
  title: string;
  type: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location: string;
  status: string;
  maxAttendees: number;
  currentAttendees: number;
}

interface QRCode {
  id: string;
  sessionId: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  status: string;
  location: string;
}

const AdminPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data
      const [
        coursesSnapshot,
        instructorsSnapshot,
        sessionsSnapshot,
        qrCodesSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "instructors")),
        getDocs(collection(db, "sessions")),
        getDocs(collection(db, "qrcodes")),
      ]);

      setCourses(
        coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[]
      );

      setInstructors(
        instructorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Instructor[]
      );

      setSessions(
        sessionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[]
      );

      setQRCodes(
        qrCodesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QRCode[]
      );
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitializeSampleData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await initializeSampleData();
      await loadData();

      setSuccess("Sample data initialized successfully");
    } catch (err) {
      console.error("Error initializing sample data:", err);
      setError("Failed to initialize sample data");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: Timestamp) => {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const getSessionStatus = (session: Session) => {
    const now = Timestamp.now().seconds;
    if (session.startTime.seconds > now) {
      return <Badge bg="info">Upcoming</Badge>;
    } else if (session.endTime.seconds < now) {
      return <Badge bg="secondary">Ended</Badge>;
    } else {
      return <Badge bg="success">In Progress</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Initialize Sample Data</Card.Title>
          <Card.Text>
            Click the button below to create sample courses, instructors,
            sessions, and QR codes in the database.
          </Card.Text>
          <Button
            variant="primary"
            onClick={handleInitializeSampleData}
            disabled={loading}
          >
            {loading ? "Initializing..." : "Initialize Sample Data"}
          </Button>
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="sessions" className="mb-4">
        <Tab eventKey="sessions" title="Sessions">
          <Row>
            {sessions.map((session) => {
              const course = courses.find((c) => c.id === session.courseId);
              const instructor = instructors.find(
                (i) => i.id === session.instructorId
              );
              const qrCode = qrCodes.find(
                (qr) => qr.sessionId === session.courseId
              );

              return (
                <Col key={session.id} md={6} lg={4} className="mb-4">
                  <Card>
                    <Card.Body>
                      <Card.Title className="d-flex justify-content-between align-items-center">
                        {session.title}
                        {getSessionStatus(session)}
                      </Card.Title>
                      <Card.Text>
                        <strong>Course:</strong> {course?.code}
                        <br />
                        <strong>Instructor:</strong> {instructor?.name}
                        <br />
                        <strong>Time:</strong>{" "}
                        {formatDateTime(session.startTime)} -{" "}
                        {formatDateTime(session.endTime)}
                        <br />
                        <strong>Location:</strong> {session.location}
                        <br />
                        <strong>Attendees:</strong> {session.currentAttendees}/
                        {session.maxAttendees}
                      </Card.Text>
                      {qrCode &&
                        session.startTime.seconds > Timestamp.now().seconds && (
                          <SessionQRCode
                            sessionId={session.id}
                            sessionTitle={session.title}
                            validityDuration={5}
                          />
                        )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Tab>
        <Tab eventKey="courses" title="Courses">
          <Row>
            {courses.map((course) => (
              <Col key={course.id} md={6} lg={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{course.code}</Card.Title>
                    <Card.Text>
                      <strong>Title:</strong> {course.title}
                      <br />
                      <strong>Department:</strong> {course.department}
                      <br />
                      <strong>Semester:</strong> {course.semester}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>
        <Tab eventKey="instructors" title="Instructors">
          <Row>
            {instructors.map((instructor) => (
              <Col key={instructor.id} md={6} lg={4} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{instructor.name}</Card.Title>
                    <Card.Text>
                      <strong>Email:</strong> {instructor.email}
                      <br />
                      <strong>Department:</strong> {instructor.department}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminPage;
