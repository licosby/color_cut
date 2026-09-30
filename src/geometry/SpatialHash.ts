import * as THREE from 'three';

/**
 * SpatialHash - Fast spatial lookup for triangle selection
 * Uses grid-based spatial hashing for O(1) neighbor lookup
 */
export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Set<number>> = new Map();
  private positions: Float32Array | null = null;
  private index: Uint32Array | null = null;
  private triangleCount: number = 0;

  constructor(cellSize: number = 0.1) {
    this.cellSize = cellSize;
  }

  /**
   * Build spatial hash from geometry
   */
  build(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position');
    if (!positions) return;

    this.positions = positions.array as Float32Array;
    this.index = geometry.index ? geometry.index.array as Uint32Array : null;
    this.triangleCount = this.index 
      ? Math.floor(this.index.length / 3)
      : Math.floor(this.positions.length / 9);

    this.grid.clear();

    // Hash each triangle's centroid
    for (let i = 0; i < this.triangleCount; i++) {
      const centroid = this.getTriangleCentroid(i);
      const key = this.getKey(centroid.x, centroid.y, centroid.z);
      
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(i);
    }
  }

  /**
   * Get all triangles within radius of a point
   */
  getTrianglesInRadius(point: THREE.Vector3, radius: number): number[] {
    const result: number[] = [];
    const radiusSq = radius * radius;

    // Calculate cell range
    const minCell = this.getCell(point.x - radius, point.y - radius, point.z - radius);
    const maxCell = this.getCell(point.x + radius, point.y + radius, point.z + radius);

    // Check all cells in range
    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        for (let z = minCell.z; z <= maxCell.z; z++) {
          const key = `${x},${y},${z}`;
          const triangles = this.grid.get(key);
          
          if (triangles) {
            for (const triIdx of triangles) {
              const centroid = this.getTriangleCentroid(triIdx);
              const distSq = centroid.distanceToSquared(point);
              
              if (distSq <= radiusSq) {
                result.push(triIdx);
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Get triangles in a brush stroke (connected region within radius)
   */
  getBrushTriangles(startTriangle: number, radius: number, maxTriangles: number = 10000): number[] {
    const startCentroid = this.getTriangleCentroid(startTriangle);
    const candidates = this.getTrianglesInRadius(startCentroid, radius);
    
    // Sort by distance and take closest
    candidates.sort((a, b) => {
      const distA = this.getTriangleCentroid(a).distanceToSquared(startCentroid);
      const distB = this.getTriangleCentroid(b).distanceToSquared(startCentroid);
      return distA - distB;
    });

    return candidates.slice(0, maxTriangles);
  }

  private getTriangleCentroid(triIdx: number): THREE.Vector3 {
    const i = triIdx * 3;
    const v0 = this.index ? this.index[i] : i;
    const v1 = this.index ? this.index[i + 1] : i + 1;
    const v2 = this.index ? this.index[i + 2] : i + 2;

    const x = (this.positions![v0 * 3] + this.positions![v1 * 3] + this.positions![v2 * 3]) / 3;
    const y = (this.positions![v0 * 3 + 1] + this.positions![v1 * 3 + 1] + this.positions![v2 * 3 + 1]) / 3;
    const z = (this.positions![v0 * 3 + 2] + this.positions![v1 * 3 + 2] + this.positions![v2 * 3 + 2]) / 3;

    return new THREE.Vector3(x, y, z);
  }

  private getKey(x: number, y: number, z: number): string {
    const cell = this.getCell(x, y, z);
    return `${cell.x},${cell.y},${cell.z}`;
  }

  private getCell(x: number, y: number, z: number): { x: number; y: number; z: number } {
    return {
      x: Math.floor(x / this.cellSize),
      y: Math.floor(y / this.cellSize),
      z: Math.floor(z / this.cellSize),
    };
  }

  clear(): void {
    this.grid.clear();
    this.positions = null;
    this.index = null;
    this.triangleCount = 0;
  }
}
