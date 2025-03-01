import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { Event, Attendance, QRCode } from "../lib/database.types";

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName: name });

    // Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      name,
      role: "user",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Event functions
export const createEvent = async (
  eventData: Omit<Event, "id" | "createdAt" | "updatedAt">
) => {
  try {
    const eventRef = await addDoc(collection(db, "events"), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: eventRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
};

export const getEvent = async (eventId: string) => {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (eventDoc.exists()) {
      return {
        event: { id: eventDoc.id, ...eventDoc.data() } as Event,
        error: null,
      };
    }
    return { event: null, error: "Event not found" };
  } catch (error) {
    return { event: null, error };
  }
};

export const getUserEvents = async (userId: string) => {
  try {
    const q = query(
      collection(db, "events"),
      where("organizerId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Event)
    );
    return { events, error: null };
  } catch (error) {
    return { events: [], error };
  }
};

// Attendance functions
export const markAttendance = async (
  attendanceData: Omit<Attendance, "id" | "timestamp">
) => {
  try {
    const attendanceRef = await addDoc(collection(db, "attendance"), {
      ...attendanceData,
      timestamp: Timestamp.now(),
    });
    return { id: attendanceRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
};

export const getEventAttendance = async (eventId: string) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(q);
    const attendance = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Attendance)
    );
    return { attendance, error: null };
  } catch (error) {
    return { attendance: [], error };
  }
};

// QR Code functions
export const createQRCode = async (
  qrData: Omit<QRCode, "id" | "createdAt">
) => {
  try {
    const qrRef = await addDoc(collection(db, "qrcodes"), {
      ...qrData,
      createdAt: Timestamp.now(),
    });
    return { id: qrRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
};

export const getQRCode = async (qrId: string) => {
  try {
    const qrDoc = await getDoc(doc(db, "qrcodes", qrId));
    if (qrDoc.exists()) {
      return {
        qrCode: { id: qrDoc.id, ...qrDoc.data() } as QRCode,
        error: null,
      };
    }
    return { qrCode: null, error: "QR Code not found" };
  } catch (error) {
    return { qrCode: null, error };
  }
};

export const getEventQRCodes = async (eventId: string) => {
  try {
    const q = query(collection(db, "qrcodes"), where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    const qrCodes = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as QRCode)
    );
    return { qrCodes, error: null };
  } catch (error) {
    return { qrCodes: [], error };
  }
};

// QR Code Attendance functions
export const submitAttendance = async (
  sessionId: string,
  location: { lat: number; lng: number },
  userId: string
) => {
  try {
    // First, verify the QR code is valid and not expired
    const qrDoc = await getDoc(doc(db, "qrcodes", sessionId));
    if (!qrDoc.exists()) {
      return { success: false, message: "Invalid QR code" };
    }

    const qrData = qrDoc.data() as QRCode;
    const now = Timestamp.now();

    // Check if QR code is expired
    if (now.seconds > qrData.validUntil.seconds) {
      return { success: false, message: "QR code has expired" };
    }

    // Check if QR code is not yet valid
    if (now.seconds < qrData.validFrom.seconds) {
      return { success: false, message: "QR code is not yet valid" };
    }

    // Create attendance record
    const attendanceData = {
      userId,
      eventId: qrData.eventId,
      timestamp: now,
      status: "present",
      location: {
        lat: location.lat,
        lng: location.lng,
        timestamp: now,
      },
    };

    const attendanceRef = await addDoc(
      collection(db, "attendance"),
      attendanceData
    );

    return {
      success: true,
      message: "Attendance recorded successfully",
      data: { id: attendanceRef.id },
    };
  } catch (error) {
    console.error("Error submitting attendance:", error);
    return {
      success: false,
      message: "Failed to record attendance. Please try again.",
    };
  }
};
