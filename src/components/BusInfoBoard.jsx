import React, { useState, useEffect } from "react";
import { Train, Clock, MapPin } from "lucide-react";

// The BusInfoBoard Component with dynamic state management
function BusInfoBoard() {
  const [stopName, setStopName] = useState("Next Stop");
  const [nextStop, setNextStop] = useState("Siam Station");
  const [distance, setDistance] = useState(120);
  const [time, setTime] = useState(0); // Time in seconds
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Effect for updating distance and stop status
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Distance (simulating real-time change)
      const d = Math.floor(Math.random() * 250); // Random distance between 0 and 250m
      setDistance(d);

      // 2. Update Stop Status
      if (d < 50) {
        setStopName("Arriving at");
      } else if (d < 150) {
        setStopName("Approaching");
      } else {
        setStopName("Next Stop");
      }
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Effect for simulating time passing
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setTime(prevTime => {
        // Decrease simulated arrival time
        let newTime = prevTime > 0 ? prevTime - 1 : 0;
        return newTime;
      });
    }, 1000); // Update every 1 second

    // Effect for showing current time
    const clockInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);


    return () => {
      clearInterval(timeInterval);
      clearInterval(clockInterval);
    }
  }, []);
  
  // Initialize arrival time on first render
  useEffect(() => {
      // Set an initial simulated arrival time (e.g., 3 minutes)
      setTime(180); 
  }, []);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });


  return (
    <div className="w-full h-screen bg-gray-900 text-green-400 font-mono p-4 sm:p-8 flex flex-col items-center justify-center select-none shadow-2xl">
      
      {/* Header and Time */}
      <div className="w-full max-w-2xl flex justify-between items-center text-xl sm:text-2xl mb-6 border-b border-green-700/50 pb-2">
        <div className="flex items-center space-x-2 text-green-300">
          <Clock className="w-6 h-6"/>
          <span className="font-semibold">{formattedTime}</span>
        </div>
        <span className="text-green-500/80 text-lg sm:text-xl">{formattedDate}</span>
      </div>

      {/* Main Display Box */}
      <div className="w-full max-w-2xl bg-green-900/10 border-4 border-green-700 rounded-xl p-6 sm:p-10 shadow-inner shadow-green-900/50">
        
        {/* Status Indicator (Next Stop / Arriving) */}
        <div className={`text-4xl sm:text-5xl font-bold tracking-widest text-center mb-6 
          ${stopName === "Arriving at" ? "text-red-400 animate-pulse" : "text-green-400"}`}
        >
          <MapPin className="inline w-8 h-8 mr-3 mb-1" />
          {stopName}
        </div>

        {/* Main Stop Name */}
        <div className="text-5xl sm:text-7xl font-extrabold text-center text-green-200 drop-shadow-lg mb-10 border-t border-b border-green-700/50 py-4">
          {nextStop}
        </div>

        {/* Dynamic Information Section */}
        <div className="grid grid-cols-2 gap-4 text-center">
          
          {/* Distance */}
          <div className="flex flex-col items-center bg-green-800/20 p-4 rounded-lg border-2 border-green-700/40">
            <span className="text-xl sm:text-2xl text-green-500 font-semibold mb-1">
              Distance
            </span>
            <span className="text-4xl sm:text-5xl font-bold text-green-200">
              {distance}
            </span>
            <span className="text-lg text-green-400">meters</span>
          </div>

          {/* Time */}
          <div className="flex flex-col items-center bg-green-800/20 p-4 rounded-lg border-2 border-green-700/40">
            <span className="text-xl sm:text-2xl text-green-500 font-semibold mb-1">
              Arrival Time
            </span>
            <span className={`text-4xl sm:text-5xl font-bold ${time <= 60 ? 'text-red-400 animate-pulse' : 'text-green-200'}`}>
              {time === 0 ? "NOW" : formatTime(time)}
            </span>
            <span className="text-lg text-green-400">min:sec</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-sm sm:text-base text-gray-500">
        <Train className="inline w-4 h-4 mb-1 mr-1" />
        Simulated Real-Time Transit Data
      </div>
    </div>
  );
}

export default BusInfoBoard;