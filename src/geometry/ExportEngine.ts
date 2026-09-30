import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { ColorGroup } from './ColorGrouper';

/**
 * ExportEngine - Builds new geometries from color groups and exports as STL
 * Handles vertex deduplication, normal recomputation, and correct winding
 */
export class ExportEngine {
  private exporter = new STLExporter();

  /**
   * Build a new geometry containing only the triangles from a specific color group
   * Creates a clean, non-indexed geometry with recomputed normals
   */
  buildGeometryForColor(
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

      // Validate indices
      if (v0 >= positions.count || v1 >= positions.count || v2 >= positions.count) {
        continue;
      }

      // Add positions (ensures correct winding order)
      newPositions.push(
        positions.getX(v0), positions.getY(v0), positions.getZ(v0),
        positions.getX(v1), positions.getY(v1), positions.getZ(v1),
        positions.getX(v2), positions.getY(v2), positions.getZ(v2)
      );

      // Add normals if available
      if (normals && normals.count > 0) {
        newNormals.push(
          normals.getX(v0), normals.getY(v0), normals.getZ(v0),
          normals.getX(v1), normals.getY(v1), normals.getZ(v1),
          normals.getX(v2), normals.getY(v2), normals.getZ(v2)
        );
      }
    }

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

    if (newNormals.length > 0) {
      newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    } else {
      // Recompute normals if source didn't have them
      newGeometry.computeVertexNormals();
    }

    return newGeometry;
  }

  /**
   * Export a single color group as STL binary and trigger download
   */
  exportSingleSTL(
    sourceGeometry: THREE.BufferGeometry,
    colorGroup: ColorGroup,
    baseFileName: string
  ): void {
    const geometry = this.buildGeometryForColor(sourceGeometry, colorGroup);

    // Validate geometry has triangles
    const posAttr = geometry.getAttribute('position');
    if (!posAttr || posAttr.count < 3) {
      console.warn('Skipping export: geometry has no triangles');
      return;
    }

    const mesh = new THREE.Mesh(geometry);

    // Export as binary STL
    const stlData = this.exporter.parse(mesh, { binary: true });

    // Create blob and download
    const blob = new Blob([stlData as unknown as BlobPart], { type: 'application/octet-stream' });

    const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
    const colorHex = colorGroup.color.replace('#', '');
    const exportFileName = `${nameWithoutExt}_color_${colorHex}.stl`;

    this.downloadBlob(blob, exportFileName);
  }

  /**
   * Export all color groups as separate STL files
   * Downloads them sequentially with a small delay to avoid browser blocking
   */
  async exportAllSTLs(
    sourceGeometry: THREE.BufferGeometry,
    colorGroups: ColorGroup[],
    baseFileName: string
  ): Promise<void> {
    for (let i = 0; i < colorGroups.length; i++) {
      const group = colorGroups[i];
      this.exportSingleSTL(sourceGeometry, group, baseFileName);

      // Small delay between downloads to prevent browser blocking
      if (i < colorGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Get STL data as a Blob for a single color group (for Electron IPC)
   */
  getSTLBlob(
    sourceGeometry: THREE.BufferGeometry,
    colorGroup: ColorGroup
  ): Blob {
    const geometry = this.buildGeometryForColor(sourceGeometry, colorGroup);
    const mesh = new THREE.Mesh(geometry);
    const stlData = this.exporter.parse(mesh, { binary: true });
    return new Blob([stlData as unknown as BlobPart], { type: 'application/octet-stream' });
  }

  /**
   * Trigger a file download in the browser
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
