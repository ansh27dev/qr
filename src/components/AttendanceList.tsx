import React from "react";
import { Table, Badge } from "react-bootstrap";

export interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: "present" | "absent";
  eventTitle?: string;
}

interface AttendanceListProps {
  records: AttendanceRecord[];
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records }) => {
  return (
    <Table responsive hover>
      <thead>
        <tr>
          <th>Date</th>
          <th>Event</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {records.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center">
              No attendance records found
            </td>
          </tr>
        ) : (
          records.map((record) => (
            <tr key={record.id}>
              <td>{new Date(record.date).toLocaleDateString()}</td>
              <td>{record.className}</td>
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
