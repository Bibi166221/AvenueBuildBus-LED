import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. CRITICAL: Imports the Tailwind CSS (styles)
import './index.css';

// 2. Imports the main Bus Board component
import BusInfoBoard from './App.jsx';

// 3. Define the initial, default data to show before Firebase connects
const defaultStop = "Waiting for GPS Signal...";
const defaultTime = 0; // 0 seconds (ETA will show "NOW" or "00:00")

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 4. Renders the board, passing the default data as props */}
    <BusInfoBoard 
      targetStop={defaultStop}
      initialTimeSeconds={defaultTime}
    />
  </React.StrictMode>
);