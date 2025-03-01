import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ScanPage from "./pages/ScanPage";
import AdminPage from "./pages/AdminPage";
import SessionPage from "./pages/SessionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { NetworkProvider } from "./contexts/NetworkContext";
import { AuthProvider } from "./contexts/AuthContext";
import { registerSW } from "./serviceWorkerRegistration";
import { useEffect } from "react";

// Register service worker
registerSW();

function requestLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        // You can send this data to your server or use it as needed
      },
      (error) => {
        console.error("Error obtaining location: ", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

function App() {
  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <AuthProvider>
      <NetworkProvider>
        <Container fluid className="app-container p-0">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute>
                  <ScanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session"
              element={
                <ProtectedRoute>
                  <SessionPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Container>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;
