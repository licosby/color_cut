import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';

export interface LoadedModel {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  fileName: string;
}

/**
 * ModelLoader - Handles loading STL, OBJ, GLB, and 3MF files
 * Returns a unified Three.js mesh with extracted geometry
 */
export class ModelLoader {
  private stlLoader = new STLLoader();
  private objLoader = new OBJLoader();
  private gltfLoader = new GLTFLoader();
  private threemfLoader = new ThreeMFLoader();

  /**
   * Detect file type from extension and load accordingly
   */
  async loadFile(file: File): Promise<LoadedModel> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    switch (extension) {
      case 'stl':
        return this.loadSTL(arrayBuffer, file.name);
      case 'obj':
        return this.loadOBJ(await file.text(), file.name);
      case 'glb':
      case 'gltf':
        return await this.loadGLB(arrayBuffer, file.name);
      case '3mf':
        return this.load3MF(arrayBuffer, file.name);
      default:
        throw new Error(`Unsupported file format: .${extension}`);
    }
  }

  private loadSTL(buffer: ArrayBuffer, fileName: string): LoadedModel {
    const geometry = this.stlLoader.parse(buffer);
    geometry.computeVertexNormals();

    // STL files may have vertex colors
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      vertexColors: geometry.hasAttribute('color'),
      color: geometry.hasAttribute('color') ? 0xffffff : 0x888888,
      side: THREE.DoubleSide,
    }));

    return { mesh, geometry, fileName };
  }

  private loadOBJ(text: string, fileName: string): LoadedModel {
    const group = this.objLoader.parse(text);
    let geometry = new THREE.BufferGeometry();

    // Merge all child meshes into one geometry
    const geometries: THREE.BufferGeometry[] = [];
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry.clone();
        
        // Apply material color as vertex colors if no vertex colors exist
        if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).color) {
          const color = (mesh.material as THREE.MeshStandardMaterial).color;
          const posAttr = geo.getAttribute('position');
          const colors = new Float32Array(posAttr.count * 3);
          for (let i = 0; i < posAttr.count; i++) {
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
        
        geometries.push(geo);
      }
    });

    if (geometries.length > 0) {
      geometry = this.mergeGeometries(geometries);
    }

    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    }));

    return { mesh, geometry, fileName };
  }

  private loadGLB(buffer: ArrayBuffer, fileName: string): Promise<LoadedModel> {
    // GLTFLoader.parse is synchronous for binary data
    const loader = this.gltfLoader;
    
    return new Promise((resolve, reject) => {
      loader.parse(buffer, '', (gltf) => {
        let geometry = new THREE.BufferGeometry();
        const geometries: THREE.BufferGeometry[] = [];

        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const geo = mesh.geometry.clone();
            
            // Extract material color as vertex colors
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (material && material.color && !geo.hasAttribute('color')) {
              const color = material.color;
              const posAttr = geo.getAttribute('position');
              const colors = new Float32Array(posAttr.count * 3);
              for (let i = 0; i < posAttr.count; i++) {
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
              }
              geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }
            
            geometries.push(geo);
          }
        });

        if (geometries.length > 0) {
          geometry = this.mergeGeometries(geometries);
        }

        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
          vertexColors: geometry.hasAttribute('color'),
          color: geometry.hasAttribute('color') ? 0xffffff : 0x888888,
          side: THREE.DoubleSide,
        }));

        resolve({ mesh, geometry, fileName });
      }, (error) => {
        reject(error);
      });
    });
  }

  private load3MF(buffer: ArrayBuffer, fileName: string): LoadedModel {
    const group = this.threemfLoader.parse(buffer);
    let geometry = new THREE.BufferGeometry();
    const geometries: THREE.BufferGeometry[] = [];

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geo = mesh.geometry.clone();
        
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material && material.color && !geo.hasAttribute('color')) {
          const color = material.color;
          const posAttr = geo.getAttribute('position');
          const colors = new Float32Array(posAttr.count * 3);
          for (let i = 0; i < posAttr.count; i++) {
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
        
        geometries.push(geo);
      }
    });

    if (geometries.length > 0) {
      geometry = this.mergeGeometries(geometries);
    }

    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    }));

    return { mesh, geometry, fileName };
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    // Simple merge of buffer geometries
    let totalVertices = 0;
    let totalIndices = 0;

    for (const geo of geometries) {
      totalVertices += geo.getAttribute('position').count;
      if (geo.index) {
        totalIndices += geo.index.count;
      } else {
        totalIndices += geo.getAttribute('position').count;
      }
    }

    const positions = new Float32Array(totalVertices * 3);
    const colors = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;
    let hasColors = false;

    for (const geo of geometries) {
      const pos = geo.getAttribute('position');
      const norm = geo.getAttribute('normal');
      const col = geo.getAttribute('color');

      if (col) hasColors = true;

      // Copy positions
      for (let i = 0; i < pos.count * 3; i++) {
        positions[vertexOffset * 3 + i] = (pos.array as Float32Array)[i];
      }

      // Copy normals
      if (norm) {
        for (let i = 0; i < norm.count * 3; i++) {
          normals[vertexOffset * 3 + i] = (norm.array as Float32Array)[i];
        }
      }

      // Copy colors
      if (col) {
        for (let i = 0; i < col.count * 3; i++) {
          colors[vertexOffset * 3 + i] = (col.array as Float32Array)[i];
        }
      }

      // Copy indices with offset
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices[indexOffset + i] = geo.index.array[i] + vertexOffset;
        }
        indexOffset += geo.index.count;
      } else {
        for (let i = 0; i < pos.count; i++) {
          indices[indexOffset + i] = vertexOffset + i;
        }
        indexOffset += pos.count;
      }

      vertexOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (hasColors) {
      merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    merged.setIndex(new THREE.BufferAttribute(indices, 1));

    return merged;
  }
}
