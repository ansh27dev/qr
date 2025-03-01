import React, { useState, useEffect } from "react";
import { Card, Button, Alert } from "react-bootstrap";

const LocationPicker: React.FC = () => {
  const [locations, setLocations] = useState<
    Array<{ name: string; coords: { lat: number; lng: number } }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [currentBuilding, setCurrentBuilding] = useState(0);
  const buildings = [
    "Computer Science Building",
    "Mathematics Building",
    "Physics Building",
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocations((prev) => [
          ...prev,
          {
            name: buildings[currentBuilding],
            coords: { lat: latitude, lng: longitude },
          },
        ]);
        setCurrentBuilding((prev) => prev + 1);
        setError(null);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const copyToClipboard = () => {
    const locationCode = locations
      .map(
        (loc) => `  {
    name: "${loc.name}",
    rooms: ["Room 201", "Room 202", "Room 203"],
    coordinates: new GeoPoint(${loc.coords.lat}, ${loc.coords.lng}),
  }`
      )
      .join(",\n");

    const fullCode = `const buildingLocations = [\n${locationCode}\n];`;
    navigator.clipboard.writeText(fullCode);
  };

  return (
    <Card className="m-4">
      <Card.Body>
        <Card.Title>Building Location Picker</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}

        {currentBuilding < buildings.length ? (
          <>
            <p>
              Please physically go to:{" "}
              <strong>{buildings[currentBuilding]}</strong>
            </p>
            <Button onClick={getCurrentLocation}>Get Current Location</Button>
          </>
        ) : (
          <div>
            <h5>All locations collected!</h5>
            <div className="mb-3">
              {locations.map((loc, i) => (
                <div key={i} className="mb-2">
                  <strong>{loc.name}:</strong> {loc.coords.lat},{" "}
                  {loc.coords.lng}
                </div>
              ))}
            </div>
            <Button onClick={copyToClipboard}>Copy Code to Clipboard</Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default LocationPicker;
