import React, { useState, useEffect, useRef } from "react";
import { Container, Card, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { QrCode, ArrowLeft, MapPin } from "lucide-react";
import jsQR from "jsqr";
import { submitAttendance } from "../api/firebaseApi";
import { useAuth } from "../contexts/AuthContext";

enum ScanStatus {
  IDLE = "idle",
  SCANNING = "scanning",
  SUCCESS = "success",
  ERROR = "error",
  PERMISSION_DENIED = "permission_denied",
}

const ScanPage: React.FC = () => {
  const [scanStatus, setScanStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Request camera permission and start video stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        setScanStatus(ScanStatus.SCANNING);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setScanStatus(ScanStatus.PERMISSION_DENIED);
        setErrorMessage(
          "Camera access denied. Please enable camera permissions."
        );
      }
    };

    // Get user location
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setHasLocation(true);
          },
          (error) => {
            console.error("Error getting location:", error);
            setHasLocation(false);
            setErrorMessage(
              "Location access denied. Please enable location permissions."
            );
          }
        );
      } else {
        setHasLocation(false);
        setErrorMessage("Geolocation is not supported by this browser.");
      }
    };

    if (!user) {
      navigate("/login");
      return;
    }

    startCamera();
    getLocation();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [navigate, user]);

  // Start QR code scanning once video is playing
  const handleVideoPlay = () => {
    const scanQRCode = () => {
      if (
        videoRef.current &&
        canvasRef.current &&
        scanStatus === ScanStatus.SCANNING
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            // QR code detected
            handleQRCodeDetected(code.data);
            return;
          }
        }

        animationRef.current = requestAnimationFrame(scanQRCode);
      }
    };

    scanQRCode();
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      // Stop scanning
      setScanStatus(ScanStatus.SUCCESS);

      if (!user) {
        setScanStatus(ScanStatus.ERROR);
        setErrorMessage("You must be logged in to record attendance.");
        return;
      }

      if (!hasLocation || !location) {
        setScanStatus(ScanStatus.ERROR);
        setErrorMessage(
          "Location data is required for attendance. Please enable location services."
        );
        return;
      }

      // Parse QR data (assuming it contains a sessionId)
      let sessionId;
      try {
        // Try to parse as JSON first
        const parsedData = JSON.parse(qrData);
        sessionId = parsedData.sessionId;
      } catch (e) {
        // If not JSON, use the raw string as sessionId
        sessionId = qrData;
      }

      if (!sessionId) {
        throw new Error("Invalid QR code format");
      }

      // Submit attendance to the API
      const result = await submitAttendance(sessionId, location, user.uid);

      if (result.success) {
        setSuccessMessage(result.message);

        // Redirect after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setScanStatus(ScanStatus.ERROR);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      console.error("Error processing QR code:", error);
      setScanStatus(ScanStatus.ERROR);
      setErrorMessage(
        error.message || "Failed to process QR code. Please try again."
      );
    }
  };

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  const handleRetry = () => {
    setErrorMessage("");
    setScanStatus(ScanStatus.SCANNING);
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" onClick={handleBackClick} className="p-0 me-3">
          <ArrowLeft size={24} />
        </Button>
        <h1 className="mb-0">Scan QR Code</h1>
      </div>

      <Card className="mb-4">
        <Card.Body>
          {scanStatus === ScanStatus.PERMISSION_DENIED ? (
            <Alert variant="danger">{errorMessage}</Alert>
          ) : scanStatus === ScanStatus.ERROR ? (
            <Alert variant="danger">
              {errorMessage}
              <div className="mt-3">
                <Button variant="primary" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </Alert>
          ) : scanStatus === ScanStatus.SUCCESS ? (
            <Alert variant="success">{successMessage}</Alert>
          ) : (
            <div className="scan-container">
              <div className="video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onPlay={handleVideoPlay}
                  style={{ width: "100%", borderRadius: "8px" }}
                />
                <div className="scan-overlay">
                  <div className="scan-target"></div>
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <p className="text-center mt-3">
                <QrCode size={20} className="me-2" />
                Position the QR code within the frame
              </p>

              {hasLocation ? (
                <div className="d-flex align-items-center justify-content-center text-success">
                  <MapPin size={16} className="me-1" />
                  <small>Location detected</small>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-danger">
                  <MapPin size={16} className="me-1" />
                  <small>Location required for attendance</small>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="text-center">
        <Button variant="secondary" onClick={handleBackClick}>
          Back to Dashboard
        </Button>
      </div>
    </Container>
  );
};

export default ScanPage;
