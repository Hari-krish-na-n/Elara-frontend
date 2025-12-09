import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-hero">
      {/* Shooting stars */}
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      
      <div className="hero-card">
        {/* Moon container */}
        <div className="moon-container">
          <div className="moon-glow"></div>
          <div className="moon">
            <div className="moon-crater"></div>
            <div className="moon-crater"></div>
            <div className="moon-crater"></div>
            <div className="moon-crater"></div>
            <div className="moon-text">ELARA</div>
          </div>
        </div>
        
        <h1 className="hero-title">Welcome to Elara</h1>
        <p className="hero-subtitle">Where words fail, music speaks and Elara listens.</p>
        <button className="hero-button" onClick={() => navigate('/library')}>
          Start Listening
        </button>
      </div>
    </div>
  )
}