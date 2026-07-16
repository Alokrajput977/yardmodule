import React, { useRef, useLayoutEffect, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sky } from '@react-three/drei';
import * as THREE from 'three';
import './Warehouse.css';

// ----------------------------------------------------------------------
// 1. ADVANCED CAMERA CONTROLLER (Fixes the Zoom & Reset Bug)
// ----------------------------------------------------------------------
const CameraController = ({ viewState }) => {
  const controlsRef = useRef();
  const [isAnimating, setIsAnimating] = useState(false);

  // Whenever the viewState changes (user clicks a box or hits reset), trigger animation
  useEffect(() => {
    setIsAnimating(true);
  }, [viewState.timestamp]);

  useFrame((state, delta) => {
    if (isAnimating && controlsRef.current) {
      // Smoothly fly to the target and camera position
      state.camera.position.lerp(viewState.camPos, delta * 4);
      controlsRef.current.target.lerp(viewState.target, delta * 4);

      // Once the camera gets close enough to the target, STOP animating.
      // This releases the camera so the user can manually zoom out or rotate 360 degrees!
      const distCam = state.camera.position.distanceTo(viewState.camPos);
      const distTarget = controlsRef.current.target.distanceTo(viewState.target);
      
      if (distCam < 0.5 && distTarget < 0.5) {
        setIsAnimating(false);
      }
    }
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault 
      minDistance={2}   // Allow zooming extremely close
      maxDistance={800} // Allow zooming far out
      maxPolarAngle={Math.PI} // Full 360 degree (look at the roof/sky)
      enablePan={true}
      enableZoom={true}
      dampingFactor={0.05}
    />
  );
};

// ----------------------------------------------------------------------
// 2. VEHICLES & ANIMATED MACHINES (No Humans)
// ----------------------------------------------------------------------

const Forklift = ({ position, rotation, isLifting = false }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 4, 0]} castShadow><boxGeometry args={[12, 8, 20]} /><meshStandardMaterial color="#FF9900" metalness={0.6} /></mesh>
    <mesh position={[0, 16, 11]} castShadow><boxGeometry args={[8, 32, 2]} /><meshStandardMaterial color="#222" metalness={0.8} /></mesh>
    <group position={[0, isLifting ? 18 : 2, 13]}>
      <mesh position={[-3, 0, 6]} castShadow><boxGeometry args={[1.5, 0.5, 12]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[3, 0, 6]} castShadow><boxGeometry args={[1.5, 0.5, 12]} /><meshStandardMaterial color="#111" /></mesh>
      {isLifting && <mesh position={[0, 2.5, 6]} castShadow><boxGeometry args={[5, 5, 5]} /><meshStandardMaterial color="#C19A6B" /></mesh>}
    </group>
    <mesh position={[0, 12, -2]} castShadow><boxGeometry args={[10, 8, 10]} /><meshStandardMaterial color="#111" wireframe={true} wireframeLinewidth={3} /></mesh>
    {[-7, 7].map((z, i) => (
      <React.Fragment key={`fl-wheels-${i}`}>
        <mesh position={[-6, 2.5, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[2.5, 2.5, 2, 16]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh position={[6, 2.5, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[2.5, 2.5, 2, 16]} /><meshStandardMaterial color="#050505" /></mesh>
      </React.Fragment>
    ))}
  </group>
);

const AnimatedForklift = ({ startZ, endZ, posX, speed = 1 }) => {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const range = (endZ - startZ) / 2;
    const midPoint = startZ + range;
    
    const currentZ = midPoint + Math.sin(t) * range;
    ref.current.position.z = currentZ;
    
    const direction = Math.cos(t);
    ref.current.rotation.y = direction > 0 ? 0 : Math.PI;
  });

  return (
    <group ref={ref} position={[posX, 0, startZ]}>
      <Forklift position={[0, 0, 0]} rotation={[0, 0, 0]} isLifting={true} />
    </group>
  );
};

