import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppState, Layer } from '../state/UIState';
import { Highlighting } from './Highlighting';
import { ColorGrouper } from '../geometry/ColorGrouper';
import { PartSelector } from '../geometry/PartSelector';
import { SpatialHash } from '../geometry/SpatialHash';
import { BrushThrottle } from '../geometry/BrushThrottle';

export interface ViewerAPI {
  resetCamera: () => void;
  enableCameraControls: () => void;
}

interface ViewerProps {
  colorGrouper: ColorGrouper | null;
  uiMode?: 'select' | 'highlight' | 'export' | 'part' | 'paint';
  angleThreshold?: number;
}

/**
 * Viewer - Three.js 3D viewport with orbit controls, click-to-select, and layer management
 */
export const Viewer = forwardRef<ViewerAPI, ViewerProps>(({ colorGrouper, uiMode = 'select', angleThreshold = 45 }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const layersGroupRef = useRef<THREE.Group | null>(null);
  const highlightingRef = useRef<Highlighting | null>(null);
  const partSelectorRef = useRef<PartSelector>(new PartSelector());
  const spatialHashRef = useRef<SpatialHash>(new SpatialHash(0.1));
  const brushThrottleRef = useRef<BrushThrottle>(new BrushThrottle());
  const animFrameRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const initialCameraPos = useRef(new THREE.Vector3(5, 4, 5));
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  const { state, dispatch } = useAppState();

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.copy(initialCameraPos.current);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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

    // Layers group
    layersGroupRef.current = new THREE.Group();
    layersGroupRef.current.name = 'layersGroup';
    scene.add(layersGroupRef.current);

    highlightingRef.current = new Highlighting(scene);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    let resizeTimeout: number | null = null;
    
    const handleResize = () => {
      // Debounce resize to prevent ResizeObserver loop
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }
      
      resizeTimeout = requestAnimationFrame(() => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout);
      }
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

  // Click-to-select and painting
  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;

    const canvas = renderer.domElement;
    let isPainting = false;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = false;
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      
      // Start painting if in paint mode
      if (uiMode === 'paint') {
        isPainting = true;
        handlePaint(e);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
      }
      
      // Continue painting while dragging
      if (isPainting && uiMode === 'paint') {
        handlePaint(e);
      }
    };

    const handleMouseUp = () => {
      isPainting = false;
    };

    const handlePaint = (e: MouseEvent) => {
      const camera = cameraRef.current;
      if (!camera || !state.geometry) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const mainMesh = modelGroupRef.current?.children[0] as THREE.Mesh | undefined;
      if (!mainMesh || !mainMesh.isMesh) return;

      const intersects = raycasterRef.current.intersectObject(mainMesh, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.faceIndex !== undefined && hit.faceIndex !== null) {
          const triangleIndex = hit.faceIndex;
          
          // Track last clicked triangle for flood fill
          dispatch({ type: 'SET_LAST_CLICKED_TRIANGLE', payload: triangleIndex });
          
          // Use SpatialHash for fast brush selection (O(1) lookup)
          const brushSize = state.brushSize;
          const hitPoint = hit.point;
          
          // Calculate radius based on brush size (approximate)
          // For large models, we use a spatial radius instead of topological distance
          const radius = Math.sqrt(brushSize) * 0.05; // Adjust multiplier as needed
          
          const trianglesToPaint = spatialHashRef.current.getTrianglesInRadius(hitPoint, radius);
          
          // Use throttle for smooth performance
          if (state.paintMode === 'add') {
            brushThrottleRef.current.addTriangles(trianglesToPaint);
          } else {
            brushThrottleRef.current.removeTriangles(trianglesToPaint);
          }
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (isDraggingRef.current || uiMode === 'paint') return;

      const camera = cameraRef.current;
      if (!camera) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const mainMesh = modelGroupRef.current?.children[0] as THREE.Mesh | undefined;
      if (!mainMesh || !mainMesh.isMesh) {
        console.warn('No main mesh found for raycasting');
        return;
      }

      if (!mainMesh.geometry.index) {
        console.warn('Main mesh geometry has no index - raycasting may not work correctly');
      }

      const intersects = raycasterRef.current.intersectObject(mainMesh, false);

      if (intersects.length > 0) {
        const hit = intersects[0];

        if (hit.faceIndex !== undefined && hit.faceIndex !== null) {
          const triangleIndex = hit.faceIndex;

          if (uiMode === 'part') {
            const selectedTriangles = partSelectorRef.current.selectPart(triangleIndex, angleThreshold);
            dispatch({ type: 'SET_SELECTED_TRIANGLES', payload: selectedTriangles });
          } else {
            if (colorGrouper) {
              const groupIndex = colorGrouper.findGroupIndexByTriangle(triangleIndex);
              if (groupIndex !== null) {
                dispatch({ type: 'SELECT_COLOR', payload: groupIndex });
              } else {
                console.warn(`Triangle ${triangleIndex} not found in any color group`);
              }
            }
          }
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [colorGrouper, dispatch, uiMode, state.brushSize, state.paintMode, state.geometry]);
  // Build adjacency graph and spatial hash when geometry loads
  useEffect(() => {
    if (state.geometry) {
      partSelectorRef.current.buildAdjacency(state.geometry);
      spatialHashRef.current.build(state.geometry);
      
      // Set up brush throttle callback
      brushThrottleRef.current.setCallback((triangles: number[]) => {
        triangles.forEach(triIdx => {
          if (state.paintMode === 'add') {
            dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: triIdx });
          } else {
            dispatch({ type: 'REMOVE_PAINTED_TRIANGLE', payload: triIdx });
          }
        });
      });
    }
  }, [state.geometry, state.paintMode, dispatch]);

  // Highlight selected triangles in part mode or painted triangles in paint mode
  useEffect(() => {
    const scene = sceneRef.current;
    const highlighting = highlightingRef.current;
    if (!scene || !highlighting || !state.geometry) return;

    if (uiMode === 'part' && state.selectedTriangles.length > 0) {
      // Create a temporary color group for highlighting
      const tempGroup = {
        color: '#4A7AFF',
        colorObj: new THREE.Color(0x4A7AFF),
        triangleIndices: state.selectedTriangles,
        triangleCount: state.selectedTriangles.length,
        r: 0.29,
        g: 0.48,
        b: 1.0,
      };
      highlighting.highlightTriangles(state.geometry, tempGroup, false);

      // Apply transform to match the model
      const posAttr = state.geometry.getAttribute('position');
      const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 4 / maxDim : 1;

      const hlGroup = highlighting.getGroup();
      hlGroup.scale.setScalar(scale);
      hlGroup.position.copy(center.clone().multiplyScalar(-scale));
    } else if (uiMode === 'paint' && state.paintedTriangles.size > 0) {
      // Highlight painted triangles
      const paintedArray = Array.from(state.paintedTriangles);
      const tempGroup = {
        color: state.paintMode === 'add' ? '#FF6B6B' : '#4ECDC4',
        colorObj: new THREE.Color(state.paintMode === 'add' ? 0xFF6B6B : 0x4ECDC4),
        triangleIndices: paintedArray,
        triangleCount: paintedArray.length,
        r: state.paintMode === 'add' ? 1.0 : 0.31,
        g: state.paintMode === 'add' ? 0.42 : 0.80,
        b: state.paintMode === 'add' ? 0.42 : 0.77,
      };
      highlighting.highlightTriangles(state.geometry, tempGroup, false);

      // Apply transform to match the model
      const posAttr = state.geometry.getAttribute('position');
      const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 4 / maxDim : 1;

      const hlGroup = highlighting.getGroup();
      hlGroup.scale.setScalar(scale);
      hlGroup.position.copy(center.clone().multiplyScalar(-scale));
    } else {
      highlighting.clearHighlight();
    }
  }, [state.selectedTriangles, state.paintedTriangles, uiMode, state.geometry, state.paintMode]);
  // Update main model when geometry or selection changes
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

    const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 4 / maxDim : 1;

    const group = new THREE.Group();
    modelGroupRef.current = group;

    if (state.selectedColorIndex !== null && state.colorGroups.length > 0) {
      const selectedGroup = state.colorGroups[state.selectedColorIndex];
      highlighting.highlightTriangles(geometry, selectedGroup, true);

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

    group.scale.setScalar(scale);
    group.position.copy(center.clone().multiplyScalar(-scale));

    scene.add(group);

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

  // Update layers in scene with explode view
  useEffect(() => {
    const scene = sceneRef.current;
    const layersGroup = layersGroupRef.current;
    if (!scene || !layersGroup) return;

    // Clear existing layer meshes
    while (layersGroup.children.length > 0) {
      const child = layersGroup.children[0];
      layersGroup.remove(child);
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
    }

    // Add layer meshes
    if (state.geometry && state.layers.length > 0) {
      const posAttr = state.geometry.getAttribute('position');
      if (!posAttr || posAttr.count === 0) return;

      const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 4 / maxDim : 1;

      for (let i = 0; i < state.layers.length; i++) {
        const layer = state.layers[i];
        if (!layer.visible || !layer.geometry) continue;

        // Use colorGroup color if available, otherwise generate a color from layer index
        const layerColor = layer.colorGroup?.colorObj || new THREE.Color().setHSL(
          (i * 0.618) % 1, // Golden ratio for nice color distribution
          0.7,
          0.5
        );

        const material = new THREE.MeshStandardMaterial({
          color: layerColor,
          side: THREE.DoubleSide,
          metalness: 0.05,
          roughness: 0.7,
        });

        const isSelected = state.selectedLayerId === layer.id;
        if (isSelected) {
          material.emissive = new THREE.Color(0x222222);
          material.emissiveIntensity = 0.3;
        }

        const mesh = new THREE.Mesh(layer.geometry.clone(), material);
        mesh.scale.setScalar(scale);
        
        // Calculate base position
        const basePosition = center.clone().multiplyScalar(-scale);
        
        // Apply explode offset if enabled
        if (state.explodeView && layer.explodeOffset) {
          basePosition.add(layer.explodeOffset.clone().multiplyScalar(state.explodeDistance));
        } else if (state.explodeView) {
          // Auto-calculate explode direction from layer center
          const layerBox = new THREE.Box3().setFromBufferAttribute(
            layer.geometry.getAttribute('position') as THREE.BufferAttribute
          );
          const layerCenter = layerBox.getCenter(new THREE.Vector3());
          const direction = layerCenter.sub(center).normalize();
          basePosition.add(direction.multiplyScalar(state.explodeDistance * scale));
        }
        
        mesh.position.copy(basePosition);
        mesh.castShadow = true;
        layersGroup.add(mesh);
      }
    }
  }, [state.layers, state.geometry, state.selectedLayerId, state.explodeView, state.explodeDistance]);

  // Render connectors
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing connectors
    const connectorsToRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.name.startsWith('connector-')) {
        connectorsToRemove.push(child);
      }
    });
    connectorsToRemove.forEach(obj => {
      scene.remove(obj);
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });

    // Add connectors
    if (state.connectors.length > 0 && state.geometry) {
      const posAttr = state.geometry.getAttribute('position');
      const box = new THREE.Box3().setFromBufferAttribute(posAttr as THREE.BufferAttribute);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 4 / maxDim : 1;

      for (const connector of state.connectors) {
        const fromLayer = state.layers.find(l => l.id === connector.fromLayerId);
        const toLayer = state.layers.find(l => l.id === connector.toLayerId);

        if (!fromLayer || !toLayer) continue;

        // Calculate connector positions with explode offsets
        let fromPoint = connector.fromPoint.clone().multiplyScalar(scale).add(center.clone().multiplyScalar(-scale));
        let toPoint = connector.toPoint.clone().multiplyScalar(scale).add(center.clone().multiplyScalar(-scale));

        if (state.explodeView) {
          if (fromLayer.explodeOffset) {
            fromPoint.add(fromLayer.explodeOffset.clone().multiplyScalar(state.explodeDistance));
          } else {
            const fromBox = new THREE.Box3().setFromBufferAttribute(
              fromLayer.geometry!.getAttribute('position') as THREE.BufferAttribute
            );
            const fromCenter = fromBox.getCenter(new THREE.Vector3());
            const fromDirection = fromCenter.sub(center).normalize();
            fromPoint.add(fromDirection.multiplyScalar(state.explodeDistance * scale));
          }

          if (toLayer.explodeOffset) {
            toPoint.add(toLayer.explodeOffset.clone().multiplyScalar(state.explodeDistance));
          } else {
            const toBox = new THREE.Box3().setFromBufferAttribute(
              toLayer.geometry!.getAttribute('position') as THREE.BufferAttribute
            );
            const toCenter = toBox.getCenter(new THREE.Vector3());
            const toDirection = toCenter.sub(center).normalize();
            toPoint.add(toDirection.multiplyScalar(state.explodeDistance * scale));
          }
        }

        // Create cylinder connector
        const direction = toPoint.clone().sub(fromPoint);
        const length = direction.length();
        const midpoint = fromPoint.clone().add(toPoint).multiplyScalar(0.5);

        const cylinderGeometry = new THREE.CylinderGeometry(
          connector.radius * scale,
          connector.radius * scale,
          length,
          16
        );
        const cylinderMaterial = new THREE.MeshStandardMaterial({
          color: connector.color,
          metalness: 0.3,
          roughness: 0.6,
        });

        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.copy(midpoint);
        cylinder.name = `connector-${connector.id}`;

        // Rotate cylinder to align with direction
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize());
        cylinder.setRotationFromQuaternion(quaternion);

        cylinder.castShadow = true;
        scene.add(cylinder);
      }
    }
  }, [state.connectors, state.layers, state.geometry, state.explodeView, state.explodeDistance]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-pointer"
      style={{ minHeight: '400px' }}
    />
  );
});

Viewer.displayName = 'Viewer';
