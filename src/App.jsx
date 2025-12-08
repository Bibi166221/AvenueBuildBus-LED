import React, { useState, useEffect } from "react";
import { Train, Clock, MapPin, Database } from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// Global variables for Firebase configuration (provided by the environment)
const RAW_APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// FIX: Sanitize the APP_ID to prevent "Invalid document reference" error.
const ENV_APP_ID = RAW_APP_ID.replace(/[^a-zA-Z0-9_-]/g, '_'); 

const ENV_AUTH_TOKEN = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;
const ENV_FIREBASE_CONFIG = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase App
const app = Object.keys(ENV_FIREBASE_CONFIG).length > 0 ? initializeApp(ENV_FIREBASE_CONFIG) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
// ------------------------

function BusInfoBoard({ targetStop }) {
  // State for application status and live data
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null); // Track the authenticated user ID
  const [liveData, setLiveData] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [targetPath, setTargetPath] = useState("Awaiting authentication..."); 
  const [copiedMessage, setCopiedMessage] = useState(false); // State for copy confirmation

  // Static state derived from props
  const [nextStop, setNextStop] = useState(targetStop || "Central Station");

  // State for current time display
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // --- 1. FIREBASE AUTHENTICATION ---
  useEffect(() => {
    if (!app || !auth || !db) {
        setStatusMessage("Firebase configuration missing. Cannot connect to data source.");
        return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            setUserId(user.uid);
            setIsAuthReady(true);
            setStatusMessage("Authenticated. Waiting for live data...");
        } else {
            async function attemptSignIn() {
                 try {
                    if (ENV_AUTH_TOKEN) {
                      await signInWithCustomToken(auth, ENV_AUTH_TOKEN);
                    } else {
                      await signInAnonymously(auth);
                    }
                  } catch (error) {
                    console.error("Firebase Auth Error:", error);
                    setStatusMessage("Authentication Failed. Check console.");
                    setIsAuthReady(true); 
                  }
            }
            attemptSignIn();
        }
    });
    
    return () => unsubscribeAuth();
  }, []); 

  // --- 2. FIREBASE REAL-TIME DATA LISTENER (onSnapshot) ---
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return; 

    // The unique, guaranteed-readable path for this specific user/app
    const path = `/artifacts/${ENV_APP_ID}/users/${userId}/bus-status/Bus-A`;
    const busRef = doc(db, path);
    
    // Set the path to be displayed on the screen!
    setTargetPath(path); 
    
    const unsubscribe = onSnapshot(busRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveData(data);
        setStatusMessage(`Data received at ${new Date().toLocaleTimeString()}`);
        
        if (data.targetStopName) {
            setNextStop(data.targetStopName);
        }

      } else {
        setStatusMessage("Bus data document not found. Document is empty.");
        setLiveData({ estimatedTimeSeconds: 0, currentDistanceMeters: 0 });
      }
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setStatusMessage("Permission Denied! Check Firestore Rules or Data Path.");
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]); 


  // Effect for showing current clock time
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);
  
  // Function to handle clipboard copy
  const handleCopyPath = () => {
    if (targetPath && targetPath !== "Awaiting authentication...") {
      // FIX: Use document.execCommand('copy') as navigator.clipboard.writeText is often blocked in iframes.
      const el = document.createElement('textarea');
      el.value = targetPath;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000); // Hide message after 2 seconds
    }
  };

  // --- DERIVED VALUES ---
  const time = liveData?.estimatedTimeSeconds ?? 0;
  const distance = liveData?.currentDistanceMeters ?? 0;
  
  let stopName = "Next Stop";
  if (distance < 50 && distance > 0) {
    stopName = "Arriving at";
  } else if (distance <= 0) {
    stopName = "Arrived";
  } else if (distance < 150) {
    stopName = "Approaching";
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // --- RENDER ---
  return (
    <div className="w-full h-screen bg-gray-900 text-green-400 font-mono flex flex-col items-center justify-center select-none">
      
      {/* Target Path Display (New section for easy copying) */}
      <div className="absolute top-0 left-0 w-full p-2 bg-red-900/90 text-xs text-yellow-300 text-center border-b border-red-700 z-10">
          <p className="font-bold mb-1">
              STEP 3: COPY THIS TARGET PATH TO USE IN FIREBASE:
          </p>
          <p className="font-semibold text-sm cursor-copy break-all p-1 bg-black/50 rounded transition-all duration-200"
             onClick={handleCopyPath}
          >
              {targetPath}
          </p>
          <p className="text-red-300 mt-1 flex justify-center items-center">
              (Click to copy. This path is visible for debugging only.)
              {copiedMessage && (
                  <span className="ml-4 px-2 py-0.5 bg-green-500 text-black rounded font-bold transition-opacity duration-300">
                      Path Copied!
                  </span>
              )}
          </p>
      </div>

      {/* Main Container - Minimalist Look */}
      <div className="w-full max-w-4xl bg-black border-4 border-green-500 shadow-[0_0_20px_rgba(52,211,163,0.8)] rounded-lg p-8 sm:p-12 transition-all duration-300 mt-40">
        
        {/* Row 1: Time and Status Indicator */}
        <div className="flex justify-between items-start mb-6 border-b border-green-700 pb-4">
          <div className="flex items-center space-x-3 text-2xl sm:text-3xl text-green-300">
            <Clock className="w-7 h-7"/>
            <span className="font-semibold">{formattedTime}</span>
          </div>

          {/* Status Indicator (Next Stop / Arriving) */}
          <div className={`flex items-center text-2xl sm:text-3xl font-bold tracking-wider 
            ${stopName === "Arriving at" || stopName === "Arrived" ? "text-red-400 animate-pulse" : "text-green-400"}`}
          >
            <MapPin className="w-8 h-8 mr-2" />
            {stopName}
          </div>
        </div>

        {/* Row 2: Main Stop Name and Arrival Time (Giant Text) */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 py-6">
          
          {/* Main Stop Name (Left) */}
          <div className="text-4xl sm:text-6xl font-extrabold text-green-200 text-shadow-lg text-center sm:text-left">
            {nextStop}
          </div>

          {/* Arrival Time (Right) */}
          <div className="text-center sm:text-right">
            <span className="text-xl sm:text-2xl text-green-500 font-semibold block mb-1">
              ETA
            </span>
            <span className={`text-6xl sm:text-8xl font-black ${time <= 60 && time > 0 ? 'text-red-400 animate-pulse' : 'text-green-200'}`}>
              {time === 0 ? "NOW" : formatTime(time)}
            </span>
            <span className="text-lg sm:text-xl text-green-400 block mt-1">
              {time === 0 ? "" : "min:sec"}
            </span>
          </div>
        </div>
        
        {/* Distance Indicator (Since Arduino will provide this) */}
        {distance > 0 && (
          <div className="w-full text-center mt-4 text-xl text-green-500">
            <span className="font-semibold">Distance Remaining:</span> {distance} m
          </div>
        )}
      </div>
      
      {/* Footer - Minimal */}
      <div className="mt-6 text-sm sm:text-base text-green-700/80">
        <Train className="inline w-4 h-4 mb-1 mr-1" />
        {formattedDate} - Live Transit Data
      </div>
    </div>
  );
}

export default BusInfoBoard;