// "use client"
// import { useRef, useState, useEffect } from "react"
// import { Canvas, useFrame, useThree } from "@react-three/fiber"
// import { PerspectiveCamera, Environment, Html, Float, Trail } from "@react-three/drei"
// import { Physics, useSphere, useBox, usePlane } from "@react-three/cannon"
// import * as THREE from "three"
// import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"

// export default function Home() {
//   const [gameState, setGameState] = useState("ready") // 'ready', 'aiming', 'shooting', 'scored', 'saved', 'missed'
//   const [score, setScore] = useState(0)
//   const [shots, setShots] = useState(0)
//   const [round, setRound] = useState(1)
//   const [aimX, setAimX] = useState(0)
//   const [aimY, setAimY] = useState(5)
//   const [power, setPower] = useState(50) // Shot power 0-100
//   const [spin, setSpin] = useState(0) // -100 to 100, negative is left spin, positive is right
//   const [aiDifficulty, setAiDifficulty] = useState("medium") // 'easy', 'medium', 'hard'
//   const [showPowerBar, setShowPowerBar] = useState(false)
//   const [showSpinBar, setShowSpinBar] = useState(false)
//   const [showTutorial, setShowTutorial] = useState(true)
//   const [streak, setStreak] = useState(0)
//   const [bestStreak, setBestStreak] = useState(0)
//   const [showCelebration, setShowCelebration] = useState(false)
//   const [shotType, setShotType] = useState("normal") // 'normal', 'curve', 'lob'
//   const [showAimGuide, setShowAimGuide] = useState(true)
//   const [showStats, setShowStats] = useState(false)
//   const [soundEnabled, setSoundEnabled] = useState(true)

//   // Power and spin bar animation
//   const [powerDirection, setPowerDirection] = useState(1)
//   const [spinDirection, setSpinDirection] = useState(1)
//   const powerBarRef = useRef(null)

//   // Sound effects
//   const kickSoundRef = useRef(null)
//   const goalSoundRef = useRef(null)
//   const crowdSoundRef = useRef(null)
//   const whistleSoundRef = useRef(null)

//   useEffect(() => {
//     if (showPowerBar) {
//       const interval = setInterval(() => {
//         setPower((prev) => {
//           if (prev >= 100) setPowerDirection(-1)
//           if (prev <= 0) setPowerDirection(1)
//           return prev + powerDirection * 2
//         })
//       }, 20)
//       return () => clearInterval(interval)
//     }
//   }, [showPowerBar, powerDirection])

//   useEffect(() => {
//     if (showSpinBar) {
//       const interval = setInterval(() => {
//         setSpin((prev) => {
//           if (prev >= 100) setSpinDirection(-1)
//           if (prev <= -100) setSpinDirection(1)
//           return prev + spinDirection * 4
//         })
//       }, 20)
//       return () => clearInterval(interval)
//     }
//   }, [showSpinBar, spinDirection])

//   const handleMouseMove = (e) => {
//     if (gameState === "aiming") {
//       // Calculate aim based on mouse position - constrained to realistic angles
//       const x = (e.clientX / window.innerWidth) * 14 - 7 // -7 to 7 range
//       const y = Math.max(2, 10 - (e.clientY / window.innerHeight) * 8) // 2 to 10 range
//       setAimX(x)
//       setAimY(y)
//     }
//   }

//   const startAiming = () => {
//     if (gameState === "ready") {
//       setGameState("aiming")
//       setShowPowerBar(true)
//       if (whistleSoundRef.current && soundEnabled) {
//         try {
//           whistleSoundRef.current.currentTime = 0
//           whistleSoundRef.current.play().catch((err) => {
//             console.log("Audio playback failed:", err)
//             // Continue with the game even if audio fails
//           })
//         } catch (err) {
//           console.log("Audio error:", err)
//           // Continue with the game even if audio fails
//         }
//       }
//     }
//   }

//   const setShootPower = () => {
//     if (gameState === "aiming" && showPowerBar) {
//       setShowPowerBar(false)
//       setShowSpinBar(true)
//     }
//   }

//   const shoot = () => {
//     if (gameState === "aiming" && showSpinBar) {
//       setGameState("shooting")
//       setShowSpinBar(false)
//       setShots((prev) => prev + 1)

//       if (kickSoundRef.current && soundEnabled) {
//         try {
//           kickSoundRef.current.currentTime = 0
//           kickSoundRef.current.play().catch((err) => {
//             console.log("Audio playback failed:", err)
//           })
//         } catch (err) {
//           console.log("Audio error:", err)
//         }
//       }

//       // After shot completed
//       setTimeout(() => {
//         if (round >= 5) {
//           // End of penalty shootout round
//           setRound(1)
//           setGameState("gameOver")
//         } else {
//           setRound((prev) => prev + 1)
//           setGameState("ready")
//         }
//       }, 4000)
//     }
//   }

//   // Update streak when scoring
//   useEffect(() => {
//     if (gameState === "scored") {
//       const newStreak = streak + 1
//       setStreak(newStreak)

//       if (goalSoundRef.current && soundEnabled) {
//         try {
//           goalSoundRef.current.currentTime = 0
//           goalSoundRef.current.play().catch((err) => {
//             console.log("Audio playback failed:", err)
//           })
//         } catch (err) {
//           console.log("Audio error:", err)
//         }
//       }

//       if (newStreak > bestStreak) {
//         setBestStreak(newStreak)
//         setShowCelebration(true)
//         setTimeout(() => setShowCelebration(false), 2000)

//         if (crowdSoundRef.current && soundEnabled) {
//           try {
//             crowdSoundRef.current.currentTime = 0
//             crowdSoundRef.current.play().catch((err) => {
//               console.log("Audio playback failed:", err)
//             })
//           } catch (err) {
//             console.log("Audio error:", err)
//           }
//         }
//       }
//     } else if (gameState === "saved" || gameState === "missed") {
//       setStreak(0)
//     }
//   }, [gameState, streak, bestStreak, soundEnabled])

//   const resetGame = () => {
//     setScore(0)
//     setShots(0)
//     setRound(1)
//     setGameState("ready")
//     setStreak(0)
//   }

//   const toggleShotType = () => {
//     if (shotType === "normal") setShotType("curve")
//     else if (shotType === "curve") setShotType("lob")
//     else setShotType("normal")
//   }

//   return (
//     <div
//       style={{
//         height: "100vh",
//         width: "100vw",
//         overflow: "hidden",
//         background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)",
//         position: "relative",
//       }}
//       onMouseMove={handleMouseMove}
//     >
//       {/* Sound effects */}
//       <audio ref={kickSoundRef} src="/placeholder.svg?height=1&width=1" preload="auto"></audio>
//       <audio ref={goalSoundRef} src="/placeholder.svg?height=1&width=1" preload="auto"></audio>
//       <audio ref={crowdSoundRef} src="/placeholder.svg?height=1&width=1" preload="auto"></audio>
//       <audio ref={whistleSoundRef} src="/placeholder.svg?height=1&width=1" preload="auto"></audio>

