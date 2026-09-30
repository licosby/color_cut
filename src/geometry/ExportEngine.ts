import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { ColorGroup } from './ColorGrouper';

/**
 * ExportEngine - Builds new geometries from color groups and exports as STL
 */
export class ExportEngine {
  private exporter = new STLExporter();

  /**
   * Build a new geometry containing only the triangles from a specific color group
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

      // Add positions
      newPositions.push(
        positions.getX(v0), positions.getY(v0), positions.getZ(v0),
        positions.getX(v1), positions.getY(v1), positions.getZ(v1),
        positions.getX(v2), positions.getY(v2), positions.getZ(v2)
      );

      // Add normals
      if (normals) {
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
      newGeometry.computeVertexNormals();
    }

    return newGeometry;
  }

  /**
   * Export a single color group as STL binary
   */
  exportSingleSTL(
    sourceGeometry: THREE.BufferGeometry,
    colorGroup: ColorGroup,
    baseFileName: string
  ): void {
    const geometry = this.buildGeometryForColor(sourceGeometry, colorGroup);
    const mesh = new THREE.Mesh(geometry);

    const stlData = this.exporter.parse(mesh, { binary: true });
    
    // Create blob and download
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
    const colorHex = colorGroup.color.replace('#', '');
    const exportFileName = `${nameWithoutExt}_${colorHex}.stl`;

    this.downloadBlob(blob, exportFileName);
    URL.revokeObjectURL(url);
  }

  /**
   * Export all color groups as separate STL files
   */
  exportAllSTLs(
    sourceGeometry: THREE.BufferGeometry,
    colorGroups: ColorGroup[],
    baseFileName: string
  ): void {
    for (const group of colorGroups) {
      this.exportSingleSTL(sourceGeometry, group, baseFileName);
    }
  }

  /**
   * Get STL data as ArrayBuffer for a single color group
   */
  getSTLData(
    sourceGeometry: THREE.BufferGeometry,
    colorGroup: ColorGroup
  ): ArrayBuffer {
    const geometry = this.buildGeometryForColor(sourceGeometry, colorGroup);
    const mesh = new THREE.Mesh(geometry);
    return this.exporter.parse(mesh, { binary: true }) as unknown as ArrayBuffer;
  }

  /**
   * Helper to trigger a file download in the browser
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
