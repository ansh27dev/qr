import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import SessionQRCode from "../components/SessionQRCode";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

interface Session {
  id: string;
  title: string;
  courseId: string;
  startTime: Timestamp;
  endTime: Timestamp;
}

const SessionPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsRef = collection(db, "sessions");
      const q = query(
        sessionsRef,
        where("instructorId", "==", user?.uid),
        where("endTime", ">=", Timestamp.now())
      );
      const querySnapshot = await getDocs(q);

      const sessionData: Session[] = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Session)
      );

      setSessions(sessionData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Class Sessions</h2>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Available Sessions</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p>No active sessions found</p>
              ) : (
                <Form.Group>
                  {sessions.map((session) => (
                    <Form.Check
                      key={session.id}
                      type="radio"
                      id={`session-${session.id}`}
                      label={`${session.title} (${new Date(
                        session.startTime.seconds * 1000
                      ).toLocaleTimeString()} - ${new Date(
                        session.endTime.seconds * 1000
                      ).toLocaleTimeString()})`}
                      checked={selectedSession?.id === session.id}
                      onChange={() => handleSessionSelect(session)}
                      className="mb-2"
                    />
                  ))}
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          {selectedSession ? (
            <SessionQRCode
              sessionId={selectedSession.id}
              sessionTitle={selectedSession.title}
              validityDuration={5} // QR code refreshes every 5 minutes
              onQRCodeGenerated={(qrCodeId) =>
                console.log("New QR Code generated:", qrCodeId)
              }
            />
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p>Select a session to generate QR code</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SessionPage;