//       <Canvas shadows gl={{ antialias: true }}>
//         <PerspectiveCamera makeDefault position={[0, 2.5, 16]} fov={50} />
//         <fog attach="fog" args={["#203a43", 30, 90]} />
//         <Environment preset="sunset" />
//         <ambientLight intensity={0.6} />
//         <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow shadow-mapSize={2048} />
//         <hemisphereLight args={["#87CEEB", "#2ecc71", 0.7]} />

//         <Physics gravity={[0, -9.81, 0]} defaultContactMaterial={{ restitution: 0.4 }}>
//           <Stadium />
//           <Football
//             gameState={gameState}
//             aimX={aimX}
//             aimY={aimY}
//             power={power}
//             spin={spin}
//             shotType={shotType}
//             setGameState={setGameState}
//             setScore={setScore}
//           />
//           <Goal />
//           <Goalkeeper gameState={gameState} difficulty={aiDifficulty} aimX={aimX} />
//         </Physics>

//         {/* Visual effects */}
//         <EffectComposer>
//           <Bloom luminanceThreshold={0.2} intensity={0.5} levels={9} mipmapBlur />
//           <Vignette eskil={false} offset={0.1} darkness={0.5} />
//         </EffectComposer>

//         {/* Aim guide */}
//         {gameState === "aiming" && showAimGuide && (
//           <AimGuide aimX={aimX} aimY={aimY} power={power} spin={spin} shotType={shotType} />
//         )}
//       </Canvas>

//       {/* UI Elements */}
//       <div
//         className="gameUI"
//         style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
//       >
//         {/* Scoreboard */}
//         <div
//           style={{
//             position: "absolute",
//             top: 20,
//             left: 20,
//             color: "white",
//             background: "rgba(0,0,0,0.7)",
//             padding: "15px 25px",
//             borderRadius: "10px",
//             fontFamily: "Arial",
//             boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
//             backdropFilter: "blur(5px)",
//             border: "1px solid rgba(255,255,255,0.1)",
//           }}
//         >
//           <div style={{ fontSize: "28px", fontWeight: "bold" }}>
//             Score: {score} / {shots}
//           </div>
//           <div style={{ fontSize: "18px", marginTop: "5px" }}>Round: {round}/5</div>
//           <div style={{ fontSize: "16px", marginTop: "5px", color: "#f39c12" }}>
//             Streak: {streak} | Best: {bestStreak}
//           </div>
//         </div>

//         {/* Controls */}
//         <div
//           style={{
//             position: "absolute",
//             top: 20,
//             right: 20,
//             display: "flex",
//             gap: "10px",
//             pointerEvents: "all",
//           }}
//         >
//           <button
//             style={{
//               padding: "8px 15px",
//               background: showAimGuide ? "#3498db" : "rgba(44, 62, 80, 0.8)",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//               fontWeight: showAimGuide ? "bold" : "normal",
//               boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//               transition: "all 0.2s ease",
//             }}
//             onClick={() => setShowAimGuide(!showAimGuide)}
//           >
//             {showAimGuide ? "Hide Guide" : "Show Guide"}
//           </button>

//           <button
//             style={{
//               padding: "8px 15px",
//               background: showStats ? "#e74c3c" : "rgba(44, 62, 80, 0.8)",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//               boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//               transition: "all 0.2s ease",
//             }}
//             onClick={() => setShowStats(!showStats)}
//           >
//             {showStats ? "Hide Stats" : "Show Stats"}
//           </button>

//           <button
//             style={{
//               padding: "8px 15px",
//               background: soundEnabled ? "#2ecc71" : "rgba(44, 62, 80, 0.8)",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//               boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//               transition: "all 0.2s ease",
//             }}
//             onClick={() => setSoundEnabled(!soundEnabled)}
//           >
//             {soundEnabled ? "Sound: ON" : "Sound: OFF"}
//           </button>
//         </div>

//         {/* Shot type selector */}
//         <div
//           style={{
//             position: "absolute",
//             top: 70,
//             right: 20,
//             pointerEvents: "all",
//           }}
//         >
//           <button
//             style={{
//               padding: "8px 15px",
//               background: "rgba(44, 62, 80, 0.8)",
//               color: "white",
//               border: "2px solid",
//               borderColor: shotType === "normal" ? "#3498db" : shotType === "curve" ? "#e74c3c" : "#f39c12",
//               borderRadius: "6px",
//               cursor: "pointer",
//               boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//               transition: "all 0.2s ease",
//               fontWeight: "bold",
//             }}
//             onClick={toggleShotType}
//             disabled={gameState !== "ready"}
//           >
//             Shot Type: {shotType.charAt(0).toUpperCase() + shotType.slice(1)}
//           </button>
//         </div>

//         {/* Stats panel */}
//         {showStats && (
//           <div
//             style={{
//               position: "absolute",
//               top: 120,
//               right: 20,
//               background: "rgba(0,0,0,0.8)",
//               color: "white",
//               padding: "15px",
//               borderRadius: "10px",
//               backdropFilter: "blur(5px)",
//               border: "1px solid rgba(255,255,255,0.1)",
//               boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
//               maxWidth: "300px",
//             }}
//           >
//             <h3 style={{ margin: "0 0 10px", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "5px" }}>
//               Game Stats
//             </h3>
//             <p>Accuracy: {shots > 0 ? Math.round((score / shots) * 100) : 0}%</p>
//             <p>Current Streak: {streak}</p>
//             <p>Best Streak: {bestStreak}</p>
//             <p>Difficulty: {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}</p>
//             <p>Shot Type: {shotType.charAt(0).toUpperCase() + shotType.slice(1)}</p>
//           </div>
//         )}

//         {/* Aim indicator */}
//         {gameState === "aiming" && (
//           <div
//             style={{
//               position: "absolute",
//               left: `${50 + (aimX / 14) * 40}%`,
//               top: `${50 - (aimY / 10) * 40}%`,
//               width: "30px",
//               height: "30px",
//               borderRadius: "50%",
//               background: "rgba(255, 0, 0, 0.5)",
//               border: "2px solid rgba(255, 255, 255, 0.8)",
//               transform: "translate(-50%, -50%)",
//               boxShadow: "0 0 10px rgba(255,0,0,0.7)",
//               transition: "all 0.1s ease",
//             }}
//           />
//         )}

//         {/* Power bar */}
//         {showPowerBar && (
//           <div
//             ref={powerBarRef}
//             style={{
//               position: "absolute",
//               bottom: "120px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               width: "400px",
//               height: "30px",
//               background: "rgba(0,0,0,0.7)",
//               borderRadius: "15px",
//               overflow: "hidden",
//               boxShadow: "0 0 15px rgba(0,0,0,0.5)",
//               border: "2px solid rgba(255,255,255,0.2)",
//             }}
//           >
//             <div
//               style={{
//                 height: "100%",
//                 width: `${power}%`,
//                 background: `linear-gradient(90deg, #2ecc71, #f1c40f ${power > 70 ? "70%" : "100%"}, ${power > 70 ? "#e74c3c" : "#f1c40f"})`,
//                 transition: "width 0.05s",
//                 boxShadow: "inset 0 0 10px rgba(255,255,255,0.3)",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 transform: "translate(-50%, -50%)",
//                 color: "white",
//                 fontWeight: "bold",
//                 textShadow: "0 0 3px black",
//                 fontSize: "16px",
//               }}
//             >
//               POWER: {Math.round(power)}% (Click to set)
//             </div>
//           </div>
//         )}

