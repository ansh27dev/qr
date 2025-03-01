export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  timestamp: Date;
  status: "present" | "absent" | "late";
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCode {
  id: string;
  eventId: string;
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  createdBy: string;
}
