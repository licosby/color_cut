import * as THREE from 'three';

export interface ColorGroup {
  color: string;        // Hex color string e.g. "#ff0000"
  colorObj: THREE.Color; // Three.js color object
  triangleIndices: number[]; // Array of triangle indices
  triangleCount: number;
  r: number;
  g: number;
  b: number;
}

/**
 * ColorGrouper - Analyzes mesh geometry and groups triangles by color
 * Uses vertex color attributes to detect and group colors
 * Supports adjustable quantization to merge similar colors
 */
export class ColorGrouper {
  private quantizeLevel: number = 8;
  private groups: ColorGroup[] = [];
  private triangleToGroupMap: Map<number, number> = new Map();

  /**
   * Analyze geometry and return color groups
   */
  groupByColor(geometry: THREE.BufferGeometry): ColorGroup[] {
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const index = geometry.index;

    if (!positions || positions.count === 0) {
      return [];
    }

    const totalTriangles = index
      ? Math.floor(index.count / 3)
      : Math.floor(positions.count / 3);

    if (totalTriangles === 0) {
      return [];
    }

    const colorMap = new Map<string, ColorGroup>();

    for (let t = 0; t < totalTriangles; t++) {
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

      if (v0 >= positions.count || v1 >= positions.count || v2 >= positions.count) {
        continue;
      }

      let r: number, g: number, b: number;

      if (colors && colors.count > 0) {
        const c0r = colors.getX(v0);
        const c0g = colors.getY(v0);
        const c0b = colors.getZ(v0);
        const c1r = colors.getX(v1);
        const c1g = colors.getY(v1);
        const c1b = colors.getZ(v1);
        const c2r = colors.getX(v2);
        const c2g = colors.getY(v2);
        const c2b = colors.getZ(v2);

        r = (c0r + c1r + c2r) / 3;
        g = (c0g + c1g + c2g) / 3;
        b = (c0b + c1b + c2b) / 3;
      } else {
        r = 0.5;
        g = 0.5;
        b = 0.5;
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      const qr = Math.round(r * this.quantizeLevel) / this.quantizeLevel;
      const qg = Math.round(g * this.quantizeLevel) / this.quantizeLevel;
      const qb = Math.round(b * this.quantizeLevel) / this.quantizeLevel;

      const colorKey = `${qr.toFixed(3)}_${qg.toFixed(3)}_${qb.toFixed(3)}`;

      if (!colorMap.has(colorKey)) {
        const colorObj = new THREE.Color(qr, qg, qb);
        colorMap.set(colorKey, {
          color: '#' + colorObj.getHexString(),
          colorObj,
          triangleIndices: [],
          triangleCount: 0,
          r: qr,
          g: qg,
          b: qb,
        });
      }

      const group = colorMap.get(colorKey)!;
      group.triangleIndices.push(t);
      group.triangleCount++;
    }

    // Sort by triangle count (most common first)
    this.groups = Array.from(colorMap.values());
    this.groups.sort((a, b) => b.triangleCount - a.triangleCount);

    // Build triangle-to-group lookup map for fast picking
    this.buildTriangleMap();

    return this.groups;
  }

  /**
   * Find the color group that contains a specific triangle index
   * Used for click-to-select functionality
   */
  findGroupByTriangle(triangleIndex: number): ColorGroup | null {
    const groupIndex = this.triangleToGroupMap.get(triangleIndex);
    if (groupIndex !== undefined && groupIndex < this.groups.length) {
      return this.groups[groupIndex];
    }
    return null;
  }

  /**
   * Get the index of the group containing a specific triangle
   */
  findGroupIndexByTriangle(triangleIndex: number): number | null {
    const groupIndex = this.triangleToGroupMap.get(triangleIndex);
    if (groupIndex !== undefined) {
      return groupIndex;
    }
    return null;
  }

  /**
   * Build a fast lookup map from triangle index to group index
   */
  private buildTriangleMap(): void {
    this.triangleToGroupMap.clear();
    
    for (let groupIdx = 0; groupIdx < this.groups.length; groupIdx++) {
      const group = this.groups[groupIdx];
      for (const triIdx of group.triangleIndices) {
        this.triangleToGroupMap.set(triIdx, groupIdx);
      }
    }
  }

  /**
   * Get all groups
   */
  getGroups(): ColorGroup[] {
    return this.groups;
  }

  /**
   * Get the quantize level
   */
  getQuantizeLevel(): number {
    return this.quantizeLevel;
  }

  /**
   * Set quantize level
   */
  setQuantizeLevel(level: number): void {
    this.quantizeLevel = Math.max(2, Math.min(32, level));
  }
}
