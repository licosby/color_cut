import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppState } from '../state/UIState';
import { ColorGroup } from '../geometry/ColorGrouper';

/**
 * Viewer - Three.js 3D viewport with orbit controls
 * Displays the model and highlights selected color groups
 */
export function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);

  const { state } = useAppState();

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-5, -2, -5);
    scene.add(directionalLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update model in scene
  const updateModel = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing model
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m: THREE.Material) => m.dispose());
          } else {
            (mat as THREE.Material).dispose();
          }
        }
      });
    }

    if (!state.geometry) return;

    const group = new THREE.Group();
    modelRef.current = group;

    if (state.selectedColorIndex !== null && state.colorGroups.length > 0) {
      // Show highlighted color + ghosted rest
      const selectedGroup = state.colorGroups[state.selectedColorIndex];
      
      // Create ghost mesh (all geometry, semi-transparent)
      const ghostMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ghostMesh = new THREE.Mesh(state.geometry.clone(), ghostMaterial);
      group.add(ghostMesh);

      // Create highlighted mesh (only selected color triangles)
      const highlightGeometry = buildHighlightGeometry(state.geometry, selectedGroup);
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: selectedGroup.colorObj,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.6,
      });
      const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
      group.add(highlightMesh);
    } else {
      // Show full model with vertex colors
      const hasColors = state.geometry.hasAttribute('color');
      const material = new THREE.MeshStandardMaterial({
        vertexColors: hasColors,
        color: hasColors ? 0xffffff : 0x888888,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(state.geometry.clone(), material);
      group.add(mesh);
    }

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;
    
    group.position.sub(center.multiplyScalar(scale));
    group.scale.setScalar(scale);

    scene.add(group);

    // Reset camera
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 5, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [state.geometry, state.selectedColorIndex, state.colorGroups]);

  useEffect(() => {
    updateModel();
  }, [updateModel]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}

/**
 * Build geometry containing only triangles from a specific color group
 */
function buildHighlightGeometry(
  sourceGeometry: THREE.BufferGeometry,
  colorGroup: ColorGroup
): THREE.BufferGeometry {
  const positions = sourceGeometry.getAttribute('position');
  const normals = sourceGeometry.getAttribute('normal');
  const index = sourceGeometry.index;

  const newPositions: number[] = [];
  const newNormals: number[] = [];

  for (const triIdx of colorGroup.triangleIndices) {
    let v0: number, v1: number, v2: number;

    if (index) {
      v0 = index.getX(triIdx * 3);
      v1 = index.getX(triIdx * 3 + 1);
      v2 = index.getX(triIdx * 3 + 2);
    } else {
      v0 = triIdx * 3;
      v1 = triIdx * 3 + 1;
      v2 = triIdx * 3 + 2;
    }

    newPositions.push(
      positions.getX(v0), positions.getY(v0), positions.getZ(v0),
      positions.getX(v1), positions.getY(v1), positions.getZ(v1),
      positions.getX(v2), positions.getY(v2), positions.getZ(v2)
    );

    if (normals) {
      newNormals.push(
        normals.getX(v0), normals.getY(v0), normals.getZ(v0),
        normals.getX(v1), normals.getY(v1), normals.getZ(v1),
        normals.getX(v2), normals.getY(v2), normals.getZ(v2)
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  if (newNormals.length > 0) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  } else {
    geometry.computeVertexNormals();
  }

  return geometry;
}
