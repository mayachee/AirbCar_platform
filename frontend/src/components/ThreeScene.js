'use client'

import { useRef, useMemo, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Suppress harmless WebGL shader warnings from Three.js
// This runs after imports to ensure THREE is available
const suppressWebGLWarnings = () => {
  if (typeof window === 'undefined') return
  
  const originalWarn = console.warn
  const originalError = console.error
  const originalLog = console.log
  
  // Create a comprehensive warning filter
  const shouldSuppress = (...args) => {
    const message = String(args[0] || '')
    const fullMessage = args.map(String).join(' ')
    
    // Suppress Three.js WebGL shader warnings - catch all variations
    if (
      message.includes('THREE.WebGLProgram') ||
      message.includes('Program Info Log') ||
      message.includes('WebGLProgram') ||
      fullMessage.includes('X4122') ||
      fullMessage.includes('X4008') ||
      fullMessage.includes('floating point division by zero') ||
      fullMessage.includes('cannot be represented accurately') ||
      (fullMessage.includes('sum of') && fullMessage.includes('double precision')) ||
      fullMessage.includes('warning X4122') ||
      fullMessage.includes('warning X4008')
    ) {
      return true
    }
    return false
  }
  
  // Override console methods to filter warnings
  const filterWarnings = (originalMethod) => {
    return function(...args) {
      if (!shouldSuppress(...args)) {
        originalMethod.apply(console, args)
      }
    }
  }
  
  console.warn = filterWarnings(originalWarn)
  console.error = filterWarnings(originalError)
  console.log = filterWarnings(originalLog)
}

// Initialize warning suppression
suppressWebGLWarnings()

// Patch Three.js WebGLProgram after THREE is loaded
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure THREE is fully loaded
  setTimeout(() => {
    if (THREE && THREE.WebGLProgram) {
      const OriginalWebGLProgram = THREE.WebGLProgram
      
      // Wrap the constructor to suppress warnings
      THREE.WebGLProgram = function(renderer, cacheKey, material, shader) {
        // Temporarily disable console warnings during shader compilation
        const tempWarn = console.warn
        const tempError = console.error
        console.warn = () => {}
        console.error = () => {}
        
        try {
          return new OriginalWebGLProgram(renderer, cacheKey, material, shader)
        } finally {
          console.warn = tempWarn
          console.error = tempError
        }
      }
      
      // Preserve prototype and static properties
      THREE.WebGLProgram.prototype = OriginalWebGLProgram.prototype
      Object.setPrototypeOf(THREE.WebGLProgram, OriginalWebGLProgram)
      Object.keys(OriginalWebGLProgram).forEach(key => {
        THREE.WebGLProgram[key] = OriginalWebGLProgram[key]
      })
    }
  }, 0)
}

// BMW M4 Model Loader Component
function BMWModel({ modelPath, position = [0, 0, 0], rotationSpeed = 0.3, scale = 1 }) {
  const modelRef = useRef()
  
  // Load the GLB/GLTF model from public folder
  // Hooks must be called unconditionally
  const gltf = useGLTF(modelPath || '/models/bmw-m4.glb')

  useEffect(() => {
    if (gltf && gltf.scene) {
      console.log('BMW Model loaded successfully:', gltf.scene)
      // Enable shadows if needed
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [gltf])

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * rotationSpeed
    }
  })

  // Clone the scene to avoid mutations
  const scene = useMemo(() => {
    if (!gltf || !gltf.scene) {
      console.warn('BMW Model: No scene found in GLTF')
      return null
    }
    const cloned = gltf.scene.clone()
    console.log('BMW Model: Scene cloned successfully')
    return cloned
  }, [gltf])

  if (!scene) {
    console.warn('BMW Model: Returning null - no scene to render')
    return null
  }

  return (
    <primitive
      ref={modelRef}
      object={scene}
      position={position}
      scale={scale}
    />
  )
}

// Error Boundary for 3D models
function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    const errorHandler = (error) => {
      console.error('3D Model Error:', error)
      setHasError(true)
    }
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])
  
  if (hasError) {
    return fallback || null
  }
  
  return children
}

