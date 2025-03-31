import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function Car() {
  const gltf = useLoader(GLTFLoader, "/models/cyberpunk_car.gltf"); // Put your car file in public/models/
  const carRef = useRef<THREE.Group>(null!);

  // Simple hover animation
  useFrame((state) => {
    if (carRef.current) {
      carRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1 + 1; // Hover effect
    }
  });

  return <primitive ref={carRef} object={gltf.scene} scale={0.5} position={[0, 1, 0]} />;
}