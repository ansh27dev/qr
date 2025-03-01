import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  timestamp: Timestamp;
  status: "present" | "absent" | "late";
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: Timestamp;
  location: string;
  organizerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QRCode {
  id: string;
  eventId: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}
