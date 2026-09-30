import * as THREE from 'three';

/**
 * PartSelector - Topology-based part selection using flood fill with angle threshold
 * 
 * When a user clicks on a triangle, this module:
 * 1. Builds an adjacency graph (which triangles share vertices)
 * 2. Calculates face normals for angle detection
 * 3. Flood fills from the clicked triangle, stopping at sharp edges
 * 4. Returns all triangles that form the "part"
 * 
 * This allows separating a hat from a head even if they're the same color,
 * by detecting the sharp angle where they meet.
 */
export class PartSelector {
  private adjacencyMap: Map<number, number[]> = new Map(); // triangle -> neighbor triangles
  private faceNormals: THREE.Vector3[] = [];
  private geometry: THREE.BufferGeometry | null = null;
  private totalTriangles: number = 0;

  /**
   * Build the adjacency graph and face normals from geometry
   * Call this once after loading a model
   */
  buildAdjacency(geometry: THREE.BufferGeometry): void {
    this.geometry = geometry;
    const positions = geometry.getAttribute('position');
    const index = geometry.index;

    this.totalTriangles = index
      ? Math.floor(index.count / 3)
      : Math.floor(positions.count / 3);

    // Build vertex-to-triangle map
    const vertexToTriangles = new Map<number, Set<number>>();

    for (let t = 0; t < this.totalTriangles; t++) {
      let v0: number, v1: number, v2: number;

      if (index) {
        v0 = index.getX(t * 3);
        v1 = index.getX(t * 3 + 1);
        v2 = index.getX(t * 3 + 2);
      } else {
        v0 = t * 3;
        v1 = t * 3 + 1;
        v2 = t * 3 + 2;
      }

      // Map each vertex to its triangle
      for (const v of [v0, v1, v2]) {
        if (!vertexToTriangles.has(v)) {
          vertexToTriangles.set(v, new Set());
        }
        vertexToTriangles.get(v)!.add(t);
      }
    }

    // Build adjacency: two triangles are neighbors if they share at least one vertex
    this.adjacencyMap.clear();
    for (let t = 0; t < this.totalTriangles; t++) {
      const neighbors = new Set<number>();

      let v0: number, v1: number, v2: number;
      if (index) {
        v0 = index.getX(t * 3);
        v1 = index.getX(t * 3 + 1);
        v2 = index.getX(t * 3 + 2);
      } else {
        v0 = t * 3;
        v1 = t * 3 + 1;
        v2 = t * 3 + 2;
      }

      // Find all triangles sharing any vertex with this triangle
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

      this.adjacencyMap.set(t, Array.from(neighbors));
    }

    // Calculate face normals
    this.faceNormals = [];
    const v0Vec = new THREE.Vector3();
    const v1Vec = new THREE.Vector3();
    const v2Vec = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let t = 0; t < this.totalTriangles; t++) {
      let v0: number, v1: number, v2: number;
      if (index) {
        v0 = index.getX(t * 3);
        v1 = index.getX(t * 3 + 1);
        v2 = index.getX(t * 3 + 2);
      } else {
        v0 = t * 3;
        v1 = t * 3 + 1;
        v2 = t * 3 + 2;
      }

      v0Vec.set(positions.getX(v0), positions.getY(v0), positions.getZ(v0));
      v1Vec.set(positions.getX(v1), positions.getY(v1), positions.getZ(v1));
      v2Vec.set(positions.getX(v2), positions.getY(v2), positions.getZ(v2));

      edge1.subVectors(v1Vec, v0Vec);
      edge2.subVectors(v2Vec, v0Vec);
      normal.crossVectors(edge1, edge2).normalize();

      this.faceNormals.push(normal.clone());
    }
  }

  /**
   * Flood fill from a starting triangle to find all connected triangles
   * that form the same "part" (separated by sharp edges)
   * 
   * @param startTriangle - The triangle index to start from
   * @param angleThreshold - Maximum angle (in degrees) between face normals
   *                         to consider two triangles as part of the same surface.
   *                         Lower = more aggressive separation (detects subtle edges)
   *                         Higher = only separates at very sharp edges
   * @returns Array of triangle indices forming the selected part
   */
  selectPart(startTriangle: number, angleThreshold: number = 45): number[] {
    if (startTriangle < 0 || startTriangle >= this.totalTriangles) {
      return [];
    }

    const thresholdRad = (angleThreshold * Math.PI) / 180;
    const selected = new Set<number>();
    const queue: number[] = [startTriangle];
    selected.add(startTriangle);

    const startNormal = this.faceNormals[startTriangle];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentNormal = this.faceNormals[current];
      const neighbors = this.adjacencyMap.get(current) || [];

      for (const neighbor of neighbors) {
        if (selected.has(neighbor)) continue;

        const neighborNormal = this.faceNormals[neighbor];
        const angle = currentNormal.angleTo(neighborNormal);

        // Only expand if the angle between faces is below threshold
        // (i.e., they're part of the same smooth surface)
        if (angle <= thresholdRad) {
          selected.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return Array.from(selected);
  }

  /**
   * Get the total number of triangles in the adjacency graph
   */
  getTriangleCount(): number {
    return this.totalTriangles;
  }

  /**
   * Check if adjacency has been built
   */
  isReady(): boolean {
    return this.geometry !== null && this.totalTriangles > 0;
  }

  /**
   * Clear adjacency data
   */
  clear(): void {
    this.adjacencyMap.clear();
    this.faceNormals = [];
    this.geometry = null;
    this.totalTriangles = 0;
  }
}
