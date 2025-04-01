/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { Environment } from "@react-three/drei"
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import { GameAudio } from "./game-audio"

// Virtual Joystick Component
function VirtualJoystick({ setControls }: { setControls: (controls: { steering: number; throttle: number }) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 })
  const joystickRef = useRef<HTMLDivElement>(null)
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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

  interface MouseEventPosition {
    x: number
    y: number
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging) {
      setPosition({ x: e.clientX, y: e.clientY } as MouseEventPosition)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setPosition({ x: basePosition.x, y: basePosition.y })
  }

  // Also handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickRef.current && e.touches.length > 0) {
      const rect = joystickRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setBasePosition({ x: centerX, y: centerY })
      setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
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
      className="fixed bottom-20 left-8 w-32 h-32 bg-black bg-opacity-50 rounded-full border-2 border-cyan-500"
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

// Drift smoke particle system
function DriftSmoke({
  position,
  isActive,
  direction,
}: {
  position: { x: number; y: number; z: number }
  isActive: boolean
  direction: { x: number; y: number; z: number }
}) {
  const particles = useRef<THREE.Points>(null)
  const count = 100
  const [positions, setPositions] = useState(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
    }
    return positions
  })

  const [sizes, setSizes] = useState(() => {
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      sizes[i] = 0
    }
    return sizes
  })

  const [opacities, setOpacities] = useState(() => {
    const opacities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      opacities[i] = 0
    }
    return opacities
  })

  const [lifetimes, setLifetimes] = useState(() => {
    const lifetimes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      lifetimes[i] = 0
    }
    return lifetimes
  })

  const [velocities, setVelocities] = useState(() => {
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
    }
    return velocities
  })

  // Update particles
  useFrame((state, delta) => {
    if (!particles.current) return

    const positionsArray = positions.slice()
    const sizesArray = sizes.slice()
    const opacitiesArray = opacities.slice()
    const lifetimesArray = lifetimes.slice()
    const velocitiesArray = velocities.slice()

    // Spawn new particles when active
    if (isActive) {
      for (let i = 0; i < 5; i++) {
        // Find a dead particle to respawn
        for (let j = 0; j < count; j++) {
          if (lifetimesArray[j] <= 0) {
            // Spawn at wheel position with random offset
            const offset = Math.random() * 0.3 - 0.15
            positionsArray[j * 3] = position.x + offset
            positionsArray[j * 3 + 1] = 0.1 + Math.random() * 0.2
            positionsArray[j * 3 + 2] = position.z + offset

            // Random size
            sizesArray[j] = 0.5 + Math.random() * 1.5

            // Full opacity
            opacitiesArray[j] = 0.7 + Math.random() * 0.3

            // Random lifetime
            lifetimesArray[j] = 0.5 + Math.random() * 1.5

            // Velocity based on car direction with randomness
            const dirX = direction.x * (0.5 + Math.random() * 0.5)
            const dirZ = direction.z * (0.5 + Math.random() * 0.5)
            velocitiesArray[j * 3] = dirX + (Math.random() * 0.4 - 0.2)
            velocitiesArray[j * 3 + 1] = 0.5 + Math.random() * 1
            velocitiesArray[j * 3 + 2] = dirZ + (Math.random() * 0.4 - 0.2)

            break
          }
        }
      }
    }

    // Update all particles
    for (let i = 0; i < count; i++) {
      if (lifetimesArray[i] > 0) {
        // Update position based on velocity
        positionsArray[i * 3] += velocitiesArray[i * 3] * delta
        positionsArray[i * 3 + 1] += velocitiesArray[i * 3 + 1] * delta
        positionsArray[i * 3 + 2] += velocitiesArray[i * 3 + 2] * delta

        // Slow down velocity
        velocitiesArray[i * 3] *= 0.95
        velocitiesArray[i * 3 + 1] *= 0.95
        velocitiesArray[i * 3 + 2] *= 0.95

        // Grow size
        sizesArray[i] += delta * 2

        // Fade out
        opacitiesArray[i] -= delta * 0.5
        if (opacitiesArray[i] < 0) opacitiesArray[i] = 0

        // Decrease lifetime
        lifetimesArray[i] -= delta
      }
    }

    // Update buffers
    setPositions(positionsArray)
    setSizes(sizesArray)
    setOpacities(opacitiesArray)
    setLifetimes(lifetimesArray)
    setVelocities(velocitiesArray)

    // Update geometry
    particles.current.geometry.attributes.position.array.set(positionsArray)
    particles.current.geometry.attributes.position.needsUpdate = true
    particles.current.geometry.attributes.size.array.set(sizesArray)
    particles.current.geometry.attributes.size.needsUpdate = true
    particles.current.geometry.attributes.opacity.array.set(opacitiesArray)
    particles.current.geometry.attributes.opacity.needsUpdate = true
  })

  // Define shader code as strings
  const vertexShader = `
    attribute float size;
    attribute float opacity;
    varying float vOpacity;
    
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying float vOpacity;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
      gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    }
  `

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{}}
      />
    </points>
  )
}