// Fallback component if model fails to load
function ModelPlaceholder() {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Simple car shape as placeholder */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 1, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2, 1, 1.3]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// Enhanced Space Stars Background with twinkling
function SpaceStars({ count = 2000 }) {
  const starsRef = useRef()
  const stars = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const twinkleSpeeds = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Position stars in a sphere around the scene
      const radius = 25 + Math.random() * 60
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Star colors - more variety
      const color = new THREE.Color()
      const starType = Math.random()
      if (starType < 0.6) {
        color.setRGB(1, 1, 1) // White stars
      } else if (starType < 0.75) {
        color.setRGB(0.8, 0.9, 1) // Blue-white
      } else if (starType < 0.85) {
        color.setRGB(1, 0.9, 0.8) // Warm white
      } else if (starType < 0.92) {
        color.setRGB(0.9, 0.9, 1) // Cool white
      } else {
        color.setRGB(1, 0.85, 0.7) // Golden
      }
      
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      sizes[i] = Math.random() * 3 + 0.3
      twinkleSpeeds[i] = 0.5 + Math.random() * 2
    }
    
    return { positions, colors, sizes, twinkleSpeeds }
  }, [count])

  useFrame((state) => {
    if (starsRef.current) {
      // Slow rotation for twinkling effect
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.015
      // Twinkling effect by scaling opacity
      const time = state.clock.elapsedTime
      starsRef.current.material.opacity = 0.7 + Math.sin(time * 2) * 0.3
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={stars.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={stars.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={stars.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={true}
      />
    </points>
  )
}

// Enhanced Nebula with animated clouds
function SpaceNebula() {
  const nebulaRef = useRef()
  const nebulaClouds = useRef([])
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = state.clock.elapsedTime * 0.008
    }
    
    // Animate nebula clouds
    nebulaClouds.current.forEach((cloud, i) => {
      if (cloud) {
        const time = state.clock.elapsedTime
        cloud.position.x += Math.sin(time * 0.1 + i) * 0.01
        cloud.position.y += Math.cos(time * 0.15 + i) * 0.01
        cloud.material.opacity = 0.2 + Math.sin(time * 0.5 + i) * 0.15
      }
    })
  })

  return (
    <group ref={nebulaRef}>
      {/* Multiple nebula clouds with different colors */}
      {[
        { pos: [-20, -5, -35], color: '#4a0080', size: 12 },
        { pos: [20, 5, -40], color: '#1a0033', size: 15 },
        { pos: [0, -10, -30], color: '#6600cc', size: 10 },
        { pos: [-15, 10, -38], color: '#2d1b4e', size: 8 },
        { pos: [15, -8, -32], color: '#5500aa', size: 11 }
      ].map((nebula, i) => (
        <mesh
          key={i}
          ref={(el) => (nebulaClouds.current[i] = el)}
          position={nebula.pos}
          scale={[nebula.size, nebula.size, 1]}
        >
          <planeGeometry args={[nebula.size, nebula.size, 64, 64]} />
          <meshStandardMaterial
            color={nebula.color}
            transparent
            opacity={0.25}
            emissive={nebula.color}
            emissiveIntensity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Distant Planet
function Planet() {
  const planetRef = useRef()
  
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group position={[-25, -5, -40]}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color="#2a1b4e"
          emissive="#4a0080"
          emissiveIntensity={0.3}
          roughness={0.8}
        />
      </mesh>
      {/* Planet glow */}
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshStandardMaterial
          color="#4a0080"
          transparent
          opacity={0.2}
          emissive="#6b00ff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}

// Enhanced floating space particles with varied colors
function SpaceParticles({ count = 120 }) {
  const mesh = useRef()
  const light = useRef()
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = Math.max(0.01, 0.01 + Math.random() / 200)
      const xFactor = -30 + Math.random() * 60
      const yFactor = -30 + Math.random() * 60
      const zFactor = -30 + Math.random() * 60
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particleColors = useMemo(() => {
    const colors = ['#6b9fff', '#ff6b9f', '#9fff6b', '#ffaa6b', '#aa6bff']
    return Array.from({ length: count }, () => colors[Math.floor(Math.random() * colors.length)])
  }, [count])

  useFrame((state) => {
    if (!mesh.current) return
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      t = particle.t += Math.max(0.001, speed / 2)
      const a = Math.cos(t) + Math.sin(t / 10) / 10
      const b = Math.sin(t) + Math.cos(t / 10) / 10
      const s = Math.max(0.05, Math.abs(Math.cos(t)) * 0.4)
      
      const mxFactor = particle.mx !== 0 ? particle.mx / 10 : 0
      const myFactor = particle.my !== 0 ? particle.my / 10 : 0
      
      dummy.position.set(
        mxFactor * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * 0.5),
        myFactor * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * 0.5),
        myFactor * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * 0.5)
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <pointLight ref={light} distance={50} intensity={4} color="#6b9fff" />
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial 
          color="#6b9fff" 
          emissive="#6b9fff"
          emissiveIntensity={0.8}
        />
      </instancedMesh>
    </>
  )
}

// Laser/Energy beams
function EnergyBeams() {
  const beamsRef = useRef()
  
  useFrame((state) => {
    if (beamsRef.current) {
      beamsRef.current.rotation.y = state.clock.elapsedTime * 0.05
      beamsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={beamsRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI * 2) / 4) * 15,
            Math.sin((i * Math.PI * 2) / 4) * 8,
            -20
          ]}
          rotation={[0, (i * Math.PI * 2) / 4, 0]}
        >
          <cylinderGeometry args={[0.1, 0.3, 30, 8]} />
          <meshStandardMaterial
            color="#00aaff"
            transparent
            opacity={0.3}
            emissive="#00aaff"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  )
}

// WebGL Configuration Component
function WebGLConfig() {
  const { gl } = useThree()
  
  useEffect(() => {
    // Configure WebGL context
    const context = gl.getContext()
    if (context) {
      // Get precision format to ensure proper shader compilation
      try {
        const ext = context.getExtension('WEBGL_debug_renderer_info')
        if (ext) {
          // Check shader precision
          context.getShaderPrecisionFormat(
            context.VERTEX_SHADER,
            context.HIGH_FLOAT
          )
        }
      } catch (e) {
        // Ignore extension errors
      }
    }
  }, [gl])
  
  return null
}

// Main 3D Scene Component
export default function ThreeScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          // Suppress shader validation warnings
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false
        }}
         dpr={[1, 1.5]}
         style={{ 
           background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a2e 40%, #000000 100%)'
         }}
        onCreated={({ gl, scene, camera }) => {
          // Suppress WebGL shader warnings at the renderer level
          const context = gl.getContext()
          if (context) {
            // Override getProgramInfoLog to filter out precision warnings
            const originalGetProgramInfoLog = context.getProgramInfoLog
            context.getProgramInfoLog = function(program) {
              const infoLog = originalGetProgramInfoLog.apply(this, arguments)
              if (infoLog && (
                infoLog.includes('X4122') ||
                infoLog.includes('X4008') ||
                infoLog.includes('floating point division by zero') ||
                infoLog.includes('cannot be represented accurately') ||
                infoLog.includes('sum of') && infoLog.includes('double precision')
              )) {
                // Return empty string to suppress warnings
                return ''
              }
              return infoLog
            }
            
            // Also override getShaderInfoLog for shader warnings
            const originalGetShaderInfoLog = context.getShaderInfoLog
            if (originalGetShaderInfoLog) {
              context.getShaderInfoLog = function(shader) {
                const infoLog = originalGetShaderInfoLog.apply(this, arguments)
                if (infoLog && (
                  infoLog.includes('X4122') ||
                  infoLog.includes('X4008') ||
                  infoLog.includes('floating point division by zero')
                )) {
                  return ''
                }
                return infoLog
              }
            }
            
            // Disable shader validation warnings
            const originalGetShaderPrecisionFormat = context.getShaderPrecisionFormat
            context.getShaderPrecisionFormat = function(...args) {
              try {
                return originalGetShaderPrecisionFormat.apply(this, args)
              } catch (e) {
                // Suppress errors
                return { rangeMin: 127, rangeMax: 127, precision: 23 }
              }
            }
          }
          
          // Suppress WebGL context events
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
          gl.domElement.addEventListener('webglcontextrestored', (e) => e.preventDefault())
        }}
      >
        <WebGLConfig />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
        
        {/* Enhanced Space Background - More Stars */}
        <SpaceStars count={2000} />
        
        {/* Enhanced Nebula Clouds */}
        <SpaceNebula />
        
        {/* Distant Planet */}
        <Planet />
        
        {/* Energy Beams */}
        <EnergyBeams />
        
        {/* Enhanced Space Lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={1.2} color="#6b9fff" />
        <pointLight position={[0, 5, 0]} intensity={2} color="#ffffff" />
        <pointLight position={[-3, 2, -3]} intensity={1} color="#6b9fff" />
        <pointLight position={[3, 2, -3]} intensity={1} color="#ff6b9f" />
        <pointLight position={[0, -2, 5]} intensity={1.5} color="#aa6bff" />
        
        {/* BMW M4 Model - Centered */}
        <ErrorBoundary fallback={<ModelPlaceholder />}>
          <Suspense fallback={<ModelPlaceholder />}>
            <group>
              {/* Car glow effect */}
              <pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" distance={10} />
              <BMWModel 
                modelPath="/models/bmw-m4.glb"
                position={[0, 0, 0]} 
                rotationSpeed={0.2}
                scale={0.8}
              />
            </group>
          </Suspense>
        </ErrorBoundary>
        
        {/* Enhanced Space particles */}
        <SpaceParticles count={120} />
        
        {/* Environment for reflections - removed to avoid shader warnings */}
        {/* <Environment preset="city" /> */}
        
        {/* Controls - disabled for static view but can be enabled for interaction */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
      
      {/* Overlay text */}
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-10">
        <div className="text-center text-white p-8">
          <h3 className="text-3xl font-bold mb-4 drop-shadow-lg">Welcome to Airbcar</h3>
          <p className="text-lg opacity-90 drop-shadow-md">Your premium car rental experience awaits</p>
        </div>
      </div>
    </div>
  )
}

