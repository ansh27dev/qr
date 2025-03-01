import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Alert, Spinner } from "react-bootstrap";

interface SessionQRCodeProps {
  sessionId: string;
  sessionTitle: string;
  validityDuration: number; // Duration in minutes
  onQRCodeGenerated?: (qrCodeId: string) => void;
}

const SessionQRCode: React.FC<SessionQRCodeProps> = ({
  sessionId,
  sessionTitle,
  validityDuration,
  onQRCodeGenerated,
}) => {
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(validityDuration * 60); // Convert to seconds

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const now = Timestamp.now();
      const validUntil = new Timestamp(
        now.seconds + validityDuration * 60,
        now.nanoseconds
      );

      // Generate a unique QR code data
      const qrCodeDoc = await addDoc(collection(db, "qrcodes"), {
        sessionId,
        eventId: sessionId, // For compatibility with existing scanner
        validFrom: now,
        validUntil,
        createdAt: now,
        type: "session",
      });

      setQRCodeData(qrCodeDoc.id);
      setTimeLeft(validityDuration * 60);
      if (onQRCodeGenerated) {
        onQRCodeGenerated(qrCodeDoc.id);
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();

    // Set up timer to refresh QR code
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          generateQRCode(); // Generate new QR code when timer expires
          return validityDuration * 60;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, validityDuration]);

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        {error}
        <button onClick={generateQRCode} className="btn btn-danger btn-sm mt-2">
          Retry
        </button>
      </Alert>
    );
  }

  return (
    <div className="session-qr-container p-4 border rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">{sessionTitle}</h3>
      <div className="qr-code-wrapper flex justify-center">
        {qrCodeData && (
          <QRCodeSVG
            value={qrCodeData}
            size={256}
            level="H"
            includeMargin={true}
          />
        )}
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">
          Scan this QR code to mark your attendance
        </p>
        <p className="text-sm font-semibold text-primary">
          Code refreshes in: {formatTimeLeft(timeLeft)}
        </p>
      </div>
    </div>
  );
};

export default SessionQRCode;
