import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { CalendarDays } from 'lucide-react';

export interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: 'present' | 'absent';
}

interface AttendanceListProps {
  records: AttendanceRecord[];
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records }) => {
  return (
    <div className="attendance-list">
      <ListGroup>
        {records.length > 0 ? (
          records.map((record) => (
            <ListGroup.Item key={record.id} className="d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center">
                  <CalendarDays size={16} className="me-2" />
                  <span className="fw-bold">{record.className}</span>
                </div>
                <small className="text-muted">{new Date(record.date).toLocaleDateString()}</small>
              </div>
              <Badge 
                bg={record.status === 'present' ? 'success' : 'danger'}
              >
                {record.status === 'present' ? 'Present' : 'Absent'}
              </Badge>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-center text-muted">
            No attendance records found
          </ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
};

export default AttendanceList;