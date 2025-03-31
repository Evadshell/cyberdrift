/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture, Environment, CameraShake } from '@react-three/drei';
import { Physics, useSphere, useBox, useCylinder, usePlane } from '@react-three/cannon';
import * as THREE from 'three';

export default function Home() {
  const [gameState, setGameState] = useState('ready'); // 'ready', 'aiming', 'shooting', 'scored', 'saved', 'missed'
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [round, setRound] = useState(1);
  const [aimX, setAimX] = useState(0);
  const [aimY, setAimY] = useState(5);
  const [power, setPower] = useState(50); // Shot power 0-100
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [showPowerBar, setShowPowerBar] = useState(false);
  const [cameraView, setCameraView] = useState('player'); // 'player', 'side', 'goal', 'ball'
  const [showTutorial, setShowTutorial] = useState(true);
  
  // Power bar animation
  const [powerDirection, setPowerDirection] = useState(1);
  const powerBarRef = useRef(null);
  
  useEffect(() => {
    if (showPowerBar) {
      const interval = setInterval(() => {
        setPower(prev => {
          // Reverse direction at limits
          if (prev >= 100) setPowerDirection(-1);
          if (prev <= 0) setPowerDirection(1);
          return prev + powerDirection * 2;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [showPowerBar, powerDirection]);

  const handleMouseMove = (e) => {
    if (gameState === 'aiming') {
      // Calculate aim based on mouse position - constrained to realistic angles
      const x = (e.clientX / window.innerWidth) * 10 - 5; // -5 to 5 range
      const y = Math.max(2, 8 - (e.clientY / window.innerHeight) * 5); // 2 to 8 range
      setAimX(x);
      setAimY(y);
    }
  };

  const startAiming = () => {
    if (gameState === 'ready') {
      setGameState('aiming');
      setShowPowerBar(true);
    }
  };

  const shoot = () => {
    if (gameState === 'aiming') {
      setGameState('shooting');
      setShowPowerBar(false);
      setShots(prev => prev + 1);
      
      // After shot completed
      setTimeout(() => {
        if (round >= 5) {
          // End of penalty shootout round
          setRound(1);
          setGameState('gameOver');
        } else {
          setRound(prev => prev + 1);
          setGameState('ready');
        }
      }, 3500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setShots(0);
    setRound(1);
    setGameState('ready');
  };

  const viewPositions = {
    player: [0, 1.7, 15],
    side: [15, 5, 5],
    goal: [0, 2.5, -8],
    ball: [0, 0.3, 14]
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: 'linear-gradient(to bottom, #1e3c72, #2a5298)' }}
         onMouseMove={handleMouseMove}>
      <Canvas shadows>
        <CameraShake 
          intensity={gameState === 'shooting' ? 0.5 : 0} 
          decay={false} 
          decayRate={0.65} 
          maxYaw={0.05} 
          maxPitch={0.05} 
          maxRoll={0.05} 
          yawFrequency={0.8} 
          pitchFrequency={0.8} 
          rollFrequency={0.8} 
        />
        <PerspectiveCamera 
          makeDefault 
          position={viewPositions[cameraView]} 
          fov={cameraView === 'ball' ? 80 : 50} 
        />
        <fog attach="fog" args={['#b8c6db', 30, 90]} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 5]} intensity={1} castShadow shadow-mapSize={2048} />
        
        <Physics 
          gravity={[0, -9.81, 0]}
          defaultContactMaterial={{ restitution: 0.4 }}
        >
          <Stadium />
          <Football
            gameState={gameState}
            aimX={aimX}
            aimY={aimY}
            power={power}
            setGameState={setGameState}
            setScore={setScore}
            cameraView={cameraView}
          />
          <Goal />
          <Goalkeeper 
            gameState={gameState} 
            difficulty={aiDifficulty}
            aimX={aimX}
          />
          <Crowd />
        </Physics>
        
        {cameraView !== 'goal' && (
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            enableRotate={gameState === 'ready'} 
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={Math.PI / 6}
          />
        )}
      </Canvas>
      
      {/* UI Elements */}
      <div className="gameUI" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Scoreboard */}
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          color: 'white', 
          background: 'rgba(0,0,0,0.7)', 
          padding: '10px 20px', 
          borderRadius: '5px',
          fontFamily: 'Arial',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
            Score: {score} / {shots}
          </div>
          <div style={{ fontSize: '18px', marginTop: '5px' }}>
            Round: {round}/5
          </div>
        </div>
        
        {/* Camera Controls */}
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          display: 'flex', 
          gap: '10px',
          pointerEvents: 'all'
        }}>
          {['player', 'side', 'goal', 'ball'].map(view => (
            <button 
              key={view}
              style={{ 
                padding: '5px 10px', 
                background: cameraView === view ? '#3498db' : '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setCameraView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Aim indicator */}
        {gameState === 'aiming' && (
          <div style={{
            position: 'absolute',
            left: `${50 + (aimX / 10 * 30)}%`,
            top: `${50 - (aimY / 10 * 30)}%`,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'rgba(255, 0, 0, 0.7)',
            transform: 'translate(-50%, -50%)'
          }} />
        )}
        
        {/* Power bar */}
        {showPowerBar && (
          <div 
            ref={powerBarRef}
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '20px',
              background: '#333',
              borderRadius: '10px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${power}%`,
                background: `linear-gradient(90deg, green, yellow ${power > 70 ? '70%' : '100%'}, ${power > 70 ? 'red' : 'yellow'})`,
                transition: 'width 0.05s'
              }}
            />
          </div>
        )}
        
        {/* Game state message */}
        {gameState !== 'ready' && gameState !== 'aiming' && gameState !== 'shooting' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.7)'
          }}>
            {gameState === 'scored' && "GOAL!"}
            {gameState === 'saved' && "SAVED!"}
            {gameState === 'missed' && "MISSED!"}
            {gameState === 'gameOver' && "GAME OVER"}
          </div>
        )}
        
        {/* Tutorial */}
        {showTutorial && (
          <div style={{
            position: 'absolute',
            bottom: '150px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '500px',
            textAlign: 'center',
            pointerEvents: 'all'
          }}>
            <h3 style={{ margin: '0 0 10px' }}>How to Play</h3>
            <p>1. Click Aim & Shoot to begin aiming</p>
            <p>2. Move your mouse to aim the ball</p>
            <p>3. Click again to set power and shoot</p>
            <button 
              style={{ 
                padding: '5px 15px', 
                background: '#3498db', 
                border: 'none', 
                borderRadius: '4px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
              onClick={() => setShowTutorial(false)}
            >
              Got it!
            </button>
          </div>
        )}
      </div>
      
      {/* Game controls */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
        {gameState === 'ready' && (
          <button
            style={{ 
              padding: '12px 24px', 
              fontSize: '18px', 
              background: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onClick={startAiming}
          >
            Aim & Shoot
          </button>
        )}
        
        {gameState === 'aiming' && (
          <button
            style={{ 
              padding: '12px 24px', 
              fontSize: '18px', 
              background: '#2ecc71', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onClick={shoot}
          >
            Shoot! ({Math.round(power)}%)
          </button>
        )}
        
        {gameState === 'gameOver' && (
          <button
            style={{ 
              padding: '12px 24px', 
              fontSize: '18px', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
            onClick={resetGame}
          >
            Play Again
          </button>
        )}
        
        {/* Difficulty selector */}
        <div style={{ 
          marginTop: '10px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px' 
        }}>
          {['easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              style={{ 
                padding: '5px 10px', 
                background: aiDifficulty === level ? '#9b59b6' : '#7f8c8d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setAiDifficulty(level)}
              disabled={gameState !== 'ready'}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stadium
function Stadium() {
  // Ground
  const [fieldRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    material: { friction: 0.3 }
  }));
  
  return (
    <group>
      {/* Field */}
      <mesh ref={fieldRef} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2ecc71">
          <StadiumTexture />
        </meshStandardMaterial>
      </mesh>
      
      {/* Stadium background */}
      <mesh position={[0, 15, -40]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[50, 50, 30, 32, 1, true, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#7f8c8d" side={THREE.BackSide} />
      </mesh>
      
      {/* Penalty spot */}
      <mesh position={[0, 0.01, 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Penalty area */}
      <PenaltyArea />
    </group>
  );
}

// Stadium Texture
function StadiumTexture() {
  return (
    <meshStandardMaterial color="#2ecc71" roughness={0.8}>
      {/* This would ideally be a repeating pattern texture */}
    </meshStandardMaterial>
  );
}

// Penalty Area
function PenaltyArea() {
  return (
    <group>
      {/* Penalty box */}
      <mesh position={[0, 0.01, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 16.5/2, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="white" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Box lines */}
      <mesh position={[0, 0.01, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16.5, 11]} />
        <meshBasicMaterial color="white" wireframe={true} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Football
function Football({ 
  gameState, 
  aimX, 
  aimY, 
  power, 
  setGameState, 
  setScore, 
  cameraView 
}: { 
  gameState: string; 
  aimX: number; 
  aimY: number; 
  power: number; 
  setGameState: React.Dispatch<React.SetStateAction<string>>; 
  setScore: React.Dispatch<React.SetStateAction<number>>; 
  cameraView: string; 
}) {
  const [ballRef, api] = useSphere(() => ({
    mass: 0.43,
    position: [0, 0.22, 11],
    args: [0.22],
    linearDamping: 0.5,
    material: { restitution: 0.8, friction: 0.5 }
  }));
  
  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0.22, 11]);
  const ballTexture = useRef(createFootballTexture());
  const rotationSpeed = useRef(new THREE.Vector3(0, 0, 0));
  
  // Subscribe to physics updates
  useEffect(() => {
    const unsubPosition = api.position.subscribe(v => position.current = v);
    const unsubVelocity = api.velocity.subscribe(v => velocity.current = v);
    
    return () => {
      unsubPosition();
      unsubVelocity();
    };
  }, [api]);
  
  // Reset ball position when returning to ready state
  useEffect(() => {
    if (gameState === 'ready') {
      api.position.set(0, 0.22, 11);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }
  }, [gameState, api]);
  
  // Kick the ball when shooting
  useEffect(() => {
    if (gameState === 'shooting') {
      // Apply force to ball with direction and power
      const powerFactor = power / 50; // Convert to 0-2 range
      const kickForce = 20 * powerFactor;
      
      // Calculate angle and velocity
      const angleY = Math.PI / 6 + (aimY / 10) * (Math.PI / 6); // Elevation angle
      const angleX = (aimX / 5) * (Math.PI / 8); // Horizontal angle
      
      // Convert angles to direction vector
      const dirX = Math.sin(angleX) * kickForce;
      const dirY = Math.sin(angleY) * kickForce;
      const dirZ = -Math.cos(angleX) * Math.cos(angleY) * kickForce;
      
      // Apply impulse for the kick
      api.velocity.set(0, 0, 0); // Reset velocity first
      api.applyImpulse([dirX, dirY, dirZ], [0, 0, 0]);
      
      // Apply spin based on aim
      const spinX = -aimX * 5;
      const spinY = Math.random() * 10 - 5;
      api.angularVelocity.set(spinX, spinY, 0);
    }
  }, [gameState, api, aimX, aimY, power]);
  
  // Check for goal or miss
  useFrame(() => {
    const [x, y, z] = position.current;
    
    // Only check the goal state when the ball is moving and near the goal
    if (gameState === 'shooting') {
      // Goal detection
      if (z < 0 && z > -3 && y < 2.44 && y > 0 && Math.abs(x) < 3.66) {
        setGameState('scored');
        setScore(prev => prev + 1);
      }
      // Miss detection - out of bounds or stopped
      else if ((z < -5 || Math.abs(x) > 20 || Math.abs(velocity.current[0]) + 
              Math.abs(velocity.current[1]) + Math.abs(velocity.current[2]) < 0.1) &&
              gameState === 'shooting') {
        if (z > 0 && Math.abs(velocity.current[2]) < 0.1) {
          setGameState('saved');
        } else {
          setGameState('missed');
        }
      }
    }
    
    // Ball rotation based on velocity
    if (ballRef.current) {
      const speed = Math.sqrt(
        velocity.current[0]**2 + 
        velocity.current[1]**2 + 
        velocity.current[2]**2
      );
      
      // Calculate rotation axis perpendicular to velocity
      if (speed > 0.1) {
        const axis = new THREE.Vector3(
          -velocity.current[1], 
          velocity.current[0], 
          0
        ).normalize();
        
        // Apply rotation
        ballRef.current.rotateOnAxis(axis, speed * 0.2);
      }
    }
  });
  
  return (
    <mesh ref={ballRef} castShadow>
      <sphereGeometry args={[0.22, 32, 32]} />
      <meshStandardMaterial 
        map={ballTexture.current}
        roughness={0.4} 
        metalness={0.1}
        bumpScale={0.002}
      />
    </mesh>
  );
}

// Goal with realistic posts, crossbar, and net
function Goal() {
  const [crossbarRef] = useBox(() => ({
    args: [7.32, 0.08, 0.08],
    position: [0, 2.44, 0],
    type: 'Static',
    material: { restitution: 0.7 }
  }));
  
  const [leftPostRef] = useBox(() => ({
    args: [0.08, 2.44, 0.08],
    position: [-3.66, 1.22, 0],
    type: 'Static',
    material: { restitution: 0.7 }
  }));
  
  const [rightPostRef] = useBox(() => ({
    args: [0.08, 2.44, 0.08],
    position: [3.66, 1.22, 0],
    type: 'Static',
    material: { restitution: 0.7 }
  }));
  
  // Back bar to hold net
  const [backBarRef] = useBox(() => ({
    args: [7.32, 0.05, 0.05],
    position: [0, 0, -2],
    type: 'Static'
  }));
  
  // Top back bar
  const [topBackBarRef] = useBox(() => ({
    args: [7.32, 0.05, 0.05],
    position: [0, 2.44, -2],
    type: 'Static'
  }));
  
  // Left back post
  const [leftBackPostRef] = useBox(() => ({
    args: [0.05, 2.44, 0.05],
    position: [-3.66, 1.22, -2],
    type: 'Static'
  }));
  
  // Right back post
  const [rightBackPostRef] = useBox(() => ({
    args: [0.05, 2.44, 0.05],
    position: [3.66, 1.22, -2],
    type: 'Static'
  }));
  
  return (
    <group>
      {/* Posts and crossbar */}
      <mesh ref={crossbarRef} castShadow receiveShadow>
        <boxGeometry args={[7.32, 0.08, 0.08]} />
        <meshStandardMaterial color="white" metalness={0.3} roughness={0.2} />
      </mesh>
      
      <mesh ref={leftPostRef} castShadow receiveShadow>
        <boxGeometry args={[0.08, 2.44, 0.08]} />
        <meshStandardMaterial color="white" metalness={0.3} roughness={0.2} />
      </mesh>
      
      <mesh ref={rightPostRef} castShadow receiveShadow>
        <boxGeometry args={[0.08, 2.44, 0.08]} />
        <meshStandardMaterial color="white" metalness={0.3} roughness={0.2} />
      </mesh>
      
      {/* Back frame for net */}
      <mesh ref={backBarRef} castShadow>
        <boxGeometry args={[7.32, 0.05, 0.05]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>
      
      <mesh ref={topBackBarRef} castShadow>
        <boxGeometry args={[7.32, 0.05, 0.05]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>
      
      <mesh ref={leftBackPostRef} castShadow>
        <boxGeometry args={[0.05, 2.44, 0.05]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>
      
      <mesh ref={rightBackPostRef} castShadow>
        <boxGeometry args={[0.05, 2.44, 0.05]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>
      
      {/* Net - sides */}
      <Net />
    </group>
  );
}

// Goal Net using multiple planes with transparency
function Net() {
  // Create net material
  const netMaterial = new THREE.MeshStandardMaterial({
    color: 'white',
    opacity: 0.4,
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: true
  });
  
  const netConfig = {
    width: 7.32,
    height: 2.44,
    depth: 2,
    segmentsW: 15,
    segmentsH: 8,
    segmentsD: 4
  };
  
  return (
    <group>
      {/* Top */}
      <mesh position={[0, 2.44, -1]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[7.32, 2, netConfig.segmentsW, netConfig.segmentsD]} />
        <primitive object={netMaterial} />
      </mesh>
      
      {/* Bottom */}
      <mesh position={[0, 0, -1]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[7.32, 2, netConfig.segmentsW, netConfig.segmentsD]} />
        <primitive object={netMaterial} />
      </mesh>
      
      {/* Left side */}
      <mesh position={[-3.66, 1.22, -1]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[2, 2.44, netConfig.segmentsD, netConfig.segmentsH]} />
        <primitive object={netMaterial} />
      </mesh>
      
      {/* Right side */}
      <mesh position={[3.66, 1.22, -1]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[2, 2.44, netConfig.segmentsD, netConfig.segmentsH]} />
        <primitive object={netMaterial} />
      </mesh>
      
      {/* Back */}
      <mesh position={[0, 1.22, -2]}>
        <planeGeometry args={[7.32, 2.44, netConfig.segmentsW, netConfig.segmentsH]} />
        <primitive object={netMaterial} />
      </mesh>
    </group>
  );
}

// Goalkeeper with realistic movement
function Goalkeeper({ gameState, difficulty, aimX }: { gameState: string; difficulty: string; aimX: number }) {
  const [bodyRef, bodyApi] = useBox(() => ({
    mass: 0,
    args: [0.7, 1.8, 0.4],
    position: [0, 0.9, 0.3],
    type: 'Kinematic',
  }));
  
  const [leftArmRef, leftArmApi] = useBox(() => ({
    mass: 0,
    args: [0.2, 0.7, 0.2],
    position: [-0.7, 1.2, 0.3],
    type: 'Kinematic',
  }));
  
  const [rightArmRef, rightArmApi] = useBox(() => ({
    mass: 0,
    args: [0.2, 0.7, 0.2],
    position: [0.7, 1.2, 0.3],
    type: 'Kinematic',
  }));
  
  const [leftLegRef, leftLegApi] = useBox(() => ({
    mass: 0,
    args: [0.25, 0.9, 0.25],
    position: [-0.3, 0.45, 0.3],
    type: 'Kinematic',
  }));
  
  const [rightLegRef, rightLegApi] = useBox(() => ({
    mass: 0,
    args: [0.25, 0.9, 0.25],
    position: [0.3, 0.45, 0.3],
    type: 'Kinematic',
  }));
  
  // Difficulty settings
  const difficultySettings = {
    easy: { speed: 0.5, prediction: 0.3, range: 0.6 },
    medium: { speed: 0.8, prediction: 0.5, range: 0.8 },
    hard: { speed: 1.2, prediction: 0.8, range: 1.0 }
  };
  
  // Goalkeeper state
  const currentPos = useRef(0);
  const targetPos = useRef(0);
  const diving = useRef(false);
  const diveDirection = useRef<[number, number, number]>([0, 0, 0]);
  const diveAnimation = useRef(0);
  
  useFrame(() => {
    if (gameState === 'ready') {
      const time = Date.now() * 0.001;
      const idle = Math.sin(time * 0.5) * 0.5;
      bodyApi.position.set(idle, 0.9, 0.3);
      leftArmApi.position.set(-0.7 + idle*0.2, 1.2, 0.3);
      rightArmApi.position.set(0.7 - idle*0.2, 1.2, 0.3);
      leftLegApi.position.set(-0.3, 0.45, 0.3);
      rightLegApi.position.set(0.3, 0.45, 0.3);
      diving.current = false;
      diveAnimation.current = 0;
    } 
    else if (gameState === 'aiming') {
      // Tracking movement based on difficulty
      const settings = difficultySettings[difficulty];
      
      // Calculate target position based on player's aim and goalkeeper prediction
      // More difficult levels will better predict where the player is aiming
      const maxOffset = 3 * settings.range; // Maximum movement range
      const prediction = aimX * settings.prediction; // Predict player's aim
      // Add randomness to prediction
      const randomness = (Math.random() - 0.5) * (1 - settings.prediction);
      targetPos.current = prediction + randomness;
      
      // Clamp to valid range
      targetPos.current = Math.max(-maxOffset, Math.min(maxOffset, targetPos.current));
      
      // Move gradually towards target position
      const delta = targetPos.current - currentPos.current;
      currentPos.current += delta * 0.02 * settings.speed;
      
      // Update goalkeeper position
      bodyApi.position.set(currentPos.current, 0.9, 0.3);
      leftArmApi.position.set(currentPos.current - 0.7, 1.2, 0.3);
      rightArmApi.position.set(currentPos.current + 0.7, 1.2, 0.3);
      leftLegApi.position.set(currentPos.current - 0.3, 0.45, 0.3);
      rightLegApi.position.set(currentPos.current + 0.3, 0.45, 0.3);
    } 
    else if (gameState === 'shooting' && !diving.current) {
      // Initiate a dive when shot is taken
      const settings = difficultySettings[difficulty];
      
      // Determine dive direction based on aim and difficulty
      // Hard keepers have better prediction and will dive in the correct direction more often
      const diveTargetX = aimX * settings.prediction + (Math.random() - 0.5) * 5 * (1 - settings.prediction);
      diveDirection.current = [Math.sign(diveTargetX) * 3.3, 0, 0];
      
      // Randomly decide to dive low, middle, or high
      const diveHeight = Math.random();
      if (diveHeight < 0.4) {
        // Low dive
        diveDirection.current = [Math.sign(diveTargetX) * 3.3, 0.3, 0.3];
      } else if (diveHeight < 0.8) {
        // Middle dive
        diveDirection.current = [diveDirection.current[0], 0.9, 0.3];
      } else {
        // High dive
        diveDirection.current = [Math.sign(diveTargetX) * 3.3, 1.5, 0.3];
      }
      
      diving.current = true;
    } 
    else if (diving.current) {
      // Execute diving animation
      diveAnimation.current += 0.05;
      const progress = Math.min(1, diveAnimation.current);
      
      // Dive motion with easing
      const easeOutQuad = t => t * (2 - t);
      const animProgress = easeOutQuad(progress);
      
      // Calculate dive positions
      const diveX = currentPos.current + (diveDirection.current[0] - currentPos.current) * animProgress;
      const diveY = 0.9 + (diveDirection.current[1] - 0.9) * animProgress;
      const diveZ = 0.3 + (diveDirection.current[2] - 0.3) * animProgress;
      
      // Apply dive positions
      bodyApi.position.set(diveX, diveY, diveZ);
      
      // Rotate body during dive
      const rotation: [number, number, number] = [0, 0, Math.sign(diveDirection.current[0]) * Math.PI/4 * animProgress];
      bodyApi.rotation.set(...rotation);
      
      // Stretch arms during dive
      const armX = Math.sign(diveDirection.current[0]) * (0.3 + 1.2 * animProgress);
      const armY = 0.3 + 0.9 * animProgress;
      const armAngle = Math.sign(diveDirection.current[0] || 0) * Math.PI / 3 * animProgress;
      
      leftArmApi.position.set(diveX - armX, diveY + 0.3, diveZ);
      rightArmApi.position.set(diveX + armX, diveY + 0.3, diveZ);
      
      leftArmApi.rotation.set(0, 0, armAngle);
      rightArmApi.rotation.set(0, 0, -armAngle);
      
      // Move legs during dive
      leftLegApi.position.set(diveX - 0.3 - animProgress * 0.3, diveY - 0.5, diveZ);
      rightLegApi.position.set(diveX + 0.3 + animProgress * 0.3, diveY - 0.5, diveZ);
      
      if (Math.sign(diveDirection.current[0]) > 0) {
        leftLegApi.rotation.set(0, 0, Math.PI/6 * animProgress);
        rightLegApi.rotation.set(0, 0, Math.PI/3 * animProgress);
      } else {
        leftLegApi.rotation.set(0, 0, -Math.PI/3 * animProgress);
        rightLegApi.rotation.set(0, 0, -Math.PI/6 * animProgress);
      }
    }
  });
  
  return (
    <group>
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.4]} />
        <meshStandardMaterial color="#e74c3c" />
        
        {/* Head */}
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#f1c40f" />
          
          {/* Eyes */}
          <mesh position={[0.08, 0.05, 0.2]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
          
          <mesh position={[-0.08, 0.05, 0.2]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
        </mesh>
        
     
      </mesh>
      
      {/* Arms */}
      <mesh ref={leftArmRef} castShadow>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#f39c12" />
      </mesh>
      
      <mesh ref={rightArmRef} castShadow>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#f39c12" />
      </mesh>
      
      {/* Legs */}
      <mesh ref={leftLegRef} castShadow>
        <boxGeometry args={[0.25, 0.9, 0.25]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      
      <mesh ref={rightLegRef} castShadow>
        <boxGeometry args={[0.25, 0.9, 0.25]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
}

// Crowd in the stands
function Crowd() {
  return (
    <group position={[0, 3, -30]}>
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 50;
        const z = -10 - Math.random() * 20;
        const y = 10 + Math.random() * 10;
        const scale = 0.5 + Math.random() * 0.5;
        
        return (
          <group key={i} position={[x, y, z]} scale={[scale, scale, scale]}>
            <mesh>
              <boxGeometry args={[0.5, 0.8, 0.3]} />
              <meshStandardMaterial color={`hsl(${Math.random() * 360}, 70%, 50%)`} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial color={`hsl(${Math.random() * 60 + 20}, 70%, 70%)`} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Football Texture
function createFootballTexture() {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get 2D context');
    return null;
  }

  // Base color
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw pentagons
  const pentagon = (x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
  };
  
  // Draw hexagons
  const hexagon = (x, y, size) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  
  // Draw pattern
  const patternSize = 60;
  for (let i = 0; i < 5; i++) {
    pentagon(256, 256, patternSize);
    pentagon(128, 128, patternSize * 0.7);
    pentagon(384, 128, patternSize * 0.7);
    pentagon(128, 384, patternSize * 0.7);
    pentagon(384, 384, patternSize * 0.7);
    
    hexagon(256, 150, patternSize * 0.6);
    hexagon(256, 362, patternSize * 0.6);
    hexagon(150, 256, patternSize * 0.6);
    hexagon(362, 256, patternSize * 0.6);
  }
  
  // Add manufacturer logo (simulated)
  ctx.fillStyle = '#3498db';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PRO BALL', 256, 40);
  
  // Create texture from canvas
  return new THREE.CanvasTexture(canvas);
}