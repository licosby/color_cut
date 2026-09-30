import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppState } from '../state/UIState';
import { Highlighting } from './Highlighting';
import { ColorGrouper } from '../geometry/ColorGrouper';

/**
 * Viewer API exposed to parent components
 */
export interface ViewerAPI {
  resetCamera: () => void;
  enableCameraControls: () => void;
}

interface ViewerProps {
  colorGrouper: ColorGrouper | null;
}

/**
 * Viewer - Three.js 3D viewport with orbit controls and click-to-select
 * Silhouette Studio style: clean background, soft lighting, integrated canvas
 */
export const Viewer = forwardRef<ViewerAPI, ViewerProps>(({ colorGrouper }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const highlightingRef = useRef<Highlighting | null>(null);
  const animFrameRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const initialCameraPos = useRef(new THREE.Vector3(5, 4, 5));
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  const { state, dispatch } = useAppState();

  // Expose API to parent
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.copy(initialCameraPos.current);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    },
    enableCameraControls: () => {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    },
  }));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.copy(initialCameraPos.current);
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

    // Orbit Controls - full rotate/pan/zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(8, 12, 10);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe8e8ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 40, 0xe2e2e8, 0xededf0);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Initialize highlighting
    highlightingRef.current = new Highlighting(scene);

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
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

  // Click-to-select: raycasting to find triangle under cursor
  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;

    const canvas = renderer.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = false;
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Detect if user is dragging (orbit/pan)
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore if user was dragging (orbit/pan)
      if (isDraggingRef.current) return;

      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;

      // Calculate normalized device coordinates
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Cast ray
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Find intersected objects (only model meshes, not highlight/ghost)
      const intersectTargets: THREE.Object3D[] = [];
      if (modelGroupRef.current) {
        modelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            intersectTargets.push(child);
          }
        });
      }

      const intersects = raycasterRef.current.intersectObjects(intersectTargets, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        
        // Get the face index to determine which triangle was clicked
        if (hit.faceIndex !== undefined && hit.faceIndex !== null) {
          const triangleIndex = hit.faceIndex as number;
          
          // Use the colorGrouper to find which group this triangle belongs to
          if (colorGrouper) {
            const groupIndex = colorGrouper.findGroupIndexByTriangle(triangleIndex);
            if (groupIndex !== null) {
              dispatch({ type: 'SELECT_COLOR', payload: groupIndex });
            }
          }
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [colorGrouper, dispatch]);

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
      // Highlight selected color
      const selectedGroup = state.colorGroups[state.selectedColorIndex];
      highlighting.highlightTriangles(geometry, selectedGroup, true);

      // Apply transform to highlight group
      const hlGroup = highlighting.getGroup();
      hlGroup.scale.setScalar(scale);
      hlGroup.position.copy(center.clone().multiplyScalar(-scale));

      // Add faint context mesh
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

    // Apply transform
    group.scale.setScalar(scale);
    group.position.copy(center.clone().multiplyScalar(-scale));

    scene.add(group);

    // Reset camera to good viewing angle
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 4, 5);
      initialCameraPos.current.set(5, 4, 5);
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
      className="w-full h-full cursor-pointer"
      style={{ minHeight: '400px' }}
    />
  );
});

Viewer.displayName = 'Viewer';
