'use client';

import { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';

// Preload the model for better performance
useGLTF.preload('/models/phone_17_pro_max.glb');

// Phone component with 3D model
function PhoneModel({ rotationSpeed = 0.01, floatSpeed = 0.5, scale = 6 }) {
  const phoneRef = useRef();
  const groupRef = useRef();

  // Load the phone GLB model
  const model = useGLTF('/models/phone_17_pro_max.glb');

  // Floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed) * 0.3;
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  // Use the loaded model
  return (
    <group ref={groupRef}>
      <primitive 
        object={model.scene} 
        ref={phoneRef} 
        scale={scale}
        position={[0, 0, 0]}
      />
    </group>
  );
}

// Loading fallback
function PhoneLoader() {
  return (
    <mesh>
      <boxGeometry args={[0.4, 0.8, 0.05]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
  );
}

export default function Phone3D({ className = '', autoRotate = true, floatSpeed = 0.5, isMobile = false }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Adjust scale and settings for mobile
  const phoneScale = isSmallScreen || isMobile ? 7 : 6;
  const cameraFov = isSmallScreen || isMobile ? 45 : 45;
  const cameraZ = isSmallScreen || isMobile ? 2 : 3;
  const antialias = !isSmallScreen && !isMobile; // Disable antialiasing on mobile for performance

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: cameraFov }}
        gl={{ 
          antialias: antialias, 
          alpha: true,
          powerPreference: isSmallScreen || isMobile ? "low-power" : "high-performance"
        }}
        dpr={isSmallScreen || isMobile ? [1, 1.5] : [1, 2]} // Lower pixel ratio on mobile
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<PhoneLoader />}>
          {/* Lighting - reduced on mobile for performance */}
          <ambientLight intensity={isSmallScreen || isMobile ? 0.7 : 0.6} />
          <directionalLight position={[5, 5, 5]} intensity={isSmallScreen || isMobile ? 1 : 1.2} />
          <directionalLight position={[-5, -5, -5]} intensity={isSmallScreen || isMobile ? 0.5 : 0.6} />
          <pointLight position={[0, 0, 5]} intensity={isSmallScreen || isMobile ? 0.8 : 1} color="#FF6B35" />
          {!isSmallScreen && !isMobile && (
            <spotLight position={[3, 3, 3]} angle={0.3} penumbra={1} intensity={0.8} color="#FF8555" />
          )}

          {/* Environment for reflections - simpler on mobile */}
          {isSmallScreen || isMobile ? (
            <Environment preset="sunset" />
          ) : (
            <Environment preset="city" />
          )}

          {/* Phone model */}
          <PhoneModel 
            rotationSpeed={autoRotate ? 0.01 : 0} 
            floatSpeed={floatSpeed}
            scale={phoneScale}
          />

          {/* Controls - disabled for auto-rotation, but can be enabled for interaction */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={isSmallScreen || isMobile ? 0.8 : 1}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