//         {/* Spin bar */}
//         {showSpinBar && (
//           <div
//             style={{
//               position: "absolute",
//               bottom: "120px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               width: "400px",
//               height: "30px",
//               background: "rgba(0,0,0,0.7)",
//               borderRadius: "15px",
//               overflow: "hidden",
//               boxShadow: "0 0 15px rgba(0,0,0,0.5)",
//               border: "2px solid rgba(255,255,255,0.2)",
//             }}
//           >
//             <div
//               style={{
//                 position: "absolute",
//                 height: "100%",
//                 width: "2px",
//                 background: "white",
//                 left: "50%",
//                 transform: "translateX(-50%)",
//                 zIndex: 2,
//               }}
//             />
//             <div
//               style={{
//                 height: "100%",
//                 width: `${50 + spin / 2}%`,
//                 background: `linear-gradient(90deg, #3498db, #2ecc71)`,
//                 transition: "width 0.05s",
//                 boxShadow: "inset 0 0 10px rgba(255,255,255,0.3)",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 transform: "translate(-50%, -50%)",
//                 color: "white",
//                 fontWeight: "bold",
//                 textShadow: "0 0 3px black",
//                 fontSize: "16px",
//                 width: "100%",
//                 textAlign: "center",
//               }}
//             >
//               SPIN: {spin < 0 ? "LEFT" : spin > 0 ? "RIGHT" : "NONE"} {Math.abs(Math.round(spin))}% (Click to shoot)
//             </div>
//           </div>
//         )}

//         {/* Game state message */}
//         {gameState !== "ready" && gameState !== "aiming" && gameState !== "shooting" && (
//           <div
//             style={{
//               position: "absolute",
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%)",
//               color: "white",
//               fontSize: "60px",
//               fontWeight: "bold",
//               textShadow: "0 0 20px rgba(0,0,0,0.8)",
//               textAlign: "center",
//             }}
//           >
//             {gameState === "scored" && (
//               <div>
//                 <div style={{ color: "#2ecc71" }}>GOAL!</div>
//                 <div style={{ fontSize: "24px", marginTop: "10px" }}>{streak > 1 ? `${streak} in a row!` : ""}</div>
//               </div>
//             )}
//             {gameState === "saved" && <div style={{ color: "#e74c3c" }}>SAVED!</div>}
//             {gameState === "missed" && <div style={{ color: "#e67e22" }}>MISSED!</div>}
//             {gameState === "gameOver" && (
//               <div>
//                 <div>GAME OVER</div>
//                 <div style={{ fontSize: "30px", marginTop: "20px" }}>
//                   Final Score: {score}/{shots}
//                 </div>
//                 <div style={{ fontSize: "24px", marginTop: "10px" }}>
//                   Accuracy: {shots > 0 ? Math.round((score / shots) * 100) : 0}%
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Celebration effect */}
//         {showCelebration && (
//           <div
//             style={{
//               position: "fixed",
//               top: 0,
//               left: 0,
//               width: "100%",
//               height: "100%",
//               pointerEvents: "none",
//               overflow: "hidden",
//               zIndex: 10,
//             }}
//           >
//             {Array.from({ length: 100 }).map((_, i) => (
//               <div
//                 key={i}
//                 style={{
//                   position: "absolute",
//                   left: `${Math.random() * 100}%`,
//                   top: `${Math.random() * 100}%`,
//                   width: `${Math.random() * 10 + 5}px`,
//                   height: `${Math.random() * 10 + 5}px`,
//                   background: `hsl(${Math.random() * 360}, 100%, 50%)`,
//                   borderRadius: "50%",
//                   animation: `fall ${Math.random() * 3 + 2}s linear`,
//                 }}
//               />
//             ))}
//             <div
//               style={{
//                 position: "absolute",
//                 top: "30%",
//                 left: "50%",
//                 transform: "translate(-50%, -50%)",
//                 color: "#f1c40f",
//                 fontSize: "40px",
//                 fontWeight: "bold",
//                 textShadow: "0 0 10px rgba(0,0,0,0.5)",
//                 animation: "pulse 0.5s infinite alternate",
//               }}
//             >
//               NEW BEST STREAK: {bestStreak}!
//             </div>
//           </div>
//         )}

//         {/* Tutorial */}
//         {showTutorial && (
//           <div
//             style={{
//               position: "absolute",
//               bottom: "180px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               background: "rgba(0,0,0,0.8)",
//               color: "white",
//               padding: "20px",
//               borderRadius: "15px",
//               maxWidth: "600px",
//               textAlign: "center",
//               pointerEvents: "all",
//               backdropFilter: "blur(5px)",
//               border: "1px solid rgba(255,255,255,0.1)",
//               boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
//             }}
//           >
//             <h3 style={{ margin: "0 0 15px", fontSize: "24px", color: "#3498db" }}>How to Play</h3>
//             <div style={{ display: "flex", justifyContent: "space-between", textAlign: "left" }}>
//               <div style={{ flex: 1, padding: "0 10px" }}>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>
//                   1. Click <strong>Aim & Shoot</strong> to begin
//                 </p>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>2. Move your mouse to aim the ball</p>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>3. Click once to set power</p>
//               </div>
//               <div style={{ flex: 1, padding: "0 10px" }}>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>4. Click again to set spin and shoot</p>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>5. Try different shot types!</p>
//                 <p style={{ margin: "8px 0", fontSize: "16px" }}>6. Build a streak of goals to win!</p>
//               </div>
//             </div>
//             <button
//               style={{
//                 padding: "10px 25px",
//                 background: "linear-gradient(to right, #3498db, #2980b9)",
//                 border: "none",
//                 borderRadius: "8px",
//                 marginTop: "15px",
//                 cursor: "pointer",
//                 color: "white",
//                 fontWeight: "bold",
//                 fontSize: "16px",
//                 boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
//                 transition: "all 0.2s ease",
//               }}
//               onClick={() => setShowTutorial(false)}
//             >
//               Got it!
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Game controls */}
//       <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
//         {gameState === "ready" && (
//           <button
//             style={{
//               padding: "15px 30px",
//               fontSize: "20px",
//               background: "linear-gradient(to right, #e74c3c, #c0392b)",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
//               transition: "all 0.3s",
//               fontWeight: "bold",
//               letterSpacing: "1px",
//             }}
//             onClick={startAiming}
//           >
//             Aim & Shoot
//           </button>
//         )}

//         {gameState === "aiming" && showPowerBar && (
//           <button
//             style={{
//               padding: "15px 30px",
//               fontSize: "20px",
//               background: "linear-gradient(to right, #f39c12, #d35400)",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
//               transition: "all 0.3s",
//               fontWeight: "bold",
//               letterSpacing: "1px",
//             }}
//             onClick={setShootPower}
//           >
//             Set Power: {Math.round(power)}%
//           </button>
//         )}

//         {gameState === "aiming" && showSpinBar && (
//           <button
//             style={{
//               padding: "15px 30px",
//               fontSize: "20px",
//               background: "linear-gradient(to right, #2ecc71, #27ae60)",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
//               transition: "all 0.3s",
//               fontWeight: "bold",
//               letterSpacing: "1px",
//             }}
//             onClick={shoot}
//           >
//             Shoot!{" "}
//             {spin < 0
//               ? `(Left Spin ${Math.abs(Math.round(spin))})`
//               : spin > 0
//                 ? `(Right Spin ${Math.round(spin)})`
//                 : "(No Spin)"}
//           </button>
//         )}

