import React, { useState, useEffect } from "react";
import { Container, Button, Alert, Card, Row, Col } from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { initializeSampleData } from "../utils/initSampleData";
import EventQRCode from "../components/EventQRCode";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
}

interface QRCode {
  id: string;
  eventId: string;
}

const AdminPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      // Fetch QR codes
      const qrCodesSnapshot = await getDocs(collection(db, "qrcodes"));
      const qrCodesData = qrCodesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QRCode[];

      setEvents(eventsData);
      setQRCodes(qrCodesData);
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

  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Initialize Sample Data</Card.Title>
          <Card.Text>
            Click the button below to create sample events and QR codes in the
            database.
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

      <h2 className="mb-3">Events and QR Codes</h2>
      <Row>
        {events.map((event) => {
          const eventQRCode = qrCodes.find((qr) => qr.eventId === event.id);
          return (
            <Col key={event.id} md={6} lg={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{event.title}</Card.Title>
                  <Card.Text>
                    {event.description}
                    <br />
                    Location: {event.location}
                  </Card.Text>
                  {eventQRCode && (
                    <EventQRCode
                      qrCodeId={eventQRCode.id}
                      eventTitle={event.title}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default AdminPage;
