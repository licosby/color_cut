import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppState } from '../state/UIState';
import { Highlighting } from './Highlighting';

/**
 * Viewer - Three.js 3D viewport with orbit controls
 * Displays the model and uses Highlighting module for color isolation
 * Designed to integrate into a Silhouette Studio-style center canvas
 */
export function Viewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const highlightingRef = useRef<Highlighting | null>(null);
  const animFrameRef = useRef<number>(0);

  const { state } = useAppState();

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene - soft light background for craft-studio feel
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(6, 6, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Lighting - soft, even lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(8, 12, 10);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe8e8ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Grid - soft, subtle grid for spatial reference
    const gridHelper = new THREE.GridHelper(20, 40, 0xe2e2e8, 0xededf0);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Initialize highlighting module
    highlightingRef.current = new Highlighting(scene);

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
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (highlightingRef.current) {
        highlightingRef.current.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update model when geometry or selection changes
  const updateModel = useCallback(() => {
    const scene = sceneRef.current;
    const highlighting = highlightingRef.current;
    if (!scene || !highlighting) return;

    // Remove existing model
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) {
            mat.forEach((m: THREE.Material) => m.dispose());
          } else {
            (mat as THREE.Material).dispose();
          }
        }
      });
      modelGroupRef.current = null;
    }

    // Clear highlights
    highlighting.clearHighlight();

    if (!state.geometry) return;

    const geometry = state.geometry;
    const posAttr = geometry.getAttribute('position');
    if (!posAttr || posAttr.count === 0) return;

    // Calculate bounds for centering
    const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 4 / maxDim : 1;

    // Create model group
    const group = new THREE.Group();
    modelGroupRef.current = group;

    if (state.selectedColorIndex !== null && state.colorGroups.length > 0) {
      // Show highlighted color using Highlighting module
      const selectedGroup = state.colorGroups[state.selectedColorIndex];
      
      // The highlighting module adds meshes to its own group in the scene
      highlighting.highlightTriangles(geometry, selectedGroup, true);
      
      // Apply the same transform to the highlight group
      const hlGroup = highlighting.getGroup();
      hlGroup.scale.setScalar(scale);
      hlGroup.position.copy(center.clone().multiplyScalar(-scale));

      // Also add a very faint full model behind for context
      const hasColors = geometry.hasAttribute('color');
      const contextMat = new THREE.MeshStandardMaterial({
        vertexColors: hasColors,
        color: hasColors ? 0xffffff : 0xaaaaaa,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const contextMesh = new THREE.Mesh(geometry.clone(), contextMat);
      group.add(contextMesh);
    } else {
      // Show full model with vertex colors
      const hasColors = geometry.hasAttribute('color');
      const material = new THREE.MeshStandardMaterial({
        vertexColors: hasColors,
        color: hasColors ? 0xffffff : 0x8888aa,
        side: THREE.DoubleSide,
        metalness: 0.05,
        roughness: 0.7,
      });

      const mesh = new THREE.Mesh(geometry.clone(), material);
      mesh.castShadow = true;
      group.add(mesh);
    }

    // Apply transform to model group
    group.scale.setScalar(scale);
    group.position.copy(center.clone().multiplyScalar(-scale));

    scene.add(group);

    // Reset camera
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 4, 5);
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
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