//         {gameState === "gameOver" && (
//           <button
//             style={{
//               padding: "15px 30px",
//               fontSize: "20px",
//               background: "linear-gradient(to right, #3498db, #2980b9)",
//               color: "white",
//               border: "none",
//               borderRadius: "8px",
//               cursor: "pointer",
//               boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
//               transition: "all 0.3s",
//               fontWeight: "bold",
//               letterSpacing: "1px",
//             }}
//             onClick={resetGame}
//           >
//             Play Again
//           </button>
//         )}

//         {/* Difficulty selector */}
//         <div
//           style={{
//             marginTop: "15px",
//             display: "flex",
//             justifyContent: "center",
//             gap: "15px",
//           }}
//         >
//           {["easy", "medium", "hard"].map((level) => (
//             <button
//               key={level}
//               style={{
//                 padding: "8px 15px",
//                 background:
//                   aiDifficulty === level
//                     ? level === "easy"
//                       ? "#27ae60"
//                       : level === "medium"
//                         ? "#9b59b6"
//                         : "#c0392b"
//                     : "rgba(127, 140, 141, 0.8)",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "6px",
//                 cursor: "pointer",
//                 fontWeight: aiDifficulty === level ? "bold" : "normal",
//                 boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//                 transition: "all 0.2s ease",
//               }}
//               onClick={() => setAiDifficulty(level)}
//               disabled={gameState !== "ready"}
//             >
//               {level.charAt(0).toUpperCase() + level.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* CSS Animations */}
//       <style jsx global>{`
//         @keyframes fall {
//           0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
//           100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
//         }
//         @keyframes pulse {
//           0% { transform: translate(-50%, -50%) scale(1); }
//           100% { transform: translate(-50%, -50%) scale(1.1); }
//         }
//         body {
//           margin: 0;
//           overflow: hidden;
//         }
//         button:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 6px 12px rgba(0,0,0,0.3);
//         }
//         button:active {
//           transform: translateY(1px);
//           box-shadow: 0 2px 5px rgba(0,0,0,0.2);
//         }
//       `}</style>
//     </div>
//   )
// }

// // Stadium with indoor arena feel
// function Stadium() {
//   // Ground
//   const [fieldRef] = usePlane(() => ({
//     rotation: [-Math.PI / 2, 0, 0],
//     position: [0, 0, 0],
//     type: "Static",
//     material: { friction: 0.3 },
//   }))

//   // Create field texture
//   const fieldTexture = useRef(createFieldTexture())

//   return (
//     <group>
//       {/* Field */}
//       <mesh ref={fieldRef} receiveShadow>
//         <planeGeometry args={[100, 100]} />
//         <meshStandardMaterial map={fieldTexture.current} roughness={0.8} />
//       </mesh>

//       {/* Indoor arena walls */}
//       <IndoorArena />

//       {/* Penalty spot */}
//       <mesh position={[0, 0.01, 11]} rotation={[-Math.PI / 2, 0, 0]}>
//         <circleGeometry args={[0.2, 16]} />
//         <meshStandardMaterial color="white" />
//       </mesh>

//       {/* Penalty area */}
//       <PenaltyArea />

//       {/* Floating lights */}
//       <FloatingLights />
//     </group>
//   )
// }

// // Indoor Arena
// function IndoorArena() {
//   return (
//     <group>
//       {/* Back wall */}
//       <mesh position={[0, 15, -40]} rotation={[0, 0, 0]}>
//         <planeGeometry args={[100, 30]} />
//         <meshStandardMaterial color="#1a2a3a" />
//       </mesh>

//       {/* Side walls */}
//       <mesh position={[-50, 15, 0]} rotation={[0, Math.PI / 2, 0]}>
//         <planeGeometry args={[80, 30]} />
//         <meshStandardMaterial color="#1a2a3a" />
//       </mesh>

//       <mesh position={[50, 15, 0]} rotation={[0, -Math.PI / 2, 0]}>
//         <planeGeometry args={[80, 30]} />
//         <meshStandardMaterial color="#1a2a3a" />
//       </mesh>

//       {/* Ceiling */}
//       <mesh position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[100, 80]} />
//         <meshStandardMaterial color="#0f1a2a" />
//       </mesh>

//       {/* Decorative elements */}
//       <DecorativeElements />
//     </group>
//   )
// }

// // Decorative Elements
// function DecorativeElements() {
//   return (
//     <group>
//       {/* Banners */}
//       {[-30, -15, 0, 15, 30].map((x, i) => (
//         <mesh key={i} position={[x, 20, -39]} rotation={[0, 0, 0]}>
//           <planeGeometry args={[8, 4]} />
//           <meshStandardMaterial color={["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6"][i]} />
//         </mesh>
//       ))}

//       {/* Spotlights */}
//       {[-25, 25].map((x, i) => (
//         <group key={i} position={[x, 25, -20]}>
//           <mesh rotation={[Math.PI / 4, 0, 0]}>
//             <cylinderGeometry args={[1, 2, 3, 16]} />
//             <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
//           </mesh>
//           <pointLight position={[0, 0, 0]} intensity={5} distance={60} color={i === 0 ? "#3498db" : "#e74c3c"} />
//         </group>
//       ))}
//     </group>
//   )
// }

// // Floating Lights
// function FloatingLights() {
//   return (
//     <group>
//       {Array.from({ length: 10 }).map((_, i) => {
//         const x = (Math.random() - 0.5) * 40
//         const z = -10 - Math.random() * 20
//         const y = 10 + Math.random() * 15
//         const color = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6"][Math.floor(Math.random() * 5)]

//         return (
//           <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={2}>
//             <mesh position={[x, y, z]}>
//               <sphereGeometry args={[0.5, 16, 16]} />
//               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
//               <pointLight color={color} intensity={2} distance={10} />
//             </mesh>
//           </Float>
//         )
//       })}
//     </group>
//   )
// }

// // Create field texture
// function createFieldTexture() {
//   const canvas = document.createElement("canvas")
//   canvas.width = 1024
//   canvas.height = 1024
//   const ctx = canvas.getContext("2d")

//   if (!ctx) {
//     console.error("Failed to get 2D context")
//     return null
//   }

//   // Base green color
//   const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
//   gradient.addColorStop(0, "#2c3e50")
//   gradient.addColorStop(1, "#1a2a3a")
//   ctx.fillStyle = gradient
//   ctx.fillRect(0, 0, canvas.width, canvas.height)

//   // Draw field pattern
//   ctx.strokeStyle = "rgba(52, 152, 219, 0.2)"
//   ctx.lineWidth = 2

//   // Horizontal lines
//   for (let i = 0; i < canvas.height; i += 40) {
//     ctx.beginPath()
//     ctx.moveTo(0, i)
//     ctx.lineTo(canvas.width, i)
//     ctx.stroke()
//   }