const TransportTruck = ({ position, rotation }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 15, -40]} castShadow receiveShadow><boxGeometry args={[26, 30, 80]} /><meshStandardMaterial color="#EAEAEA" roughness={0.4} /></mesh>
    <mesh position={[0, 12, 15]} castShadow><boxGeometry args={[24, 24, 20]} /><meshStandardMaterial color="#1A237E" metalness={0.5} /></mesh>
    {[-70, -50, 5, 20].map((z, i) => (
      <React.Fragment key={`truck-wheels-${i}`}>
        <mesh position={[-13, 4, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[4, 4, 4, 16]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[13, 4, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[4, 4, 4, 16]} /><meshStandardMaterial color="#111" /></mesh>
      </React.Fragment>
    ))}
  </group>
);

// ----------------------------------------------------------------------
// 3. ARCHITECTURE (No Pillars)
// ----------------------------------------------------------------------

const WarehouseArchitecture = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1000, 1000]} /><meshStandardMaterial color="#4A4E53" roughness={0.8} /></mesh>
      <mesh position={[0, 40, 500]} castShadow receiveShadow><boxGeometry args={[1000, 80, 5]} /><meshStandardMaterial color="#6A6E73" /></mesh>
      <mesh position={[0, 40, -500]} castShadow receiveShadow><boxGeometry args={[1000, 80, 5]} /><meshStandardMaterial color="#6A6E73" /></mesh>
      <mesh position={[500, 40, 0]} castShadow receiveShadow><boxGeometry args={[5, 80, 1000]} /><meshStandardMaterial color="#6A6E73" /></mesh>

      <group position={[-500, 0, 0]}>
        {[-300, -150, 0, 150, 300].map((z, i) => (
          <group key={`gate-${i}`} position={[0, 0, z]}>
            <mesh position={[0, 60, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[6, 6, 60, 16]} /><meshStandardMaterial color="#888" metalness={0.8} /></mesh>
            <mesh position={[0, 40, 40]}><boxGeometry args={[5, 80, 20]} /><meshStandardMaterial color="#6A6E73" /></mesh>
            <mesh position={[0, 70, 0]}><boxGeometry args={[5, 20, 60]} /><meshStandardMaterial color="#6A6E73" /></mesh>
          </group>
        ))}
      </group>

      <group position={[0, 80, 0]}>
        {[-400, -200, 0, 200, 400].map((x, i) => (
          <mesh key={`roof-metal-${i}`} position={[x, 0, 0]} castShadow receiveShadow><boxGeometry args={[100, 2, 1000]} /><meshStandardMaterial color="#3A3D40" metalness={0.7} roughness={0.6} /></mesh>
        ))}
        {[-300, -100, 100, 300].map((x, i) => (
          <mesh key={`roof-glass-${i}`} position={[x, 0, 0]}>
            <boxGeometry args={[100, 1, 1000]} />
            <meshStandardMaterial color="#AACCFF" transparent={true} opacity={0.3} roughness={0.1} metalness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ----------------------------------------------------------------------
// 4. INTERACTIVE MULTI-SIZE INVENTORY (Click to Focus)
// ----------------------------------------------------------------------

const MultiSizeInventory = ({ onBoxClick }) => {
  const crateRef = useRef();
  const boxRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useLayoutEffect(() => {
    let crateCount = 0;
    let boxCount = 0;

    const quadrants = [
      { xs: -480, xe: -60, zs: -480, ze: -60 },
      { xs: 60, xe: 480, zs: -480, ze: -60 },
      { xs: -480, xe: -60, zs: 60, ze: 480 },
      { xs: 60, xe: 480, zs: 60, ze: 480 },
    ];

    quadrants.forEach((q) => {
      for (let x = q.xs; x < q.xe; x += 12) {
        for (let z = q.zs; z < q.ze; z += 12) {
          if (Math.abs(x % 60) < 10 || Math.abs(z % 60) < 10) continue; 

          if (Math.random() < 0.3) {
             for(let y=0; y<2; y++) { 
               dummy.position.set(x, (y*10) + 5, z);
               dummy.rotation.y = (Math.random() - 0.5) * 0.05;
               dummy.updateMatrix();
               crateRef.current.setMatrixAt(crateCount, dummy.matrix);
               color.setHSL(0.08, 0.4, 0.3 + Math.random()*0.1);
               crateRef.current.setColorAt(crateCount, color);
               crateCount++;
             }
          } else {
             for(let y=0; y<4; y++) { 
               for(let sx=0; sx<2; sx++) {
                 for(let sz=0; sz<2; sz++) {
                   dummy.position.set(x + (sx*5.5) - 2.5, (y*5) + 2.5, z + (sz*5.5) - 2.5);
                   dummy.updateMatrix();
                   boxRef.current.setMatrixAt(boxCount, dummy.matrix);
                   color.setHSL(0.09, 0.5, 0.4 + Math.random()*0.2);
                   boxRef.current.setColorAt(boxCount, color);
                   boxCount++;
                 }
               }
             }
          }
        }
      }
    });

    crateRef.current.count = crateCount;
    boxRef.current.count = boxCount;
    crateRef.current.instanceMatrix.needsUpdate = true;
    boxRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, color]);

  const handleClick = (e, ref) => {
    e.stopPropagation(); 
    ref.current.getMatrixAt(e.instanceId, tempMatrix);
    const position = new THREE.Vector3().setFromMatrixPosition(tempMatrix);
    onBoxClick(position);
  };

  return (
    <group>
      <instancedMesh ref={crateRef} args={[null, null, 4000]} castShadow receiveShadow onClick={(e) => handleClick(e, crateRef)} >
        <boxGeometry args={[9.5, 9.5, 9.5]} />
        <meshStandardMaterial color="#FFF" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={boxRef} args={[null, null, 25000]} castShadow receiveShadow onClick={(e) => handleClick(e, boxRef)}>
        <boxGeometry args={[5, 4.8, 5]} />
        <meshStandardMaterial color="#FFF" roughness={0.9} />
      </instancedMesh>
    </group>
  );
};

// ----------------------------------------------------------------------
// 5. MAIN APPLICATION
// ----------------------------------------------------------------------

export default function MassiveWarehouse3D() {
  // Store the exact target the camera should look at, and where the camera should be
  const [viewState, setViewState] = useState({
    mode: 'drone',
    target: new THREE.Vector3(0, 15, 0),
    camPos: new THREE.Vector3(150, 120, 250), // Nice wide starting view
    timestamp: Date.now()
  });

  const handleFocusBox = (pos) => {
    setViewState({
      mode: 'focus',
      target: pos.clone(),
      // Position the camera slightly above and to the side of the clicked box
      camPos: pos.clone().add(new THREE.Vector3(25, 20, 25)), 
      timestamp: Date.now()
    });
  };

  const handleResetView = () => {
    setViewState({
      mode: 'drone',
      target: new THREE.Vector3(0, 15, 0),
      camPos: new THREE.Vector3(150, 120, 250), // Return to wide view
      timestamp: Date.now()
    });
  };

  return (
    <div className="warehouse-container">
      
      {/* Attractive UI */}
      <div className="warehouse-ui">
        <h2>AUTOMATED LOGISTICS HUB</h2>
        <div className="ui-divider"></div>
        <div className="ui-stats">
          <p>CAPACITY: <span className="highlight">31,000+ UNITS</span></p>
          <p>MACHINES: <span className="status-green">AUTONOMOUS</span></p>
          <p>INTERACTION: <span className="highlight">CLICK ANY BOX</span></p>
        </div>
        
        {/* Reset View Button only appears when focused on a box */}
        {viewState.mode === 'focus' && (
          <div className="ui-controls" style={{ marginTop: '20px' }}>
            <button 
              className="reset-btn"
              onClick={handleResetView}
              style={{ width: '100%', padding: '12px', background: '#E74C3C', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', transition: '0.3s' }}
            >
              🔄 RESET VIEW
            </button>
          </div>
        )}
      </div>

      <Canvas shadows>
        {/* The Fixed Camera Controller */}
        <CameraController viewState={viewState} />

        {/* Realistic Lighting & Environment */}
        <ambientLight intensity={0.8} color="#FFFFFF" />
        <directionalLight 
          position={[100, 200, 50]} 
          intensity={1.5} 
          color="#FFF2E0"
          castShadow 
          shadow-mapSize-width={4096} shadow-mapSize-height={4096}
          shadow-camera-left={-200} shadow-camera-right={200}
          shadow-camera-top={200} shadow-camera-bottom={-200}
          shadow-bias={-0.001}
        />
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <Environment preset="city" />

        {/* The Structure and Clickable Boxes */}
        <WarehouseArchitecture />
        <MultiSizeInventory onBoxClick={handleFocusBox} />
        
        {/* Animated Machines Driving Through the Warehouse */}
        <AnimatedForklift posX={0} startZ={-300} endZ={300} speed={0.1} />
        <AnimatedForklift posX={-50} startZ={250} endZ={-250} speed={0.2} />
        <AnimatedForklift posX={50} startZ={-200} endZ={200} speed={0.2} />

        {/* Loading/Unloading Setup at the Shutter */}
        <TransportTruck position={[-520, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <Forklift position={[-450, 0, 0]} rotation={[0, -Math.PI / 2, 0]} isLifting={true} />

        {/* Floor Shadow */}
        <ContactShadows position={[0, 0.1, 0]} resolution={2048} scale={1000} blur={2.5} opacity={0.6} far={20} />
      </Canvas>
    </div>
  );
}