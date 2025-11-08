import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-hero">
      <div className="hero-card">
        <div className="badge-orbit">
          <div className="hero-badge">ELARA</div>
        </div>
        <h1 className="hero-title">Welcome to Elara</h1>
        <p className="hero-subtitle">Where words fail, music speaks  and Elara listens.</p>
        <button className="hero-button" onClick={() => navigate('/library')}>
          Start Listening
        </button>
      </div>
    </div>
  )
}