//   // Vertical lines for cross pattern
//   for (let i = 0; i < canvas.width; i += 40) {
//     ctx.beginPath()
//     ctx.moveTo(i, 0)
//     ctx.lineTo(i, canvas.height)
//     ctx.stroke()
//   }

//   // Create texture
//   const texture = new THREE.CanvasTexture(canvas)
//   texture.wrapS = THREE.RepeatWrapping
//   texture.wrapT = THREE.RepeatWrapping
//   texture.repeat.set(4, 4)

//   return texture
// }

// // Penalty Area
// function PenaltyArea() {
//   return (
//     <group>
//       {/* Penalty box */}
//       <mesh position={[0, 0.01, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
//         <ringGeometry args={[0, 16.5 / 2, 32, 1, 0, Math.PI]} />
//         <meshStandardMaterial color="#3498db" transparent opacity={0.6} side={THREE.DoubleSide} />
//       </mesh>

//       {/* Box lines */}
//       <mesh position={[0, 0.01, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[16.5, 11]} />
//         <meshBasicMaterial color="#3498db" wireframe={true} transparent opacity={0.4} />
//       </mesh>

//       {/* Center circle */}
//       <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
//         <ringGeometry args={[9, 9.2, 64]} />
//         <meshStandardMaterial color="#3498db" transparent opacity={0.4} />
//       </mesh>
//     </group>
//   )
// }

// // Aim Guide
// function AimGuide({ aimX, aimY, power, spin, shotType }) {
//   const { scene } = useThree()
//   const guideRef = useRef<THREE.Group | null>(null)

//   useEffect(() => {
//     if (guideRef.current) {
//       scene.add(guideRef.current)
//     }
//     return () => {
//       if (guideRef.current) {
//         scene.remove(guideRef.current)
//       }
//     }
//   }, [scene])

//   useFrame(() => {
//     if (!guideRef.current) {
//       guideRef.current = new THREE.Group()
//       scene.add(guideRef.current)
//     }

//     // Clear previous guide
//     while (guideRef.current.children.length > 0) {
//       guideRef.current.remove(guideRef.current.children[0])
//     }

//     // Create guide based on aim, power, and spin
//     const startPos = new THREE.Vector3(0, 0.22, 11)
//     const points = []
//     points.push(startPos.clone())

//     // Calculate trajectory
//     const powerFactor = power / 60
//     const kickForce = 18 * powerFactor

//     // Calculate angle and velocity
//     const angleY = Math.PI / 8 + (aimY / 10) * (Math.PI / 8)
//     const angleX = (aimX / 14) * (Math.PI / 8)

//     // Convert angles to direction vector
//     const dirX = Math.sin(angleX) * kickForce
//     const dirY = Math.sin(angleY) * kickForce
//     const dirZ = -Math.cos(angleX) * Math.cos(angleY) * kickForce

//     // Initial velocity
//     const velocity = new THREE.Vector3(dirX, dirY, dirZ)

//     // Simulate trajectory
//     const gravity = new THREE.Vector3(0, -9.81, 0)
//     const spinEffect = new THREE.Vector3(spin / 20, 0, 0)
//     const pos = startPos.clone()
//     const timeStep = 0.1

//     for (let t = 0; t < 2; t += timeStep) {
//       // Apply spin effect (curves the ball)
//       if (shotType === "curve") {
//         // Curve increases over time
//         const curveEffect = spinEffect.clone().multiplyScalar(t * 0.5)
//         velocity.add(curveEffect)
//       } else if (shotType === "lob") {
//         // Lob has higher initial Y velocity and more drag
//         if (t === 0) {
//           velocity.y *= 1.5
//         }
//         velocity.multiplyScalar(0.98) // Air resistance
//       }

//       // Update position
//       pos.add(velocity.clone().multiplyScalar(timeStep))

//       // Apply gravity
//       velocity.add(gravity.clone().multiplyScalar(timeStep))

//       // Add point to trajectory
//       points.push(pos.clone())

//       // Stop if ball hits ground
//       if (pos.y < 0.22) break
//     }

//     // Create line for trajectory
//     const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
//     const lineMaterial = new THREE.LineBasicMaterial({
//       color: shotType === "normal" ? 0xffffff : shotType === "curve" ? 0xe74c3c : 0xf39c12,
//       transparent: true,
//       opacity: 0.6,
//       linewidth: 2,
//     })
//     const line = new THREE.Line(lineGeometry, lineMaterial)
//     guideRef.current.add(line)

//     // Add dots along trajectory
//     for (let i = 0; i < points.length; i += 3) {
//       const dotGeometry = new THREE.SphereGeometry(0.05, 8, 8)
//       const dotMaterial = new THREE.MeshBasicMaterial({
//         color: shotType === "normal" ? 0xffffff : shotType === "curve" ? 0xe74c3c : 0xf39c12,
//         transparent: true,
//         opacity: 0.8,
//       })
//       const dot = new THREE.Mesh(dotGeometry, dotMaterial)
//       dot.position.copy(points[i])
//       guideRef.current.add(dot)
//     }
//   })

//   return null
// }

// // Football
// function Football({ gameState, aimX, aimY, power, spin, shotType, setGameState, setScore }) {
//   const [ballRef, api] = useSphere(() => ({
//     mass: 0.43,
//     position: [0, 0.22, 11],
//     args: [0.22],
//     linearDamping: 0.3,
//     angularDamping: 0.2,
//     material: { restitution: 0.7, friction: 0.3 },
//   }))

//   const velocity = useRef([0, 0, 0])
//   const position = useRef([0, 0.22, 11])
//   const ballTexture = useRef(createFootballTexture())

//   // Subscribe to physics updates
//   useEffect(() => {
//     const unsubPosition = api.position.subscribe((v) => (position.current = v))
//     const unsubVelocity = api.velocity.subscribe((v) => (velocity.current = v))

//     return () => {
//       unsubPosition()
//       unsubVelocity()
//     }
//   }, [api])

//   // Reset ball position when returning to ready state
//   useEffect(() => {
//     if (gameState === "ready") {
//       api.position.set(0, 0.22, 11)
//       api.velocity.set(0, 0, 0)
//       api.angularVelocity.set(0, 0, 0)
//     }
//   }, [gameState, api])

//   // Kick the ball when shooting
//   useEffect(() => {
//     if (gameState === "shooting") {
//       // Apply force to ball with direction and power
//       const powerFactor = power / 60
//       const kickForce = 18 * powerFactor

//       // Calculate angle and velocity
//       const angleY = Math.PI / 8 + (aimY / 10) * (Math.PI / 8)
//       const angleX = (aimX / 14) * (Math.PI / 8)

//       // Convert angles to direction vector
//       let dirX = Math.sin(angleX) * kickForce
//       let dirY = Math.sin(angleY) * kickForce
//       let dirZ = -Math.cos(angleX) * Math.cos(angleY) * kickForce

//       // Apply shot type modifications
//       if (shotType === "curve") {
//         // Curve shot has initial side spin
//         dirX += spin / 50
//       } else if (shotType === "lob") {
//         // Lob shot has higher trajectory
//         dirY *= 1.5
//         dirZ *= 0.8
//       }

//       // Apply impulse for the kick
//       api.velocity.set(0, 0, 0) // Reset velocity first
//       api.applyImpulse([dirX, dirY, dirZ], [0, 0, 0])

