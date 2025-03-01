import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp, GeoPoint } from "firebase/firestore";

// Helper function to create timestamps for specific times
const createTimestamp = (hoursFromNow: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return Timestamp.fromDate(date);
};

// Helper function to create a session time range
const createSessionTimeRange = (
  startHoursFromNow: number,
  durationHours: number = 1
) => {
  const startTime = createTimestamp(startHoursFromNow);
  const endTime = createTimestamp(startHoursFromNow + durationHours);
  return { startTime, endTime };
};

// Sample building locations with coordinates
const CAMPUS_LATITUDE = 21.1913819;
const CAMPUS_LONGITUDE = 81.3014177;

const buildingLocations = [
  {
    name: "Computer Science Building",
    rooms: ["Room 201", "Room 202", "Room 203"],
    coordinates: new GeoPoint(CAMPUS_LATITUDE, CAMPUS_LONGITUDE),
  },
  {
    name: "Mathematics Building",
    rooms: ["Room 301", "Room 302", "Room 303"],
    coordinates: new GeoPoint(CAMPUS_LATITUDE, CAMPUS_LONGITUDE), // Using same coordinates for all buildings
  },
  {
    name: "Physics Building",
    rooms: ["Room 401", "Room 402", "Room 403"],
    coordinates: new GeoPoint(CAMPUS_LATITUDE, CAMPUS_LONGITUDE), // Using same coordinates for all buildings
  },
];

export const initializeSampleData = async () => {
  try {
    // Sample courses
    const courses = [
      {
        code: "CS101",
        title: "Introduction to Computer Science",
        department: "Computer Science",
        semester: "Spring 2024",
        building: buildingLocations[0].name,
      },
      {
        code: "MATH201",
        title: "Advanced Calculus",
        department: "Mathematics",
        semester: "Spring 2024",
        building: buildingLocations[1].name,
      },
      {
        code: "PHY301",
        title: "Quantum Physics",
        department: "Physics",
        semester: "Spring 2024",
        building: buildingLocations[2].name,
      },
    ];

    // Add courses to Firestore
    const courseRefs = await Promise.all(
      courses.map((course) => addDoc(collection(db, "courses"), course))
    );

    // Sample instructors
    const instructors = [
      {
        name: "Dr. John Smith",
        email: "john.smith@university.edu",
        department: "Computer Science",
      },
      {
        name: "Prof. Sarah Johnson",
        email: "sarah.johnson@university.edu",
        department: "Mathematics",
      },
      {
        name: "Dr. Michael Chen",
        email: "michael.chen@university.edu",
        department: "Physics",
      },
    ];

    // Add instructors to Firestore
    const instructorRefs = await Promise.all(
      instructors.map((instructor) =>
        addDoc(collection(db, "instructors"), instructor)
      )
    );

    // Create sessions for each course
    const sessions = [];
    for (let i = 0; i < courseRefs.length; i++) {
      const courseRef = courseRefs[i];
      const instructorRef = instructorRefs[i];
      const building = buildingLocations[i];

      // Create multiple sessions per course
      const sessionTimes = [
        createSessionTimeRange(1), // In 1 hour
        createSessionTimeRange(3), // In 3 hours
        createSessionTimeRange(24), // Tomorrow same time
        createSessionTimeRange(25), // Tomorrow + 1 hour
      ];

      for (let j = 0; j < sessionTimes.length; j++) {
        const { startTime, endTime } = sessionTimes[j];
        const room = building.rooms[j % building.rooms.length];

        sessions.push({
          courseId: courseRef.id,
          instructorId: instructorRef.id,
          title: `${courses[i].code} - ${courses[i].title}`,
          type: "lecture",
          startTime,
          endTime,
          building: building.name,
          location: `${building.name}, ${room}`,
          coordinates: building.coordinates,
          status: "scheduled",
          createdAt: Timestamp.now(),
          maxAttendees: 30,
          currentAttendees: 0,
        });
      }
    }

    // Add sessions to Firestore
    const sessionRefs = await Promise.all(
      sessions.map((session) => addDoc(collection(db, "sessions"), session))
    );

    // Create initial QR codes for upcoming sessions
    const qrCodes = sessions
      .filter((session) => session.startTime.seconds > Timestamp.now().seconds)
      .map((session, index) => ({
        sessionId: sessionRefs[index].id, // Use the session document ID from Firestore
        validFrom: session.startTime,
        validUntil: session.endTime,
        createdAt: Timestamp.now(),
        type: "session",
        status: "active",
        location: session.location,
        coordinates: session.coordinates,
      }));

    // Add QR codes to Firestore
    await Promise.all(
      qrCodes.map((qrCode) => addDoc(collection(db, "qrcodes"), qrCode))
    );

    console.log("Sample data initialized successfully:", {
      courses: courseRefs.length,
      instructors: instructorRefs.length,
      sessions: sessionRefs.length,
      qrCodes: qrCodes.length,
    });
  } catch (error) {
    console.error("Error initializing sample data:", error);
    throw error;
  }
};
