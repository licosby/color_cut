import * as THREE from 'three';

/**
 * FastPainter - Optimized painting system for 3D models
 * Uses screen-space projection for instant triangle selection
 * Feels like painting on paper, not selecting geometry
 */
export class FastPainter {
  private geometry: THREE.BufferGeometry | null = null;
  private positions: Float32Array | null = null;
  private index: Uint32Array | null = null;
  private triangleCount: number = 0;
  
  // Screen-space cache for fast lookup
  private screenPositions: Float32Array | null = null;
  private screenTriangleCenters: Float32Array | null = null;
  
  // Spatial grid for O(1) lookup
  private gridSize: number = 50; // pixels
  private grid: Map<string, number[]> = new Map();

  /**
   * Initialize with geometry
   */
  init(geometry: THREE.BufferGeometry): void {
    this.geometry = geometry;
    this.positions = geometry.getAttribute('position').array as Float32Array;
    this.index = geometry.index ? geometry.index.array as Uint32Array : null;
    this.triangleCount = this.index 
      ? Math.floor(this.index.length / 3)
      : Math.floor(this.positions.length / 9);
    
    // Pre-compute triangle centers
    this.screenTriangleCenters = new Float32Array(this.triangleCount * 2);
  }

  /**
   * Update screen-space positions (call when camera moves)
   */
  updateScreenSpace(camera: THREE.Camera, width: number, height: number): void {
    if (!this.positions || !this.screenTriangleCenters) return;

    const projMatrix = new THREE.Matrix4();
    projMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    for (let i = 0; i < this.triangleCount; i++) {
      const i3 = i * 3;
      const v0 = this.index ? this.index[i3] : i3;
      const v1 = this.index ? this.index[i3 + 1] : i3 + 1;
      const v2 = this.index ? this.index[i3 + 2] : i3 + 2;

      // Get triangle center
      const cx = (this.positions[v0 * 3] + this.positions[v1 * 3] + this.positions[v2 * 3]) / 3;
      const cy = (this.positions[v0 * 3 + 1] + this.positions[v1 * 3 + 1] + this.positions[v2 * 3 + 1]) / 3;
      const cz = (this.positions[v0 * 3 + 2] + this.positions[v1 * 3 + 2] + this.positions[v2 * 3 + 2]) / 3;

      // Project to screen
      const screenPos = new THREE.Vector3(cx, cy, cz).project(camera);
      this.screenTriangleCenters[i * 2] = (screenPos.x + 1) * width / 2;
      this.screenTriangleCenters[i * 2 + 1] = (1 - screenPos.y) * height / 2;
    }

    // Rebuild spatial grid
    this.buildGrid(width, height);
  }

  /**
   * Build spatial grid for fast lookup
   */
  private buildGrid(width: number, height: number): void {
    this.grid.clear();

    if (!this.screenTriangleCenters) return;

    for (let i = 0; i < this.triangleCount; i++) {
      const x = this.screenTriangleCenters[i * 2];
      const y = this.screenTriangleCenters[i * 2 + 1];

      const gridX = Math.floor(x / this.gridSize);
      const gridY = Math.floor(y / this.gridSize);
      const key = `${gridX},${gridY}`;

      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(i);
    }
  }