//       // Apply spin based on aim and shot type
//       const spinX = -aimX * 5
//       const spinY = spin / 10
//       const spinZ = shotType === "curve" ? spin / 5 : 0
//       api.angularVelocity.set(spinX, spinY, spinZ)

//       // For curve shots, apply continuous force
//       if (shotType === "curve") {
//         const interval = setInterval(() => {
//           api.applyForce([spin / 100, 0, 0], [0, 0, 0])
//         }, 100)

//         // Clear interval after 1.5 seconds
//         setTimeout(() => clearInterval(interval), 1500)
//       }
//     }
//   }, [gameState, api, aimX, aimY, power, spin, shotType])

//   // Check for goal or miss
//   useFrame(() => {
//     const [x, y, z] = position.current

//     // Only check the goal state when the ball is moving and near the goal
//     if (gameState === "shooting") {
//       // Goal detection - more lenient with increased goal height
//       if (z < 0.5 && z > -3 && y < 3.0 && y > 0 && Math.abs(x) < 3.8) {
//         setGameState("scored")
//         setScore((prev) => prev + 1)
//       }
//       // Miss detection - out of bounds or stopped
//       else if (
//         (z < -5 ||
//           Math.abs(x) > 20 ||
//           (Math.abs(velocity.current[0]) + Math.abs(velocity.current[1]) + Math.abs(velocity.current[2]) < 0.05 &&
//             z < 0.5)) && // Only count as stopped if it's past the goal line
//         gameState === "shooting"
//       ) {
//         // Give more time for the ball to potentially go in
//         if (z > 0.5 && Math.abs(velocity.current[2]) < 0.05 && y < 3.0) {
//           setGameState("saved")
//         } else if (z < -5 || Math.abs(x) > 20 || (z < 0.5 && Math.abs(velocity.current[2]) < 0.05)) {
//           setGameState("missed")
//         }
//       }
//     }

//     // Ball rotation based on velocity
//     if (ballRef.current) {
//       const speed = Math.sqrt(velocity.current[0] ** 2 + velocity.current[1] ** 2 + velocity.current[2] ** 2)

//       // Calculate rotation axis perpendicular to velocity
//       if (speed > 0.1) {
//         const axis = new THREE.Vector3(-velocity.current[1], velocity.current[0], 0).normalize()

//         // Apply rotation
//         ballRef.current.rotateOnAxis(axis, speed * 0.2)
//       }
//     }
//   })

//   return (
//     <>
//       {gameState === "shooting" && (
//         <Trail
//           width={1}
//           color={shotType === "normal" ? "white" : shotType === "curve" ? "#e74c3c" : "#f39c12"}
//           length={5}
//           decay={2}
//           attenuation={(width) => width}
//         >
//           <mesh ref={ballRef} castShadow>
//             <sphereGeometry args={[0.22, 32, 32]} />
//             <meshStandardMaterial map={ballTexture.current} roughness={0.4} metalness={0.1} bumpScale={0.002} />
//           </mesh>
//         </Trail>
//       )}
//     </>
//   )
// }

// // Create football texture with improved quality
// function createFootballTexture() {
//   // Create canvas with better dimensions for quality
//   const canvas = document.createElement("canvas")
//   canvas.width = 512
//   canvas.height = 512
//   const ctx = canvas.getContext("2d")

//   if (!ctx) {
//     console.error("Failed to get 2D context")
//     return null
//   }

//   // Base color
//   ctx.fillStyle = "white"
//   ctx.fillRect(0, 0, 512, 512)

//   // Draw pentagons
//   const pentagon = (x, y, size) => {
//     ctx.beginPath()
//     for (let i = 0; i < 5; i++) {
//       const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
//       ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle))
//     }
//     ctx.closePath()
//     ctx.fillStyle = "black"
//     ctx.fill()
//   }

//   // Draw hexagons
//   const hexagon = (x, y, size) => {
//     ctx.beginPath()
//     for (let i = 0; i < 6; i++) {
//       const angle = (Math.PI * 2 * i) / 6
//       ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle))
//     }
//     ctx.closePath()
//     ctx.fillStyle = "#222"
//     ctx.fill()
//     ctx.strokeStyle = "white"
//     ctx.lineWidth = 2
//     ctx.stroke()
//   }

//   // Draw pattern with more detail
//   const patternSize = 40
//   pentagon(256, 256, patternSize)
//   pentagon(128, 128, patternSize * 0.7)
//   pentagon(384, 128, patternSize * 0.7)
//   pentagon(128, 384, patternSize * 0.7)
//   pentagon(384, 384, patternSize * 0.7)

//   hexagon(256, 150, patternSize * 0.6)
//   hexagon(256, 362, patternSize * 0.6)
//   hexagon(150, 256, patternSize * 0.6)
//   hexagon(362, 256, patternSize * 0.6)

//   // Add manufacturer logo (simulated)
//   ctx.fillStyle = "#3498db"
//   ctx.font = "bold 24px Arial"
//   ctx.textAlign = "center"
//   ctx.fillText("PRO BALL", 256, 40)

//   // Add subtle shading for 3D effect
//   const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
//   gradient.addColorStop(0, "rgba(255,255,255,0)")
//   gradient.addColorStop(0.8, "rgba(200,200,200,0)")
//   gradient.addColorStop(1, "rgba(150,150,150,0.2)")
//   ctx.fillStyle = gradient
//   ctx.fillRect(0, 0, 512, 512)

//   // Create texture from canvas
//   const texture = new THREE.CanvasTexture(canvas)
//   texture.anisotropy = 8 // Increased anisotropic filtering for better quality
//   return texture
// }

// // Goal with realistic posts, crossbar, and net
// function Goal() {
//   const [crossbarRef] = useBox(() => ({
//     args: [7.32, 0.08, 0.08],
//     position: [0, 3.0, 0], // Increased height
//     type: "Static",
//     material: { restitution: 0.7 },
//   }))

//   const [leftPostRef] = useBox(() => ({
//     args: [0.08, 3.0, 0.08], // Increased height
//     position: [-3.66, 1.5, 0], // Adjusted position
//     type: "Static",
//     material: { restitution: 0.7 },
//   }))

//   const [rightPostRef] = useBox(() => ({
//     args: [0.08, 3.0, 0.08], // Increased height
//     position: [3.66, 1.5, 0], // Adjusted position
//     type: "Static",
//     material: { restitution: 0.7 },
//   }))

//   // Back bar to hold net
//   const [backBarRef] = useBox(() => ({
//     args: [7.32, 0.05, 0.05],
//     position: [0, 0, -2],
//     type: "Static",
//   }))

//   // Top back bar
//   const [topBackBarRef] = useBox(() => ({
//     args: [7.32, 0.05, 0.05],
//     position: [0, 3.0, -2], // Increased height
//     type: "Static",
//   }))

//   // Left back post
//   const [leftBackPostRef] = useBox(() => ({
//     args: [0.05, 3.0, 0.05], // Increased height
//     position: [-3.66, 1.5, -2], // Adjusted position
//     type: "Static",
//   }))

//   // Right back post
//   const [rightBackPostRef] = useBox(() => ({
//     args: [0.05, 3.0, 0.05], // Increased height
//     position: [3.66, 1.5, -2], // Adjusted position
//     type: "Static",
//   }))

