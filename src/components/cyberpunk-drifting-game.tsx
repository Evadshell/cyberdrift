"use client"

import { Suspense, useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { Environment } from "@react-three/drei"
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"

// Virtual Joystick Component
function VirtualJoystick({ setControls }) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 })
  const joystickRef = useRef(null)
  const maxDistance = 50 // Maximum distance the joystick can move

  // Calculate normalized values (-1 to 1) for steering and acceleration
  useEffect(() => {
    if (isDragging) {
      const deltaX = position.x - basePosition.x
      const deltaY = position.y - basePosition.y

      // Normalize values between -1 and 1
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const normalizedX = distance > 0 ? deltaX / Math.max(distance, maxDistance) : 0
      const normalizedY = distance > 0 ? -deltaY / Math.max(distance, maxDistance) : 0

      setControls({
        steering: normalizedX, // Left/Right
        throttle: normalizedY, // Forward/Backward
      })
    } else {
      // When not dragging, reset controls to neutral
      setControls({ steering: 0, throttle: 0 })
    }
  }, [position, basePosition, isDragging, setControls])

  const handleMouseDown = (e) => {
    // Get joystick element position
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setBasePosition({ x: centerX, y: centerY })
      setPosition({ x: e.clientX, y: e.clientY })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setPosition({ x: basePosition.x, y: basePosition.y })
  }

  // Also handle touch events for mobile
  const handleTouchStart = (e) => {
    if (joystickRef.current && e.touches.length > 0) {
      const rect = joystickRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setBasePosition({ x: centerX, y: centerY })
      setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length > 0) {
      setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      e.preventDefault() // Prevent screen scrolling while using the joystick
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setPosition({ x: basePosition.x, y: basePosition.y })
  }

  // Calculate joystick position
  const getJoystickStyles = () => {
    if (!isDragging) {
      return { transform: "translate(-50%, -50%)" }
    }

    let deltaX = position.x - basePosition.x
    let deltaY = position.y - basePosition.y

    // Limit movement radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX)
      deltaX = Math.cos(angle) * maxDistance
      deltaY = Math.sin(angle) * maxDistance
    }

    return {
      transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`,
    }
  }

  useEffect(() => {
    // Add document-level event listeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      // Clean up
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, basePosition])

  return (
    <div
      className="fixed bottom-20 left-20 w-32 h-32 bg-black bg-opacity-50 rounded-full border-2 border-cyan-500"
      ref={joystickRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="absolute w-16 h-16 bg-pink-500 rounded-full left-1/2 top-1/2 cursor-pointer"
        style={getJoystickStyles()}
      >
        <div className="absolute w-4 h-4 bg-cyan-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  )
}

// Completely new arcade-style car implementation
function ArcadeCar({ setScore, joystickControls }) {
  // Visual representation of the car (separate from physics)
  const carVisualRef = useRef(null)

  // Car state
  const [position, setPosition] = useState(new THREE.Vector3(0, 0.5, 0))
  const [rotation, setRotation] = useState(new THREE.Euler(0, 0, 0))
  const [speed, setSpeed] = useState(0)
  const [direction, setDirection] = useState(new THREE.Vector3(0, 0, -1))
  const [driftFactor, setDriftFactor] = useState(0)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isDrifting, setIsDrifting] = useState(false)

  // Trail effect for drifting
  const trailPositions = useMemo(() => {
    return Array(30)
      .fill(0)
      .map(() => new THREE.Vector3(0, 0.1, 0))
  }, [])

  const leftTrailRef = useRef(null)
  const rightTrailRef = useRef(null)

  // Collectibles state
  const [collectedPoints, setCollectedPoints] = useState(Array(20).fill(false))

  // Camera control
  const { camera } = useThree()

  // Keyboard controls
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    handbrake: false,
  })

  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "w") setKeys((prev) => ({ ...prev, forward: true }))
      if (e.key === "ArrowDown" || e.key === "s") setKeys((prev) => ({ ...prev, backward: true }))
      if (e.key === "ArrowLeft" || e.key === "a") setKeys((prev) => ({ ...prev, left: true }))
      if (e.key === "ArrowRight" || e.key === "d") setKeys((prev) => ({ ...prev, right: true }))
      if (e.key === " ") setKeys((prev) => ({ ...prev, brake: true }))
      if (e.key === "Shift") setKeys((prev) => ({ ...prev, handbrake: true }))
    }

    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp" || e.key === "w") setKeys((prev) => ({ ...prev, forward: false }))
      if (e.key === "ArrowDown" || e.key === "s") setKeys((prev) => ({ ...prev, backward: false }))
      if (e.key === "ArrowLeft" || e.key === "a") setKeys((prev) => ({ ...prev, left: false }))
      if (e.key === "ArrowRight" || e.key === "d") setKeys((prev) => ({ ...prev, right: false }))
      if (e.key === " ") setKeys((prev) => ({ ...prev, brake: false }))
      if (e.key === "Shift") setKeys((prev) => ({ ...prev, handbrake: false }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Main game loop
  useFrame((state, delta) => {
    // Limit delta to prevent physics issues on slow devices
    const clampedDelta = Math.min(delta, 0.1)

    // Combine keyboard and joystick inputs
    const forward = keys.forward || joystickControls.throttle > 0.2
    const backward = keys.backward || joystickControls.throttle < -0.2
    const left = keys.left || joystickControls.steering < -0.2
    const right = keys.right || joystickControls.steering > 0.2
    const brake = keys.brake
    const handbrake = keys.handbrake || (Math.abs(joystickControls.steering) > 0.7 && Math.abs(speed) > 10)

    // Get steering intensity from joystick if available
    const steeringIntensity = left
      ? joystickControls.steering < 0
        ? -joystickControls.steering
        : 1
      : right
        ? joystickControls.steering > 0
          ? joystickControls.steering
          : 1
        : 0

    // Update wheel visual rotation
    setWheelRotation(steeringIntensity * 0.5)

    // Handle acceleration and braking
    const maxSpeed = 40
    const acceleration = 20
    const deceleration = 15
    const brakeStrength = 40

    // Auto-acceleration (always moving forward a bit)
    if (Math.abs(speed) < 5 && !backward && !brake) {
      setSpeed((prev) => prev + clampedDelta * 5)
    }

    // Manual acceleration/braking
    if (forward) {
      setSpeed((prev) => Math.min(maxSpeed, prev + clampedDelta * acceleration))
    } else if (backward) {
      if (speed > 1) {
        // Braking when moving forward
        setSpeed((prev) => Math.max(0, prev - clampedDelta * brakeStrength))
      } else {
        // Reverse when stopped or already going backward
        setSpeed((prev) => Math.max(-maxSpeed / 2, prev - (clampedDelta * acceleration) / 2))
      }
    } else if (brake) {
      // Hard braking
      setSpeed((prev) => {
        if (prev > 0) return Math.max(0, prev - clampedDelta * brakeStrength)
        if (prev < 0) return Math.min(0, prev + clampedDelta * brakeStrength)
        return 0
      })
    } else {
      // Natural deceleration
      setSpeed((prev) => {
        if (prev > 0) return Math.max(0, prev - clampedDelta * deceleration)
        if (prev < 0) return Math.min(0, prev + clampedDelta * deceleration)
        return 0
      })
    }

    // Handle steering and drifting
    const turnSpeed = 1.5 * clampedDelta * (1 + Math.abs(speed) / 20)

    // Determine if we should be drifting
    const shouldDrift = handbrake && Math.abs(speed) > 15 && (left || right)

    // Update drift factor
    if (shouldDrift) {
      setDriftFactor((prev) => Math.min(1, prev + clampedDelta * 3))
      setIsDrifting(true)
    } else {
      setDriftFactor((prev) => Math.max(0, prev - clampedDelta * 2))
      if (driftFactor < 0.1) setIsDrifting(false)
    }

    // Calculate steering angle
    let steeringAngle = 0
    if (left) steeringAngle = turnSpeed * steeringIntensity
    if (right) steeringAngle = -turnSpeed * steeringIntensity

    // Apply steering to direction vector
    const newDirection = direction.clone()

    // When drifting, separate the visual rotation from the movement direction
    if (driftFactor > 0.1) {
      // Visual rotation changes faster than movement direction during drift
      const visualRotation = rotation.clone()
      visualRotation.y += steeringAngle * (1 + driftFactor)
      setRotation(visualRotation)

      // Movement direction changes more slowly during drift
      const driftSteeringFactor = 0.2 + (1 - driftFactor) * 0.8
      newDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), steeringAngle * driftSteeringFactor)
    } else {
      // Normal steering - visual and movement direction are the same
      const newRotation = rotation.clone()
      newRotation.y += steeringAngle
      setRotation(newRotation)
      newDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), steeringAngle)
    }

    setDirection(newDirection.normalize())

    // Calculate new position
    const movement = newDirection.clone().multiplyScalar(speed * clampedDelta)
    const newPosition = position.clone().add(movement)

    // Simple collision detection with track boundaries
    const distanceFromCenter = Math.sqrt(newPosition.x * newPosition.x + newPosition.z * newPosition.z)
    if (distanceFromCenter > 85) {
      // Hit outer boundary - bounce back and reduce speed
      const bounceDirection = new THREE.Vector3(newPosition.x, 0, newPosition.z).normalize()
      newPosition.sub(bounceDirection.multiplyScalar(5))
      setSpeed((prev) => prev * 0.5)
    } else if (distanceFromCenter < 35) {
      // Hit inner boundary - bounce back and reduce speed
      const bounceDirection = new THREE.Vector3(newPosition.x, 0, newPosition.z).normalize()
      newPosition.add(bounceDirection.multiplyScalar(5))
      setSpeed((prev) => prev * 0.5)
    }

    setPosition(newPosition)

    // Update car visual position and rotation
    if (carVisualRef.current) {
      // Smooth position transition
      carVisualRef.current.position.lerp(newPosition, 0.1)

      // Smooth rotation transition
      const targetQuaternion = new THREE.Quaternion().setFromEuler(rotation)
      carVisualRef.current.quaternion.slerp(targetQuaternion, 0.1)

      // Add tilt effect during turns
      const tiltAmount = steeringIntensity * 0.1 * (speed / maxSpeed)
      carVisualRef.current.rotation.z = -tiltAmount

      // Add bounce effect
      const bounceAmount = Math.sin(state.clock.elapsedTime * 10) * 0.02 * (Math.abs(speed) / maxSpeed)
      carVisualRef.current.position.y = newPosition.y + bounceAmount
    }

    // Update drift trails
    if (isDrifting && Math.abs(speed) > 15) {
      // Calculate wheel positions in world space
      const carDir = new THREE.Vector3(0, 0, 1).applyEuler(rotation)
      const carRight = new THREE.Vector3(1, 0, 0).applyEuler(rotation)

      const leftWheelPos = position
        .clone()
        .add(carRight.clone().multiplyScalar(-0.9))
        .add(new THREE.Vector3(0, 0.1, 0))
      const rightWheelPos = position
        .clone()
        .add(carRight.clone().multiplyScalar(0.9))
        .add(new THREE.Vector3(0, 0.1, 0))

      // Update left trail
      if (leftTrailRef.current) {
        for (let i = trailPositions.length - 1; i > 0; i--) {
          trailPositions[i].copy(trailPositions[i - 1])
        }
        trailPositions[0].copy(leftWheelPos)

        if (leftTrailRef.current.geometry) {
          leftTrailRef.current.geometry.setFromPoints(trailPositions)
          leftTrailRef.current.geometry.attributes.position.needsUpdate = true
        }
      }

      // Update right trail
      if (rightTrailRef.current) {
        for (let i = trailPositions.length - 1; i > 0; i--) {
          trailPositions[i].copy(trailPositions[i - 1])
        }
        trailPositions[0].copy(rightWheelPos)

        if (rightTrailRef.current.geometry) {
          rightTrailRef.current.geometry.setFromPoints(trailPositions)
          rightTrailRef.current.geometry.attributes.position.needsUpdate = true
        }
      }
    }

    // Camera follow with smooth transitions
    const cameraDistance = 10 + Math.abs(speed) * 0.1
    const cameraHeight = 4 + Math.abs(speed) * 0.05

    // Add drift offset to camera
    const driftOffset = driftFactor * (left ? -4 : right ? 4 : 0)

    // Calculate camera target position
    const backVector = direction.clone().multiplyScalar(-cameraDistance)
    const cameraTargetPosition = new THREE.Vector3(
      position.x + backVector.x + driftOffset * Math.cos(rotation.y + Math.PI / 2),
      position.y + cameraHeight,
      position.z + backVector.z + driftOffset * Math.sin(rotation.y + Math.PI / 2),
    )

    // Smooth camera movement
    camera.position.lerp(cameraTargetPosition, 0.05)

    // Look at car with slight offset for better view
    const lookTarget = position.clone().add(new THREE.Vector3(0, 1, 0))
    camera.lookAt(lookTarget)

    // Check for collectibles
    for (let i = 0; i < 20; i++) {
      if (!collectedPoints[i]) {
        const angle = (i / 20) * Math.PI * 2
        const radius = 60
        const pointX = Math.cos(angle) * radius
        const pointZ = Math.sin(angle) * radius

        // Distance check
        const distance = Math.sqrt(Math.pow(position.x - pointX, 2) + Math.pow(position.z - pointZ, 2))

        if (distance < 5) {
          // Collect point
          const newCollected = [...collectedPoints]
          newCollected[i] = true
          setCollectedPoints(newCollected)
          setScore((prev) => prev + 100)

          // Boost speed slightly when collecting a point
          setSpeed((prev) => Math.min(maxSpeed, prev + 5))
        }
      }
    }
  })

  return (
    <>
      {/* Car visual representation */}
      <group ref={carVisualRef} position={[position.x, position.y, position.z]}>
        {/* Car body */}
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[2, 0.7, 4]} />
          <meshStandardMaterial color="#ff00ff" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Car cabin */}
        <mesh castShadow position={[0, 0.9, -0.5]}>
          <boxGeometry args={[1.8, 0.5, 2]} />
          <meshStandardMaterial color="#00ffff" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Windshield */}
        <mesh castShadow position={[0, 0.9, 0.8]} rotation={[Math.PI / 8, 0, 0]}>
          <boxGeometry args={[1.7, 0.1, 1.2]} />
          <meshStandardMaterial color="#AADDFF" transparent opacity={0.6} />
        </mesh>

        {/* Front wheels with steering */}
        <mesh castShadow position={[0.9, 0, 1.5]} rotation={[0, wheelRotation, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh castShadow position={[-0.9, 0, 1.5]} rotation={[0, wheelRotation, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Rear wheels */}
        <mesh castShadow position={[0.9, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh castShadow position={[-0.9, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Headlights */}
        <mesh castShadow position={[0.6, 0.3, 2]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1} />
        </mesh>
        <mesh castShadow position={[-0.6, 0.3, 2]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1} />
        </mesh>

        {/* Taillights */}
        <mesh castShadow position={[0.6, 0.3, -2]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1} />
        </mesh>
        <mesh castShadow position={[-0.6, 0.3, -2]}>
          <boxGeometry args={[0.5, 0.3, 0.1]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1} />
        </mesh>

        {/* Neon underglow */}
        <pointLight position={[0, -0.2, 0]} color="#ff00ff" intensity={5} distance={3} />
      </group>

      {/* Drift trails */}
      <lineSegments ref={leftTrailRef}>
        <bufferGeometry attach="geometry" />
        <lineBasicMaterial attach="material" color="#ff00ff" linewidth={3} />
      </lineSegments>

      <lineSegments ref={rightTrailRef}>
        <bufferGeometry attach="geometry" />
        <lineBasicMaterial attach="material" color="#ff00ff" linewidth={3} />
      </lineSegments>
    </>
  )
}

// Simple Track Environment
function CyberpunkTrack() {
  return (
    <>
      {/* Road Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[40, 80, 64]} />
        <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Road Markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[59.5, 60.5, 64]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
      </mesh>

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>

      {/* Collectible items with pulsating effect */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2
        const radius = 60
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <group key={`collectible-${i}`} position={[x, 1.5, z]}>
            <mesh castShadow>
              <torusGeometry args={[1, 0.3, 8, 16]} />
              <meshStandardMaterial
                color="#ff00ff"
                emissive="#ff00ff"
                emissiveIntensity={1}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <pointLight color="#ff00ff" intensity={1} distance={5} />

            {/* Collectible pulse effect */}
            <PulsingRing />
          </group>
        )
      })}

      {/* Neon Lights around the track */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const innerRadius = 35
        const outerRadius = 85

        return (
          <group key={`light-${i}`}>
            <mesh position={[Math.cos(angle) * innerRadius, 0.5, Math.sin(angle) * innerRadius]}>
              <boxGeometry args={[0.5, 1, 0.5]} />
              <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
            </mesh>
            <pointLight
              position={[Math.cos(angle) * innerRadius, 1.5, Math.sin(angle) * innerRadius]}
              color="#00ffff"
              intensity={1}
              distance={10}
            />

            <mesh position={[Math.cos(angle) * outerRadius, 0.5, Math.sin(angle) * outerRadius]}>
              <boxGeometry args={[0.5, 1, 0.5]} />
              <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1} />
            </mesh>
            <pointLight
              position={[Math.cos(angle) * outerRadius, 1.5, Math.sin(angle) * outerRadius]}
              color="#ff00ff"
              intensity={1}
              distance={10}
            />
          </group>
        )
      })}

      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[300, 32, 32]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
      </mesh>
    </>
  )
}

// Pulsing ring effect for collectibles
function PulsingRing() {
  const ringRef = useRef(null)

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.2 + 0.8
      ringRef.current.scale.set(pulse, pulse, pulse)

      // Also pulse opacity
      if (ringRef.current.material) {
        ringRef.current.material.opacity = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7
      }
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 0, 0]}>
      <torusGeometry args={[1.5, 0.1, 8, 24]} />
      <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" />
      <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} transparent opacity={0.7} />
    </mesh>
  )
}

// Main Game Scene
function GameScene({ score, setScore, joystickControls }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Using the new arcade car implementation instead of physics-based car */}
      <ArcadeCar setScore={setScore} joystickControls={joystickControls} />
      <CyberpunkTrack />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={1.5} levels={5} />
        <ChromaticAberration
          offset={[0.002, 0.002]}
          radialModulation={true}
          modulationOffset={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>

      <Environment preset="night" />
    </>
  )
}

// Main Game Component
const CyberpunkDriftingGame = () => {
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [joystickControls, setJoystickControls] = useState({ steering: 0, throttle: 0 })

  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-pink-500 mb-8 animate-pulse">CYBERPUNK DRIFTER</h1>
        <div className="text-cyan-500 text-xl mb-8 max-w-md text-center">
          Race through the neon-lit streets of Night City. Collect all the glowing rings to maximize your score!
        </div>
        <div className="text-yellow-300 text-lg mb-8 max-w-md text-center">
          Your car automatically moves forward. Use the controls to drift around corners and collect all rings!
        </div>
        <button
          onClick={() => setGameStarted(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all hover:scale-105 animate-bounce"
        >
          START GAME
        </button>
        <div className="mt-8 text-gray-400 text-center">
          <p className="mb-2 text-cyan-400">CONTROLS:</p>
          <p>←→ or A/D: Steer</p>
          <p>↑↓ or W/S: Boost/Brake</p>
          <p>SPACE: Brake</p>
          <p>SHIFT: Handbrake (for drifting)</p>
          <p className="text-pink-400 mt-2">Or use the virtual joystick at the bottom left</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        shadows
        camera={{ position: [0, 10, 20], fov: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          <GameScene score={score} setScore={setScore} joystickControls={joystickControls} />
        </Suspense>
      </Canvas>

      {/* Add the virtual joystick */}
      <VirtualJoystick setControls={setJoystickControls} />

      {/* HUD Elements */}
      <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center">
        <div className="text-cyan-500 font-mono text-xl md:text-3xl font-bold tracking-wider">CYBERPUNK DRIFTER</div>
        <div className="text-pink-500 font-mono text-xl md:text-3xl">SCORE: {score}</div>
      </div>

      {/* Points collected display */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-cyan-500 font-mono text-xl md:text-2xl font-bold">
          {Math.abs(score > 0 ? score / 100 : 0)} / 20 POINTS COLLECTED
        </div>
      </div>

      <div className="fixed bottom-4 left-4 text-white font-mono bg-black/50 p-2 rounded">
        <div className="text-pink-500 mb-1">CONTROLS:</div>
        <div className="text-cyan-500">←→ or A/D: Steer</div>
        <div className="text-cyan-500">↑↓ or W/S: Boost/Brake</div>
        <div className="text-cyan-500">SPACE: Brake</div>
        <div className="text-cyan-500">SHIFT: Handbrake (for drifting)</div>
        <div className="text-pink-400">Or use the joystick</div>
      </div>

      {/* Game tips that appear and fade */}
      <GameTips />
    </div>
  )
}

function GameTips() {
  const [currentTip, setCurrentTip] = useState(0)
  const [visible, setVisible] = useState(true)

  const tips = [
    "Try using SHIFT while turning for epic drifts!",
    "The car automatically drives forward - focus on steering!",
    "Collect all 20 glowing rings to complete the track!",
    "Hold SPACE to brake before tight turns!",
  ]

  useEffect(() => {
    // Change tip every 5 seconds
    const tipInterval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length)
        setVisible(true)
      }, 500)
    }, 5000)

    return () => clearInterval(tipInterval)
  }, [tips.length])

  return (
    <div
      className={`fixed bottom-4 right-4 bg-black/70 text-yellow-300 p-3 rounded max-w-xs transition-opacity duration-500 ${visible ? "opacity-80" : "opacity-0"}`}
    >
      <div className="text-pink-500 font-bold mb-1">TIP:</div>
      <div>{tips[currentTip]}</div>
    </div>
  )
}

export default CyberpunkDriftingGame