  /**
   * Paint at screen position with brush radius (in pixels)
   * Returns array of triangle indices
   */
  paintAt(screenX: number, screenY: number, brushRadius: number): number[] {
    if (!this.screenTriangleCenters) return [];

    const result: number[] = [];
    const radiusSq = brushRadius * brushRadius;

    // Get grid cells that might contain triangles
    const minGridX = Math.floor((screenX - brushRadius) / this.gridSize);
    const maxGridX = Math.floor((screenX + brushRadius) / this.gridSize);
    const minGridY = Math.floor((screenY - brushRadius) / this.gridSize);
    const maxGridY = Math.floor((screenY + brushRadius) / this.gridSize);

    for (let gx = minGridX; gx <= maxGridX; gx++) {
      for (let gy = minGridY; gy <= maxGridY; gy++) {
        const key = `${gx},${gy}`;
        const triangles = this.grid.get(key);

        if (triangles) {
          for (const triIdx of triangles) {
            const tx = this.screenTriangleCenters[triIdx * 2];
            const ty = this.screenTriangleCenters[triIdx * 2 + 1];

            const dx = tx - screenX;
            const dy = ty - screenY;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
              result.push(triIdx);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Magic wand - select entire connected region from a point
   * Uses flood fill with angle threshold
   */
  magicWand(
    screenX: number,
    screenY: number,
    camera: THREE.Camera,
    width: number,
    height: number,
    angleThreshold: number = 45
  ): number[] {
    if (!this.screenTriangleCenters || !this.geometry) return [];

    // Find closest triangle to click point
    let closestTri = -1;
    let closestDist = Infinity;

    for (let i = 0; i < this.triangleCount; i++) {
      const tx = this.screenTriangleCenters[i * 2];
      const ty = this.screenTriangleCenters[i * 2 + 1];

      const dx = tx - screenX;
      const dy = ty - screenY;
      const dist = dx * dx + dy * dy;

      if (dist < closestDist) {
        closestDist = dist;
        closestTri = i;
      }
    }

    if (closestTri === -1 || closestDist > 10000) return []; // Clicked too far from model

    // Flood fill from this triangle
    return this.floodFill(closestTri, angleThreshold);
  }

  /**
   * Flood fill from a triangle using adjacency and angle threshold
   */
  private floodFill(startTriangle: number, angleThreshold: number): number[] {
    if (!this.geometry) return [];

    const normals = this.geometry.getAttribute('normal');
    if (!normals) return [startTriangle];

    const thresholdRad = (angleThreshold * Math.PI) / 180;
    const selected = new Set<number>();
    const queue: number[] = [startTriangle];
    selected.add(startTriangle);

    // Build adjacency on-the-fly (could be cached for performance)
    const adjacency = this.buildAdjacency();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentNormal = this.getTriangleNormal(current, normals as THREE.BufferAttribute | THREE.InterleavedBufferAttribute);
      const neighbors = adjacency.get(current) || [];

      for (const neighbor of neighbors) {
        if (selected.has(neighbor)) continue;

        const neighborNormal = this.getTriangleNormal(neighbor, normals as THREE.BufferAttribute | THREE.InterleavedBufferAttribute);
        const angle = currentNormal.angleTo(neighborNormal);

        if (angle <= thresholdRad) {
          selected.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return Array.from(selected);
  }

  /**
   * Build adjacency map (triangle -> neighbor triangles)
   */
  private buildAdjacency(): Map<number, number[]> {
    const adjacency = new Map<number, number[]>();
    
    if (!this.index || !this.positions) return adjacency;

    // Build vertex -> triangle map
    const vertexToTriangles = new Map<number, Set<number>>();

    for (let t = 0; t < this.triangleCount; t++) {
      const v0 = this.index[t * 3];
      const v1 = this.index[t * 3 + 1];
      const v2 = this.index[t * 3 + 2];

      for (const v of [v0, v1, v2]) {
        if (!vertexToTriangles.has(v)) {
          vertexToTriangles.set(v, new Set());
        }
        vertexToTriangles.get(v)!.add(t);
      }
    }

    // Build adjacency
    for (let t = 0; t < this.triangleCount; t++) {
      const neighbors = new Set<number>();
      const v0 = this.index[t * 3];
      const v1 = this.index[t * 3 + 1];
      const v2 = this.index[t * 3 + 2];

      for (const v of [v0, v1, v2]) {
        const triangles = vertexToTriangles.get(v);
        if (triangles) {
          for (const neighbor of triangles) {
            if (neighbor !== t) {
              neighbors.add(neighbor);
            }
          }
        }
      }

      adjacency.set(t, Array.from(neighbors));
    }

    return adjacency;
  }

  /**
   * Get normal of a triangle
   */
  private getTriangleNormal(triIdx: number, normals: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.Vector3 {
    if (!this.index) return new THREE.Vector3(0, 1, 0);

    const v0 = this.index[triIdx * 3];
    const v1 = this.index[triIdx * 3 + 1];
    const v2 = this.index[triIdx * 3 + 2];

    const n0 = new THREE.Vector3(normals.getX(v0), normals.getY(v0), normals.getZ(v0));
    const n1 = new THREE.Vector3(normals.getX(v1), normals.getY(v1), normals.getZ(v1));
    const n2 = new THREE.Vector3(normals.getX(v2), normals.getY(v2), normals.getZ(v2));

    return n0.add(n1).add(n2).divideScalar(3).normalize();
  }

  /**
   * Clear cached data
   */
  clear(): void {
    this.geometry = null;
    this.positions = null;
    this.index = null;
    this.triangleCount = 0;
    this.screenTriangleCenters = null;
    this.grid.clear();
  }
}