//   return (
//     <group>
//       {/* Posts and crossbar with glow effect */}
//       <mesh ref={crossbarRef} castShadow receiveShadow>
//         <boxGeometry args={[7.32, 0.08, 0.08]} />
//         <meshStandardMaterial color="white" metalness={0.4} roughness={0.2} emissive="white" emissiveIntensity={0.2} />
//       </mesh>

//       <mesh ref={leftPostRef} castShadow receiveShadow>
//         <boxGeometry args={[0.08, 3.0, 0.08]} />
//         <meshStandardMaterial color="white" metalness={0.4} roughness={0.2} emissive="white" emissiveIntensity={0.2} />
//       </mesh>

//       <mesh ref={rightPostRef} castShadow receiveShadow>
//         <boxGeometry args={[0.08, 3.0, 0.08]} />
//         <meshStandardMaterial color="white" metalness={0.4} roughness={0.2} emissive="white" emissiveIntensity={0.2} />
//       </mesh>

//       {/* Back frame for net */}
//       <mesh ref={backBarRef} castShadow>
//         <boxGeometry args={[7.32, 0.05, 0.05]} />
//         <meshStandardMaterial color="white" transparent opacity={0.5} />
//       </mesh>

//       <mesh ref={topBackBarRef} castShadow>
//         <boxGeometry args={[7.32, 0.05, 0.05]} />
//         <meshStandardMaterial color="white" transparent opacity={0.5} />
//       </mesh>

//       <mesh ref={leftBackPostRef} castShadow>
//         <boxGeometry args={[0.05, 3.0, 0.05]} />
//         <meshStandardMaterial color="white" transparent opacity={0.5} />
//       </mesh>

//       <mesh ref={rightBackPostRef} castShadow>
//         <boxGeometry args={[0.05, 3.0, 0.05]} />
//         <meshStandardMaterial color="white" transparent opacity={0.5} />
//       </mesh>

//       {/* Net - sides */}
//       <Net />
//     </group>
//   )
// }

// // Goal Net using multiple planes with transparency
// function Net() {
//   // Create net material with improved appearance
//   const netMaterial = new THREE.MeshStandardMaterial({
//     color: "white",
//     opacity: 0.4,
//     transparent: true,
//     side: THREE.DoubleSide,
//     wireframe: true,
//     emissive: "white",
//     emissiveIntensity: 0.1,
//   })

//   const netConfig = {
//     width: 7.32,
//     height: 3.0, // Increased height
//     depth: 2,
//     segmentsW: 12,
//     segmentsH: 10, // Increased segments
//     segmentsD: 4,
//   }

//   return (
//     <group>
//       {/* Top */}
//       <mesh position={[0, 3.0, -1]} rotation={[-Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[7.32, 2, netConfig.segmentsW, netConfig.segmentsD]} />
//         <primitive object={netMaterial} />
//       </mesh>

//       {/* Bottom */}
//       <mesh position={[0, 0, -1]} rotation={[-Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[7.32, 2, netConfig.segmentsW, netConfig.segmentsD]} />
//         <primitive object={netMaterial} />
//       </mesh>

//       {/* Left side */}
//       <mesh position={[-3.66, 1.5, -1]} rotation={[0, Math.PI / 2, 0]}>
//         <planeGeometry args={[2, 3.0, netConfig.segmentsD, netConfig.segmentsH]} />
//         <primitive object={netMaterial} />
//       </mesh>

//       {/* Right side */}
//       <mesh position={[3.66, 1.5, -1]} rotation={[0, -Math.PI / 2, 0]}>
//         <planeGeometry args={[2, 3.0, netConfig.segmentsD, netConfig.segmentsH]} />
//         <primitive object={netMaterial} />
//       </mesh>

//       {/* Back */}
//       <mesh position={[0, 1.5, -2]}>
//         <planeGeometry args={[7.32, 3.0, netConfig.segmentsW, netConfig.segmentsH]} />
//         <primitive object={netMaterial} />
//       </mesh>
//     </group>
//   )
// }

// // Goalkeeper with realistic movement
// function Goalkeeper({ gameState, difficulty, aimX }) {
//   const [bodyRef, bodyApi] = useBox(() => ({
//     mass: 0,
//     args: [0.7, 1.8, 0.4],
//     position: [0, 0.9, 0.3],
//     type: "Kinematic",
//   }))

//   const [leftArmRef, leftArmApi] = useBox(() => ({
//     mass: 0,
//     args: [0.2, 0.7, 0.2],
//     position: [-0.7, 1.2, 0.3],
//     type: "Kinematic",
//   }))

//   const [rightArmRef, rightArmApi] = useBox(() => ({
//     mass: 0,
//     args: [0.2, 0.7, 0.2],
//     position: [0.7, 1.2, 0.3],
//     type: "Kinematic",
//   }))

//   const [leftLegRef, leftLegApi] = useBox(() => ({
//     mass: 0,
//     args: [0.25, 0.9, 0.25],
//     position: [-0.3, 0.45, 0.3],
//     type: "Kinematic",
//   }))

//   const [rightLegRef, rightLegApi] = useBox(() => ({
//     mass: 0,
//     args: [0.25, 0.9, 0.25],
//     position: [0.3, 0.45, 0.3],
//     type: "Kinematic",
//   }))

//   // Difficulty settings
//   const difficultySettings = {
//     easy: { speed: 0.4, prediction: 0.2, range: 0.5 },
//     medium: { speed: 0.6, prediction: 0.4, range: 0.7 },
//     hard: { speed: 0.9, prediction: 0.6, range: 0.9 },
//   }

//   // Goalkeeper state
//   const currentPos = useRef(0)
//   const targetPos = useRef(0)
//   const diving = useRef(false)
//   const diveDirection = useRef([0, 0, 0])
//   const diveAnimation = useRef(0)
//   const diveComplete = useRef(false)

//   // Reset goalkeeper state when returning to ready
//   useEffect(() => {
//     if (gameState === "ready") {
//       diving.current = false
//       diveAnimation.current = 0
//       diveComplete.current = false
//     }
//   }, [gameState])

//   // Handle goalkeeper movement
//   useFrame(() => {
//     if (gameState === "ready") {
//       // Small random movement during ready state
//       const time = Date.now() * 0.001
//       const idle = Math.sin(time * 0.5) * 0.5
//       bodyApi.position.set(idle, 0.9, 0.3)
//       leftArmApi.position.set(-0.7 + idle * 0.2, 1.2, 0.3)
//       rightArmApi.position.set(0.7 - idle * 0.2, 1.2, 0.3)
//       leftLegApi.position.set(-0.3, 0.45, 0.3)
//       rightLegApi.position.set(0.3, 0.45, 0.3)

//       // Reset rotation
//       bodyApi.rotation.set(0, 0, 0)
//       leftArmApi.rotation.set(0, 0, 0)
//       rightArmApi.rotation.set(0, 0, 0)
//       leftLegApi.rotation.set(0, 0, 0)
//       rightLegApi.rotation.set(0, 0, 0)
//     } else if (gameState === "aiming") {
//       // Tracking movement based on difficulty
//       const settings = difficultySettings[difficulty]