// Neon drift trail effect
function NeonTrail({ positions, isActive, color }: { positions: THREE.Vector3[]; isActive: boolean; color: string }) {
  // Explicitly type the ref as THREE.Line

  const trailRef = useRef<THREE.Line>(null) // Removed | null since useRef defaults to null
  const maxPoints = 50
  const [points, setPoints] = useState<THREE.Vector3[]>(() => {
    return Array(maxPoints)
      .fill(new THREE.Vector3(0, 0.1, 0))
      .map(() => new THREE.Vector3(0, 0.1, 0))
  })

  useFrame(() => {
    if (!trailRef.current || !isActive) return

    // Update trail points
    const newPoints = [...points]

    // Shift all points down
    for (let i = newPoints.length - 1; i > 0; i--) {
      newPoints[i].copy(newPoints[i - 1])
    }

    // Add new point at the front
    if (positions && positions.length > 0) {
      newPoints[0].copy(positions[0])
    }

    setPoints(newPoints)

    // Update geometry
    if (trailRef.current.geometry) {
      trailRef.current.geometry.setFromPoints(newPoints)
      trailRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    // @ts-expect-error
    <line ref={trailRef} visible={isActive}>
      <bufferGeometry />
      <lineBasicMaterial color={color} linewidth={3} transparent opacity={0.8} />
    </line>
  )
}
// Improved realistic car implementation with no flipping
function RealisticCar({
  setScore,
  joystickControls,
  onFallOff,
  gameKey,
}: {
  setScore: React.Dispatch<React.SetStateAction<number>>
  joystickControls: { steering: number; throttle: number }
  onFallOff: () => void
  gameKey: number
}) {
  // Visual representation of the car (separate from physics)
  const carVisualRef = useRef<THREE.Group>(null)

  // Car state
  const [position, setPosition] = useState(new THREE.Vector3(0, 0.5, 0))
  const [rotation, setRotation] = useState(new THREE.Euler(0, 0, 0))
  const [speed, setSpeed] = useState(0)
  const [direction, setDirection] = useState(new THREE.Vector3(0, 0, -1))
  const [driftFactor, setDriftFactor] = useState(0)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelSpin, setWheelSpin] = useState(0)
  const [isDrifting, setIsDrifting] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)

  // Previous state for smooth interpolation
  const prevPosition = useRef(new THREE.Vector3(0, 0.5, 0))
  const prevRotation = useRef(new THREE.Euler(0, 0, 0))

  // Drift trail positions
  const [leftWheelPos, setLeftWheelPos] = useState(new THREE.Vector3(0, 0.1, 0))
  const [rightWheelPos, setRightWheelPos] = useState(new THREE.Vector3(0, 0.1, 0))
  const [driftDirection, setDriftDirection] = useState(new THREE.Vector3(0, 0, 0))

  // Collectibles state
  const [collectedPoints, setCollectedPoints] = useState(Array(20).fill(false))

  // Camera control
  const { camera } = useThree()
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0))

  // Keyboard controls
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    handbrake: false,
  })

  // Reset car state when game key changes (for restart)
  useEffect(() => {
    setPosition(new THREE.Vector3(0, 0.5, 0))
    setRotation(new THREE.Euler(0, 0, 0))
    setSpeed(0)
    setDirection(new THREE.Vector3(0, 0, -1))
    setDriftFactor(0)
    setWheelRotation(0)
    setWheelSpin(0)
    setIsDrifting(false)
    prevPosition.current.set(0, 0.5, 0)
    prevRotation.current.set(0, 0, 0)
    setCollectedPoints(Array(20).fill(false))

    // Reset camera
    if (camera) {
      camera.position.set(0, 10, 20)
      camera.lookAt(0, 0, 0)
    }
    if (cameraTargetRef.current) {
      cameraTargetRef.current.set(0, 0, 0)
    }
    if (cameraLookAtRef.current) {
      cameraLookAtRef.current.set(0, 0, 0)
    }
  }, [gameKey, camera])

  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") setKeys((prev) => ({ ...prev, forward: true }))
      if (e.key === "ArrowDown" || e.key === "s") setKeys((prev) => ({ ...prev, backward: true }))
      if (e.key === "ArrowLeft" || e.key === "a") setKeys((prev) => ({ ...prev, left: true }))
      if (e.key === "ArrowRight" || e.key === "d") setKeys((prev) => ({ ...prev, right: true }))
      if (e.key === " ") setKeys((prev) => ({ ...prev, brake: true }))
      if (e.key === "Shift") setKeys((prev) => ({ ...prev, handbrake: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
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
    // Store previous position and rotation for interpolation
    prevPosition.current.copy(position)
    prevRotation.current.copy(rotation)

    // Limit delta to prevent physics issues on slow devices
    const clampedDelta = Math.min(delta, 0.05)

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

    // Update wheel spin based on speed
    setWheelSpin((prev) => prev + speed * clampedDelta * 0.5)

    // Handle acceleration and braking - more realistic physics
    const maxSpeed = 35 // Slightly reduced for better control
    const acceleration = 15 // Reduced for more realistic acceleration
    const deceleration = 10
    const brakeStrength = 30

    // Auto-acceleration (always moving forward a bit)
    if (Math.abs(speed) < 5 && !backward && !brake) {
      setSpeed((prev) => prev + clampedDelta * 3) // Reduced auto-acceleration
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

    // Handle steering and drifting - more realistic
    // Steering is less responsive at high speeds for realism
    const speedFactor = 1 - Math.min(0.6, (Math.abs(speed) / maxSpeed) * 0.6)
    const turnSpeed = 1.2 * clampedDelta * speedFactor * (1 + Math.abs(speed) / 20)

    // Determine if we should be drifting
    const shouldDrift = handbrake && Math.abs(speed) > 15 && (left || right)

    // Update drift factor with smoother transitions
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

    // Store drift direction for smoke particles
    setDriftDirection(newDirection.clone().negate())

    // Calculate new position
    const movement = newDirection.clone().multiplyScalar(speed * clampedDelta)
    const newPosition = position.clone().add(movement)

    // Check if car has fallen off the disc
    const distanceFromCenter = Math.sqrt(newPosition.x * newPosition.x + newPosition.z * newPosition.z)
    if (distanceFromCenter > 100) {
      // Broader track with clear edge
      // Car has fallen off - trigger game over
      onFallOff()
      return
    }

    // Ensure car stays upright - prevent flipping by locking rotation on X and Z axes
    newPosition.y = 0.5 // Lock Y position to prevent sinking or flying
    setPosition(newPosition)

    // Update car visual position and rotation with smooth interpolation
    if (carVisualRef.current) {
      // CRITICAL FIX: Force the car to stay upright by explicitly setting rotation
      // This prevents any possibility of flipping
      carVisualRef.current.rotation.x = 0
      carVisualRef.current.rotation.z = 0

      // Smooth position transition - interpolate between previous and current position
      const lerpFactor = Math.min(1, 15 * clampedDelta) // Adjust for smoother movement
      const visualPosition = new THREE.Vector3().lerpVectors(prevPosition.current, newPosition, lerpFactor)
      carVisualRef.current.position.copy(visualPosition)

      // Smooth rotation transition with quaternions for better interpolation
      // Only allow rotation around Y axis to prevent flipping
      const prevQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, prevRotation.current.y, 0))
      const targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation.y, 0))
      const slerpFactor = Math.min(1, 10 * clampedDelta) // Adjust for smoother rotation
      carVisualRef.current.quaternion.slerpQuaternions(prevQuaternion, targetQuaternion, slerpFactor)

      // Add tilt effect during turns - smoother and limited to prevent extreme tilting
      const tiltAmount = Math.min(0.1, steeringIntensity * 0.08 * (speed / maxSpeed))
      carVisualRef.current.rotation.z = -tiltAmount

      // Add subtle bounce effect - smoother and less extreme
      const bounceAmount = Math.sin(state.clock.elapsedTime * 8) * 0.01 * (Math.abs(speed) / maxSpeed)
      carVisualRef.current.position.y = newPosition.y + bounceAmount
    }

    // Update wheel positions for drift effects
    const carDir = new THREE.Vector3(0, 0, 1).applyEuler(rotation)
    const carRight = new THREE.Vector3(1, 0, 0).applyEuler(rotation)

    const leftWheel = position
      .clone()
      .add(carRight.clone().multiplyScalar(-0.9))
      .add(new THREE.Vector3(0, 0.1, 0))

    const rightWheel = position
      .clone()
      .add(carRight.clone().multiplyScalar(0.9))
      .add(new THREE.Vector3(0, 0.1, 0))

    setLeftWheelPos(leftWheel)
    setRightWheelPos(rightWheel)

    // Camera follow with improved smooth transitions
    const cameraDistance = 10 + Math.abs(speed) * 0.1
    const cameraHeight = 4 + Math.abs(speed) * 0.05

    // Add drift offset to camera
    const driftOffset = driftFactor * (left ? -4 : right ? 4 : 0)

    // Calculate camera target position
    const backVector = direction.clone().multiplyScalar(-cameraDistance)
    const targetCameraPosition = new THREE.Vector3(
      position.x + backVector.x + driftOffset * Math.cos(rotation.y + Math.PI / 2),
      position.y + cameraHeight,
      position.z + backVector.z + driftOffset * Math.sin(rotation.y + Math.PI / 2),
    )

    // Smooth camera movement with better damping
    cameraTargetRef.current.lerp(targetCameraPosition, Math.min(1, 3 * clampedDelta))
    camera.position.lerp(cameraTargetRef.current, Math.min(1, 5 * clampedDelta))

    // Look at car with slight offset for better view
    const lookTarget = position.clone().add(new THREE.Vector3(0, 1, 0))
    cameraLookAtRef.current.lerp(lookTarget, Math.min(1, 8 * clampedDelta))
    camera.lookAt(cameraLookAtRef.current)

    // Check for collectibles
    for (let i = 0; i < 20; i++) {
      if (!collectedPoints[i]) {
        const angle = (i / 20) * Math.PI * 2
        const radius = 70 // Adjusted for broader track
        const pointX = Math.cos(angle) * radius
        const pointZ = Math.sin(angle) * radius

        // Distance check
        const distance = Math.sqrt(Math.pow(position.x - pointX, 2) + Math.pow(position.z - pointZ, 2))

        if (distance < 5) {
          // Collect point
          const newCollected = [...collectedPoints]
          newCollected[i] = true
          setCollectedPoints(newCollected)
          setScore((prev: number) => prev + 100)

          // Set collecting state for audio
          setIsCollecting(true)
          setTimeout(() => setIsCollecting(false), 300)

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

        {/* Front wheels with steering and rotation */}
        <group position={[0.9, 0, 1.5]} rotation={[0, wheelRotation, 0]}>
          <mesh castShadow rotation={[wheelSpin, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
        <group position={[-0.9, 0, 1.5]} rotation={[0, wheelRotation, 0]}>
          <mesh castShadow rotation={[wheelSpin, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>

        {/* Rear wheels with rotation */}
        <group position={[0.9, 0, -1.5]}>
          <mesh castShadow rotation={[wheelSpin, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
        <group position={[-0.9, 0, -1.5]}>
          <mesh castShadow rotation={[wheelSpin, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>

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

      {/* Drift effects */}
      {/* Left wheel smoke */}
      <DriftSmoke position={leftWheelPos} isActive={isDrifting && Math.abs(speed) > 15} direction={driftDirection} />

      {/* Right wheel smoke */}
      <DriftSmoke position={rightWheelPos} isActive={isDrifting && Math.abs(speed) > 15} direction={driftDirection} />

      {/* Neon trails */}
      <NeonTrail positions={[leftWheelPos]} isActive={isDrifting && Math.abs(speed) > 15} color="#ff00ff" />
      <NeonTrail positions={[rightWheelPos]} isActive={isDrifting && Math.abs(speed) > 15} color="#ff00ff" />
      <GameAudio
        isDrifting={isDrifting}
        speed={speed}
        isGameOver={false}
        isCollecting={isCollecting}
        isGameStarted={true}
      />
    </>
  )
}

// Improved Track Environment with disc shape and edge
function CyberpunkTrack() {
  return (
    <>
      {/* Disc-shaped Road Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[100, 64]} />
        <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Road Markings - Outer edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[98, 100, 64]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Road Markings - Inner circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[69, 71, 64]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
      </mesh>

      {/* Ground Plane (visible below the disc edge) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#050505" roughness={0.9} />
      </mesh>

      {/* Collectible items with pulsating effect */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2
        const radius = 70 // Adjusted for broader track
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
        const innerRadius = 50
        const outerRadius = 95

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

      {/* Edge warning markers */}
      {Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2
        const radius = 99
        return (
          <mesh
            key={`edge-${i}`}
            position={[Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[0.5, 1, 0.5]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
          </mesh>
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

// Improved pulsing ring effect for collectibles
function PulsingRing() {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ringRef.current) {
      // Smoother pulsing with easing
      const time = clock.getElapsedTime()
      const pulse = 0.8 + 0.2 * Math.sin(time * 2)

      ringRef.current.scale.set(pulse, pulse, pulse)

      // Also pulse opacity with smoother transition
      if (ringRef.current.material) {
        if (ringRef.current.material instanceof THREE.Material) {
          ringRef.current.material.opacity = 0.7 + 0.3 * Math.sin(time * 1.5)
        }
      }
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 0, 0]}>
      <torusGeometry args={[1.5, 0.1, 8, 24]} />
      <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} transparent={true} opacity={0.7} />
    </mesh>
  )
}

// Game Over Screen
function GameOverScreen({ score, highScore, onRestart }: { score: number; highScore: number; onRestart: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <h1 className="text-6xl font-bold text-pink-500 mb-8 animate-pulse">GAME OVER</h1>
      <div className="text-cyan-500 text-3xl mb-4">YOUR SCORE: {score}</div>
      <div className="text-yellow-300 text-2xl mb-8">HIGH SCORE: {highScore}</div>
      <button
        onClick={onRestart}
        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all hover:scale-105 animate-bounce"
      >
        PLAY AGAIN
      </button>
    </div>
  )
}

// Main Game Scene
function GameScene({
  score,
  setScore,
  joystickControls,
  onFallOff,
  gameKey,
}: {
  score: number
  setScore: React.Dispatch<React.SetStateAction<number>>
  joystickControls: { steering: number; throttle: number }
  onFallOff: () => void
  gameKey: number
}) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Using the improved realistic car implementation */}
      <RealisticCar setScore={setScore} joystickControls={joystickControls} onFallOff={onFallOff} gameKey={gameKey} />
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
  const [highScore, setHighScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [joystickControls, setJoystickControls] = useState({ steering: 0, throttle: 0 })
  const [gameKey, setGameKey] = useState(0) // Used to force component remount on restart

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("cyberpunkDrifterHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  // Handle game over
  const handleFallOff = () => {
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("cyberpunkDrifterHighScore", score.toString())
    }
    setGameOver(true)
  }

  // Restart game - properly reset all state
  const handleRestart = () => {
    setScore(0)
    setGameOver(false)
    setGameKey((prev) => prev + 1) // Increment key to force remount of game components
  }

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
        <div className="text-red-500 text-lg mb-8 max-w-md text-center font-bold">
          WARNING: Don`t fall off the edge of the track or it`s GAME OVER!
        </div>
        {highScore > 0 && <div className="text-pink-400 text-xl mb-8">HIGH SCORE: {highScore}</div>}
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
        key={gameKey} // Force canvas remount on restart
      >
        <Suspense fallback={null}>
          <GameScene
            score={score}
            setScore={setScore}
            joystickControls={joystickControls}
            onFallOff={handleFallOff}
            gameKey={gameKey}
          />
        </Suspense>
      </Canvas>

      {/* Add the virtual joystick */}
      <VirtualJoystick setControls={setJoystickControls} />

      {/* Improved HUD Elements */}
      <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm">
        <div className="text-cyan-500 font-mono text-xl md:text-3xl font-bold tracking-wider">CYBERPUNK DRIFTER</div>
        <div className="text-pink-500 font-mono text-xl md:text-3xl">SCORE: {score}</div>
      </div>

      {/* Points collected display */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-cyan-500 font-mono text-xl md:text-2xl font-bold bg-black/50 px-4 py-2 rounded-lg">
          {Math.abs(score > 0 ? score / 100 : 0)} / 20 POINTS COLLECTED
        </div>
      </div>

      {/* Compact controls display */}
      <div className="fixed bottom-4 left-4 text-white font-mono bg-black/70 p-2 rounded">
        <div className="text-pink-500 mb-1">CONTROLS:</div>
        <div className="text-cyan-500 text-sm">←→/A/D: Steer | ↑↓/W/S: Boost/Brake</div>
        <div className="text-cyan-500 text-sm">SPACE: Brake | SHIFT: Handbrake</div>
      </div>

      {/* Game tips that appear and fade */}
      <GameTips />
      {gameStarted && (
        <GameAudio
          isDrifting={false}
          speed={0}
          isGameOver={gameOver}
          isCollecting={false}
          isGameStarted={gameStarted}
        />
      )}
      {/* Game Over overlay */}
      {gameOver && <GameOverScreen score={score} highScore={highScore} onRestart={handleRestart} />}
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
    "Don't fall off the edge or it's GAME OVER!",
    "Beat your high score to become the ultimate Cyberpunk Drifter!",
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

