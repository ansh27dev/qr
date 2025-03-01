import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export const initializeSampleData = async () => {
  try {
    // Sample events
    const events = [
      {
        title: "Morning Assembly",
        description: "Daily morning assembly",
        date: Timestamp.fromDate(new Date()),
        organizerId: "admin",
        location: "Main Hall",
        status: "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: "Mathematics Class",
        description: "Advanced calculus lecture",
        date: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Tomorrow
        organizerId: "admin",
        location: "Room 101",
        status: "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    // Add events to Firestore
    for (const event of events) {
      const eventRef = await addDoc(collection(db, "events"), event);
      console.log("Added event with ID:", eventRef.id);

      // Create QR code session for each event
      const qrCode = {
        eventId: eventRef.id,
        validFrom: Timestamp.now(),
        validUntil: Timestamp.fromDate(
          new Date(Date.now() + 2 * 60 * 60 * 1000)
        ), // 2 hours from now
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const qrRef = await addDoc(collection(db, "qrcodes"), qrCode);
      console.log("Added QR code with ID:", qrRef.id);
    }

    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Error initializing sample data:", error);
    throw error;
  }
};