//       // Calculate target position based on player's aim and goalkeeper prediction
//       const maxOffset = 3 * settings.range // Maximum movement range
//       const prediction = aimX * settings.prediction // Predict player's aim
//       // Add randomness to prediction
//       const randomness = (Math.random() - 0.5) * (1 - settings.prediction)
//       targetPos.current = prediction + randomness

//       // Clamp to valid range
//       targetPos.current = Math.max(-maxOffset, Math.min(maxOffset, targetPos.current))

//       // Move gradually towards target position
//       const delta = targetPos.current - currentPos.current
//       currentPos.current += delta * 0.02 * settings.speed

//       // Update goalkeeper position
//       bodyApi.position.set(currentPos.current, 0.9, 0.3)
//       leftArmApi.position.set(currentPos.current - 0.7, 1.2, 0.3)
//       rightArmApi.position.set(currentPos.current + 0.7, 1.2, 0.3)
//       leftLegApi.position.set(currentPos.current - 0.3, 0.45, 0.3)
//       rightLegApi.position.set(currentPos.current + 0.3, 0.45, 0.3)
//     } else if (gameState === "shooting" && !diving.current) {
//       // Initiate a dive when shot is taken
//       const settings = difficultySettings[difficulty]

//       // Determine dive direction based on aim and difficulty
//       const diveTargetX = aimX * settings.prediction + (Math.random() - 0.5) * 5 * (1 - settings.prediction)
//       diveDirection.current = [Math.sign(diveTargetX) * 3.3, 0, 0]

//       // Randomly decide to dive low, middle, or high
//       const diveHeight = Math.random()
//       if (diveHeight < 0.4) {
//         // Low dive
//         diveDirection.current = [Math.sign(diveTargetX) * 3.3, 0.3, 0.3]
//       } else if (diveHeight < 0.8) {
//         // Middle dive
//         diveDirection.current = [diveDirection.current[0], 0.9, 0.3]
//       } else {
//         // High dive
//         diveDirection.current = [Math.sign(diveTargetX) * 3.3, 1.5, 0.3]
//       }

//       diving.current = true
//     } else if (diving.current && !diveComplete.current) {
//       // Execute diving animation
//       diveAnimation.current += 0.05
//       const progress = Math.min(1, diveAnimation.current)

//       // Dive motion with easing
//       const easeOutQuad = (t) => t * (2 - t)
//       const animProgress = easeOutQuad(progress)

//       // Calculate dive positions
//       const diveX = currentPos.current + (diveDirection.current[0] - currentPos.current) * animProgress
//       const diveY = 0.9 + (diveDirection.current[1] - 0.9) * animProgress
//       const diveZ = 0.3 + (diveDirection.current[2] - 0.3) * animProgress

//       // Apply dive positions
//       bodyApi.position.set(diveX, diveY, diveZ)

//       // Rotate body during dive
//       const rotation: [number, number, number] = [0, 0, ((Math.sign(diveDirection.current[0]) * Math.PI) / 4) * animProgress]
//       bodyApi.rotation.set(...rotation)

//       // Stretch arms during dive
//       const armX = Math.sign(diveDirection.current[0]) * (0.3 + 1.2 * animProgress)
//       const armY = 0.3 + 0.9 * animProgress
//       const armAngle = ((Math.sign(diveDirection.current[0] || 0) * Math.PI) / 3) * animProgress

//       leftArmApi.position.set(diveX - armX, diveY + 0.3, diveZ)
//       rightArmApi.position.set(diveX + armX, diveY + 0.3, diveZ)

//       leftArmApi.rotation.set(0, 0, armAngle)
//       rightArmApi.rotation.set(0, 0, -armAngle)

//       // Move legs during dive
//       leftLegApi.position.set(diveX - 0.3 - animProgress * 0.3, diveY - 0.5, diveZ)
//       rightLegApi.position.set(diveX + 0.3 + animProgress * 0.3, diveY - 0.5, diveZ)

//       if (Math.sign(diveDirection.current[0]) > 0) {
//         leftLegApi.rotation.set(0, 0, (Math.PI / 6) * animProgress)
//         rightLegApi.rotation.set(0, 0, (Math.PI / 3) * animProgress)
//       } else {
//         leftLegApi.rotation.set(0, 0, (-Math.PI / 3) * animProgress)
//         rightLegApi.rotation.set(0, 0, (-Math.PI / 6) * animProgress)
//       }

//       // Mark dive as complete when animation is done
//       if (progress >= 1) {
//         diveComplete.current = true
//       }
//     }
//   })

//   return (
//     <group>
//       {/* Body */}
//       <mesh ref={bodyRef} castShadow>
//         <boxGeometry args={[0.7, 1.8, 0.4]} />
//         <meshStandardMaterial color="#e74c3c" roughness={0.7} />

//         {/* Head */}
//         <mesh position={[0, 1.1, 0]}>
//           <sphereGeometry args={[0.25, 16, 16]} />
//           <meshStandardMaterial color="#f1c40f" roughness={0.6} />

//           {/* Eyes */}
//           <mesh position={[0.08, 0.05, 0.2]}>
//             <sphereGeometry args={[0.05, 8, 8]} />
//             <meshBasicMaterial color="black" />
//           </mesh>

//           <mesh position={[-0.08, 0.05, 0.2]}>
//             <sphereGeometry args={[0.05, 8, 8]} />
//             <meshBasicMaterial color="black" />
//           </mesh>

//           {/* Mouth */}
//           <mesh position={[0, -0.05, 0.2]} rotation={[0, 0, 0]}>
//             <boxGeometry args={[0.1, 0.03, 0.01]} />
//             <meshBasicMaterial color="black" />
//           </mesh>
//         </mesh>

//         {/* Jersey number */}
//         <mesh position={[0, 0.5, 0.21]}>
//           <planeGeometry args={[0.4, 0.4]} />
//           <meshBasicMaterial color="#e74c3c" transparent opacity={0.9} />
//           <Html position={[0, 0, 0.01]} transform occlude>
//             <div
//               style={{
//                 color: "white",
//                 fontSize: "24px",
//                 fontWeight: "bold",
//                 fontFamily: "Arial",
//                 textAlign: "center",
//                 width: "40px",
//                 height: "40px",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               1
//             </div>
//           </Html>
//         </mesh>
//       </mesh>

//       {/* Arms */}
//       <mesh ref={leftArmRef} castShadow>
//         <boxGeometry args={[0.2, 0.7, 0.2]} />
//         <meshStandardMaterial color="#f39c12" roughness={0.7} />
//       </mesh>

//       <mesh ref={rightArmRef} castShadow>
//         <boxGeometry args={[0.2, 0.7, 0.2]} />
//         <meshStandardMaterial color="#f39c12" roughness={0.7} />
//       </mesh>

//       {/* Legs */}
//       <mesh ref={leftLegRef} castShadow>
//         <boxGeometry args={[0.25, 0.9, 0.25]} />
//         <meshStandardMaterial color="#2c3e50" roughness={0.7} />
//       </mesh>

//       <mesh ref={rightLegRef} castShadow>
//         <boxGeometry args={[0.25, 0.9, 0.25]} />
//         <meshStandardMaterial color="#2c3e50" roughness={0.7} />
//       </mesh>
//     </group>
//   )
// }

