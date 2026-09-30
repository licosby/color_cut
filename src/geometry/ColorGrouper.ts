import * as THREE from 'three';

export interface ColorGroup {
  color: string;        // Hex color string e.g. "#ff0000"
  colorObj: THREE.Color; // Three.js color object
  triangleIndices: number[]; // Array of triangle indices (each triangle = 3 vertices)
  triangleCount: number;
  r: number;
  g: number;
  b: number;
}

/**
 * ColorGrouper - Analyzes mesh geometry and groups triangles by color
 * Supports vertex colors and material colors
 * Quantizes colors to avoid near-duplicate groups
 */
export class ColorGrouper {
  private quantizeLevel: number = 8; // Quantize to reduce near-duplicate colors

  /**
   * Analyze geometry and return color groups
   */
  groupByColor(geometry: THREE.BufferGeometry): ColorGroup[] {
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const index = geometry.index;

    // Map to store color groups: key is quantized color hex
    const colorMap = new Map<string, ColorGroup>();

    const totalTriangles = index
      ? index.count / 3
      : positions.count / 3;

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

      // Get the color for this triangle (average of vertex colors or default)
      let r: number, g: number, b: number;

      if (colors) {
        // Average the 3 vertex colors for the triangle
        r = (colors.getX(v0) + colors.getX(v1) + colors.getX(v2)) / 3;
        g = (colors.getY(v0) + colors.getY(v1) + colors.getY(v2)) / 3;
        b = (colors.getZ(v0) + colors.getZ(v1) + colors.getZ(v2)) / 3;
      } else {
        // No vertex colors - assign a default color
        r = 0.5;
        g = 0.5;
        b = 0.5;
      }

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
   * Get the quantize level (for UI adjustment)
   */
  getQuantizeLevel(): number {
    return this.quantizeLevel;
  }

  /**
   * Set quantize level and re-group
   */
  setQuantizeLevel(level: number): void {
    this.quantizeLevel = Math.max(2, Math.min(32, level));
  }
}
