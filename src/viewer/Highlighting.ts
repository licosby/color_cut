import * as THREE from 'three';
import { ColorGroup } from '../geometry/ColorGrouper';

/**
 * Highlighting - Manages highlight meshes for color isolation
 * Creates overlay meshes for selected color groups
 */
export class Highlighting {
  private scene: THREE.Scene;
  private highlightMesh: THREE.Mesh | null = null;
  private ghostMesh: THREE.Mesh | null = null;
  private highlightGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.highlightGroup = new THREE.Group();
    this.highlightGroup.name = 'highlightGroup';
    this.scene.add(this.highlightGroup);
  }

  /**
   * Highlight specific triangles from a color group
   */
  highlightTriangles(
    sourceGeometry: THREE.BufferGeometry,
    colorGroup: ColorGroup,
    useGroupColor: boolean = true
  ): void {
    this.clearHighlight();

    // Create ghost mesh (full model, very transparent)
    const ghostGeo = sourceGeometry.clone();
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.ghostMesh.renderOrder = 0;
    this.highlightGroup.add(this.ghostMesh);

    // Create highlight mesh (only selected triangles)
    const highlightGeo = this.buildTriangleGeometry(sourceGeometry, colorGroup);
    
    const highlightColor = useGroupColor ? colorGroup.colorObj.clone() : new THREE.Color(0x4A7AFF);
    
    // Solid highlight mesh
    const highlightMat = new THREE.MeshStandardMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.4,
      emissive: highlightColor,
      emissiveIntensity: 0.3,
    });

    this.highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    this.highlightMesh.renderOrder = 1;
    this.highlightGroup.add(this.highlightMesh);

    // Add wireframe outline for better visibility
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireframeMesh = new THREE.Mesh(highlightGeo.clone(), wireframeMat);
    wireframeMesh.renderOrder = 2;
    this.highlightGroup.add(wireframeMesh);

    // Add edge outline
    const edgesGeo = new THREE.EdgesGeometry(highlightGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: highlightColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    edgesMesh.renderOrder = 3;
    this.highlightGroup.add(edgesMesh);
  }

  /**
   * Get the highlight group (for applying transforms)
   */
  getGroup(): THREE.Group {
    return this.highlightGroup;
  }

  /**
   * Remove all highlight meshes
   */
  clearHighlight(): void {
    // Remove all children from highlight group
    while (this.highlightGroup.children.length > 0) {
      const child = this.highlightGroup.children[0];
      this.highlightGroup.remove(child);
      
      // Dispose geometry and materials
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      } else if ((child as THREE.LineSegments).isLineSegments) {
        const line = child as THREE.LineSegments;
        line.geometry.dispose();
        if (line.material) {
          if (Array.isArray(line.material)) {
            line.material.forEach(m => m.dispose());
          } else {
            line.material.dispose();
          }
        }
      }
    }
    this.highlightMesh = null;
    this.ghostMesh = null;
  }

  /**
   * Check if there's an active highlight
   */
  hasHighlight(): boolean {
    return this.highlightMesh !== null;
  }

  /**
   * Build geometry containing only the specified triangles
   */
  private buildTriangleGeometry(
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

      if (v0 >= positions.count || v1 >= positions.count || v2 >= positions.count) {
        continue;
      }

      newPositions.push(
        positions.getX(v0), positions.getY(v0), positions.getZ(v0),
        positions.getX(v1), positions.getY(v1), positions.getZ(v1),
        positions.getX(v2), positions.getY(v2), positions.getZ(v2)
      );

      if (normals && normals.count > 0) {
        newNormals.push(
          normals.getX(v0), normals.getY(v0), normals.getZ(v0),
          normals.getX(v1), normals.getY(v1), normals.getZ(v1),
          normals.getX(v2), normals.getY(v2), normals.getZ(v2)
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    
    if (newNormals.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    } else {
      geometry.computeVertexNormals();
    }

    return geometry;
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.clearHighlight();
    this.scene.remove(this.highlightGroup);
  }
}
