import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const qrcodeRegionId = "html5qr-code-full-region";

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { currentUser } = useAuth();

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    });
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleScan = async (decodedText: string) => {
    if (!loading) {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // Get user's current location
        const position = await getLocation();

        // Parse QR code data
        const qrData = JSON.parse(decodedText);
        const qrDocRef = doc(db, "qrcodes", qrData.id);
        const qrDoc = await getDoc(qrDocRef);

        if (!qrDoc.exists()) {
          throw new Error("Invalid QR code");
        }

        const qrInfo = qrDoc.data();
        const now = Timestamp.now();

        // Validate time window
        if (
          now.seconds < qrInfo.validFrom.seconds ||
          now.seconds > qrInfo.validUntil.seconds
        ) {
          throw new Error("QR code is not valid at this time");
        }

        // Validate location if coordinates are available
        if (qrInfo.coordinates) {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            qrInfo.coordinates.latitude,
            qrInfo.coordinates.longitude
          );

          if (distance > 100) {
            // 100 meters radius
            throw new Error(
              `You are too far from the session location (${Math.round(
                distance
              )}m away)`
            );
          }
        }

        // Record attendance
        await addDoc(collection(db, "attendance"), {
          userId: currentUser?.uid,
          sessionId: qrInfo.sessionId,
          timestamp: now,
          status: "present",
          location: {
            locationName: qrInfo.location || "Unknown Location",
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            accuracy: position.coords.accuracy,
          },
          courseId: qrInfo.courseId,
          title: qrInfo.title,
        });

        // Update session attendance count
        const sessionRef = doc(db, "sessions", qrInfo.sessionId);
        await updateDoc(sessionRef, {
          currentAttendees: qrInfo.currentAttendees + 1,
        });

        setSuccess("Attendance recorded successfully!");
        setScanning(false);

        // Stop scanning after successful scan
        if (scannerRef.current) {
          await scannerRef.current.clear();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to record attendance";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanning && !scannerRef.current) {
      scanner = new Html5QrcodeScanner(
        qrcodeRegionId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(handleScan, (error: Error | string) => {
        const errorMessage = error instanceof Error ? error.message : error;
        if (errorMessage.includes("Camera")) {
          setError(errorMessage);
        }
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Scan QR Code</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
        <div id={qrcodeRegionId} className={scanning ? "d-block" : "d-none"} />
        {!scanning ? (
          <Button
            variant="primary"
            onClick={() => setScanning(true)}
            disabled={loading}
          >
            Start Scanning
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setScanning(false)}
            className="mt-3"
            disabled={loading}
          >
            Cancel Scanning
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default QRScanner;
