"use client"

import { useEffect, useRef } from "react"

// This is a separate component that handles all game audio
// You can import and use this in your CyberpunkDriftingGame component
export function GameAudio({
  isDrifting,
  speed,
  isGameOver,
  isCollecting,
  isGameStarted,
}: {
  isDrifting: boolean
  speed: number
  isGameOver: boolean
  isCollecting: boolean
  isGameStarted: boolean
}) {
  // Audio references
  const engineRef = useRef<HTMLAudioElement | null>(null)
  const driftRef = useRef<HTMLAudioElement | null>(null)
  const collectRef = useRef<HTMLAudioElement | null>(null)
  const crashRef = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio on component mount
  useEffect(() => {
    // Create audio elements
    engineRef.current = new Audio("/sounds/engine.mp3")
    driftRef.current = new Audio("/sounds/drift.mp3")
    collectRef.current = new Audio("/sounds/collect.mp3")
    crashRef.current = new Audio("/sounds/crash.mp3")
    musicRef.current = new Audio("/sounds/music.mp3")

    // Configure audio settings
    if (engineRef.current) {
      engineRef.current.loop = true
      engineRef.current.volume = 0.4
    }

    if (driftRef.current) {
      driftRef.current.loop = true
      driftRef.current.volume = 0.3
    }

    if (musicRef.current) {
      musicRef.current.loop = true
      musicRef.current.volume = 0.2
    }

    // Cleanup function
    return () => {
      // Stop and cleanup all audio when component unmounts
      ;[engineRef, driftRef, collectRef, crashRef, musicRef].forEach((ref) => {
        if (ref.current) {
          ref.current.pause()
          ref.current.src = ""
        }
      })
    }
  }, [])

  // Handle game start/stop
  useEffect(() => {
    if (isGameStarted) {
      musicRef.current?.play().catch((e) => console.log("Audio play failed:", e))
      engineRef.current?.play().catch((e) => console.log("Audio play failed:", e))
    } else {
      musicRef.current?.pause()
      engineRef.current?.pause()
    }
  }, [isGameStarted])

  // Handle engine sound based on speed
  useEffect(() => {
    if (engineRef.current) {
      // Adjust pitch based on speed (using playbackRate)
      const minRate = 0.8
      const maxRate = 1.5
      const speedFactor = Math.min(1, Math.abs(speed) / 35)
      engineRef.current.playbackRate = minRate + speedFactor * (maxRate - minRate)

      // Adjust volume based on speed
      engineRef.current.volume = 0.2 + speedFactor * 0.3
    }
  }, [speed])

  // Handle drift sound
  useEffect(() => {
    if (driftRef.current) {
      if (isDrifting && Math.abs(speed) > 15) {
        driftRef.current.play().catch((e) => console.log("Audio play failed:", e))
      } else {
        driftRef.current.pause()
      }
    }
  }, [isDrifting, speed])

  // Handle collect sound
  useEffect(() => {
    if (collectRef.current && isCollecting) {
      // Reset and play the sound
      collectRef.current.currentTime = 0
      collectRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }
  }, [isCollecting])

  // Handle crash/game over sound
  useEffect(() => {
    if (crashRef.current && isGameOver) {
      // Stop engine and drift sounds
      engineRef.current?.pause()
      driftRef.current?.pause()

      // Play crash sound
      crashRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }
  }, [isGameOver])

  // This component doesn't render anything visible
  return null
}

