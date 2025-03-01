import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  GeoPoint,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Alert, Spinner } from "react-bootstrap";

const qrcodeRegionId = "html5qr-code-full-region";

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { user } = useAuth();

  // Request location permission and get current position
  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const initializeScanner = async () => {
      try {
        // Request both camera and location permissions
        await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: true }),
          getLocation(), // Initial location check
        ]);

        // Create scanner instance
        scanner = new Html5QrcodeScanner(
          qrcodeRegionId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        const handleSuccess = async (decodedText: string) => {
          try {
            if (scanner?.getState() === Html5QrcodeScannerState.SCANNING) {
              await scanner.pause(true);
            }
            setScanResult(decodedText);

            if (!user) {
              setError("User not authenticated");
              return;
            }

            // Get current location for attendance
            const currentPosition = await getLocation();

            // Verify QR code validity
            const qrCodesRef = collection(db, "qrcodes");
            const q = query(qrCodesRef, where("__name__", "==", decodedText));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              setError("Invalid QR code");
              return;
            }

            const qrCode = querySnapshot.docs[0].data();
            const now = Timestamp.now();

            // Check if QR code is valid and within time window
            if (
              now.seconds < qrCode.validFrom.seconds ||
              now.seconds > qrCode.validUntil.seconds
            ) {
              setError("QR code has expired or is not yet valid");
              return;
            }

            // Check if attendance already recorded
            const attendanceRef = collection(db, "attendance");
            const attendanceQuery = query(
              attendanceRef,
              where("userId", "==", user.uid),
              where("eventId", "==", qrCode.eventId),
              where("qrCodeId", "==", decodedText)
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);

            if (!attendanceSnapshot.empty) {
              setError("Attendance already recorded for this event");
              return;
            }

            // Record attendance with location
            await addDoc(attendanceRef, {
              userId: user.uid,
              eventId: qrCode.eventId,
              qrCodeId: decodedText,
              timestamp: now,
              status: "present",
              location: new GeoPoint(
                currentPosition.coords.latitude,
                currentPosition.coords.longitude
              ),
              accuracy: currentPosition.coords.accuracy,
            });

            // Close scanner after successful scan
            setTimeout(() => {
              onClose();
            }, 1500); // Give user time to see success message
          } catch (err) {
            console.error("Error processing QR code:", err);
            if (err instanceof Error && err.message.includes("location")) {
              setError(
                "Location access is required for attendance. Please enable location services and try again."
              );
            } else {
              setError("Error processing QR code");
            }
            if (scanner?.getState() === Html5QrcodeScannerState.PAUSED) {
              await scanner.resume();
            }
          }
        };

        const handleError = (err: string | Error) => {
          console.error("Error scanning QR code:", err);
          // Only show camera errors to user
          if (err.toString().includes("Camera")) {
            setError(err.toString());
          }
        };

        await scanner.render(handleSuccess, handleError);
        setIsInitializing(false);
      } catch (err) {
        console.error("Error initializing:", err);
        if (err instanceof Error) {
          if (err.message.includes("location")) {
            setError(
              "Location access is required for attendance. Please enable location services and try again."
            );
          } else {
            setError(
              "Camera access denied. Please grant camera permission and try again."
            );
          }
        }
        setIsInitializing(false);
      }
    };

    initializeScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [user, onClose]);

  const handleRetry = () => {
    setError(null);
    setIsInitializing(true);
    window.location.reload(); // Reload the page to reinitialize camera and location
  };

  if (isInitializing) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Initializing camera and location services...</p>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <div className="mt-2">
            <button
              onClick={handleRetry}
              className="btn btn-outline-danger btn-sm"
            >
              Retry Access
            </button>
          </div>
        </Alert>
      )}
      <div id={qrcodeRegionId} />
      {scanResult && (
        <Alert variant="success" className="mt-4">
          QR Code scanned successfully!
        </Alert>
      )}
      <button onClick={onClose} className="btn btn-secondary mt-4">
        Close Scanner
      </button>
    </div>
  );
};

export default QRScanner;
