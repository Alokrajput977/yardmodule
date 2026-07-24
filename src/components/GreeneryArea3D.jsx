import React, { useMemo, useRef, useLayoutEffect, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Pre-load tree model
useGLTF.preload("/oak_tree.glb");
useGLTF.preload("/acacia_tree.glb");

const LAT_TO_METERS = 111320;

// Your existing GREENERY_COORDS
const GREENERY_COORDS = [
  [28.50845790390383, 77.28776841227777],
  [28.50845246317079, 77.28711093642693],
  [28.508468912519486, 77.28678841362725],
  [28.508432379293147, 77.28678573141838],
  [28.508873091198694, 77.28774949751877],
  [28.508745814583012, 77.28775620304648],
  [28.50868689017281, 77.28775754415094],
  [28.50913471486485, 77.28773474537542],
  [28.509178318746454, 77.28772669874877],
  [28.509104074288622, 77.28773340427098],
  [28.509257277080785, 77.28786349140184],
  [28.507810249414163, 77.2868081762356],
  [28.507707720008348, 77.28681219954821],
  [28.507365339995083, 77.28682358116212],
  [28.507355987855256, 77.28682022830765],
  [28.50896276885772, 77.28954984856144],
  [28.509007590876884, 77.28953760687853],
  [28.50914743545424, 77.28953046589682],
  [28.509148331893247, 77.28944579425661],
  [28.50904882711768, 77.28945293523832],
  [28.508963665298303, 77.28946823734196],
];

// ============================================
// OPTIMIZED Instanced Tree Component
// ============================================
const InstancedTree = ({ positions, scale = 2, modelUrl = "/acacia_tree.glb" }) => {
  const meshRef = useRef(null);
  const { scene } = useGLTF(modelUrl);
  
  // Extract geometry and material from the loaded model once
  const { geometry, material } = useMemo(() => {
    let geo = null;
    let mat = null;
    
    scene.traverse((child) => {
      if (child.isMesh && !geo) {
        geo = child.geometry;
        mat = child.material;
      }
    });
    
    return { geometry: geo, material: mat };
  }, [scene]);

  useLayoutEffect(() => {
    if (!meshRef.current || !geometry || positions.length === 0) return;
    
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3(scale, scale, scale);
    
    // Set transformation for each tree instance
    positions.forEach((pos, i) => {
      position.set(pos.x, 0.06, pos.z);
      quaternion.setFromEuler(new THREE.Euler(0, pos.rot || 0, 0));
      matrix.compose(position, quaternion, scaleVec);
      mesh.setMatrixAt(i, matrix);
    });
    
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions, scale, geometry]);

  if (!geometry || positions.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, positions.length]}
      castShadow
      receiveShadow
      frustumCulled={true}
    />
  );
};

// ============================================
// MAIN GreeneryArea3D Component
// ============================================
const GreeneryArea3D = ({ center, isDark }) => {
  // Calculate tree positions ONLY ONCE using useMemo
  const treePositions = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    
    return GREENERY_COORDS.map((coord) => ({
      x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale,
      z: -(coord[0] - center.lat) * LAT_TO_METERS,
      rot: Math.random() * Math.PI * 2,
    }));
  }, [center]);

  return (
    <Suspense fallback={null}>
      {/* SINGLE instanced mesh for ALL trees - JUST 1 DRAW CALL! */}
      <InstancedTree 
        positions={treePositions} 
        scale={0.02}
        modelUrl="/acacia_tree.glb"
      />
    </Suspense>
  );
};

// ✅ FIXED EXPORT - Named export (matches your App.js import)
export default GreeneryArea3D ;