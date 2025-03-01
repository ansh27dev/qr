import React from "react";
import { Table, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MapPin } from "lucide-react";

export interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: "present" | "absent";
  courseCode?: string;
  location?: {
    locationName?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy?: number;
  };
}

interface AttendanceListProps {
  records: AttendanceRecord[];
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records }) => {
  const formatLocation = (record: AttendanceRecord) => {
    if (!record.location) return "N/A";

    const locationName = record.location.locationName || "Unknown Location";
    const hasCoordinates = record.location.coordinates;

    if (!hasCoordinates) return locationName;

    const coords = record.location.coordinates;
    if (!coords) return locationName;

    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>
            Lat: {coords.latitude.toFixed(6)}
            <br />
            Long: {coords.longitude.toFixed(6)}
            {record.location.accuracy && (
              <>
                <br />
                Accuracy: ±{Math.round(record.location.accuracy)}m
              </>
            )}
          </Tooltip>
        }
      >
        <span className="d-flex align-items-center">
          <MapPin size={16} className="me-1" />
          {locationName}
        </span>
      </OverlayTrigger>
    );
  };

  return (
    <Table responsive hover>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Course</th>
          <th>Location</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {records.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center">
              No attendance records found
            </td>
          </tr>
        ) : (
          records.map((record) => (
            <tr key={record.id}>
              <td>{new Date(record.date).toLocaleString()}</td>
              <td>
                <div>{record.className}</div>
                {record.courseCode && (
                  <small className="text-muted">{record.courseCode}</small>
                )}
              </td>
              <td>{formatLocation(record)}</td>
              <td>
                <Badge bg={record.status === "present" ? "success" : "danger"}>
                  {record.status.charAt(0).toUpperCase() +
                    record.status.slice(1)}
                </Badge>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
};

export default AttendanceList;
