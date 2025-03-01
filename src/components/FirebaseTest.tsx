import React, { useEffect } from "react";
import { Auth } from "firebase/auth";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const FirebaseTest: React.FC = () => {
  useEffect(() => {
    // Log environment variables
    console.log("Firebase Environment Variables:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    });

    // Test auth initialization
    console.log("Auth object:", auth);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed. Current user:", user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Firebase Test Component</h2>
      <p>Check the console for Firebase initialization status</p>
      <pre className="mt-2 p-2 bg-gray-200 rounded">
        {JSON.stringify(
          {
            apiKey:
              import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 8) + "...",
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
};

export default FirebaseTest;
