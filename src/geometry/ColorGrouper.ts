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
  private quantizeLevel: number = 8; // Quantize to reduce near-duplicate colors

  /**
   * Analyze geometry and return color groups
   * Groups triangles by their vertex colors (averaged per triangle)
   */
  groupByColor(geometry: THREE.BufferGeometry): ColorGroup[] {
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const index = geometry.index;

    if (!positions || positions.count === 0) {
      return [];
    }

    // Calculate total triangles
    const totalTriangles = index
      ? Math.floor(index.count / 3)
      : Math.floor(positions.count / 3);

    if (totalTriangles === 0) {
      return [];
    }

    // Map to store color groups: key is quantized color hex
    const colorMap = new Map<string, ColorGroup>();

    for (let t = 0; t < totalTriangles; t++) {
      // Get the 3 vertex indices for this triangle
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

      // Validate vertex indices
      if (v0 >= positions.count || v1 >= positions.count || v2 >= positions.count) {
        continue;
      }

      // Get the color for this triangle
      let r: number, g: number, b: number;

      if (colors && colors.count > 0) {
        // Average the 3 vertex colors for the triangle
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
        // No vertex colors - assign a default color
        r = 0.5;
        g = 0.5;
        b = 0.5;
      }

      // Clamp values to valid range
      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      // Quantize color to group similar colors
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
    const groups = Array.from(colorMap.values());
    groups.sort((a, b) => b.triangleCount - a.triangleCount);

    return groups;
  }

  /**
   * Get the quantize level
   */
  getQuantizeLevel(): number {
    return this.quantizeLevel;
  }

  /**
   * Set quantize level (controls color sensitivity)
   * Higher = more groups (finer color detection)
   * Lower = fewer groups (merges similar colors)
   */
  setQuantizeLevel(level: number): void {
    this.quantizeLevel = Math.max(2, Math.min(32, level));
  }
}
