"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamic import to prevent server-side rendering issues
const CyberpunkDriftingGame = dynamic(() => import("@/components/cyberpunk-drifting-game"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-pink-500 mb-4">CYBERPUNK DRIFTER</h1>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 animate-pulse" style={{ width: "60%" }}></div>
      </div>
      <p className="mt-4 text-cyan-500">Loading game engine...</p>
    </div>
  ),
})

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-pink-500 mb-4">CYBERPUNK DRIFTER</h1>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-pulse" style={{ width: "30%" }}></div>
        </div>
        <p className="mt-4 text-cyan-500">Initializing...</p>
      </div>
    )
  }

  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <CyberpunkDriftingGame />
    </main>
  )
}

