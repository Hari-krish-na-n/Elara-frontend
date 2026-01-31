// src/components/LoadingOverlay.jsx
import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>Loading audio files and extracting metadata...</p>
      <p className="loading-subtext">This may take a moment for files with cover art</p>
    </div>
  );
};

export default LoadingOverlay;