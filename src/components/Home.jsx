import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const bubbleRef = useRef(null)
  const starRefs = useRef([])
  const BUBBLE_SIZE = 380
  const CENTER = BUBBLE_SIZE / 2
  const STAR_RADIUS = 160
  const offsets = useMemo(() => {
    const count = 24
    const radius = STAR_RADIUS
    const arr = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = radius * (0.7 + ((i % 5) / 10))
      arr.push([Math.cos(angle) * r, Math.sin(angle) * r])
    }
    return arr
  }, [])

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const current = { x: target.x, y: target.y }
    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
    }
    el.addEventListener('mousemove', onMove)
    let rafId
    const animate = (time) => {
      current.x += (target.x - current.x) * 0.2
      current.y += (target.y - current.y) * 0.2
      if (bubbleRef.current) {
        bubbleRef.current.style.left = `${current.x}px`
        bubbleRef.current.style.top = `${current.y}px`
      }
      const t = time * 0.004
      for (let i = 0; i < starRefs.current.length; i++) {
        const star = starRefs.current[i]
        if (!star) continue
        const off = offsets[i % offsets.length]
        const waveX = Math.sin(t + i * 0.6) * 6
        const waveY = Math.cos(t + i * 0.6) * 6
        const cx = CENTER + off[0] + waveX
        const cy = CENTER + off[1] + waveY
        star.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      }
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => {
      el.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [offsets])
  return (
    <div className="home-hero" ref={heroRef}>
      <div className="cursor-bubble" ref={bubbleRef}>
        <div className="bubble-stars">
          {Array.from({ length: 32 }).map((_, i) => (
            <span
              key={i}
              className="star"
              ref={(el) => (starRefs.current[i] = el)}
            />
          ))}
        </div>
      </div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      
      <div className="hero-card">
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
        <p className="hero-subtitle">Music has a way of finding you even in the darkest of places</p>
        <button className="hero-button" onClick={() => navigate('/library')}>
          Start Listening
        </button>
      </div>
    </div>
  )
}
