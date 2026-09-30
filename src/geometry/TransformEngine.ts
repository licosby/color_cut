import * as THREE from 'three';

/**
 * TransformEngine - Handles 3D transformations on geometries
 * Supports mirror, rotate, scale, and translate operations
 */
export class TransformEngine {
  /**
   * Mirror geometry along an axis
   * @param geometry - Source geometry
   * @param axis - 'x', 'y', or 'z'
   * @returns New mirrored geometry
   */
  mirror(geometry: THREE.BufferGeometry, axis: 'x' | 'y' | 'z'): THREE.BufferGeometry {
    const newGeometry = geometry.clone();
    const positions = newGeometry.getAttribute('position');
    const normals = newGeometry.getAttribute('normal');

    // Mirror positions
    for (let i = 0; i < positions.count; i++) {
      if (axis === 'x') {
        positions.setX(i, -positions.getX(i));
      } else if (axis === 'y') {
        positions.setY(i, -positions.getY(i));
      } else if (axis === 'z') {
        positions.setZ(i, -positions.getZ(i));
      }
    }

    // Mirror normals
    if (normals) {
      for (let i = 0; i < normals.count; i++) {
        if (axis === 'x') {
          normals.setX(i, -normals.getX(i));
        } else if (axis === 'y') {
          normals.setY(i, -normals.getY(i));
        } else if (axis === 'z') {
          normals.setZ(i, -normals.getZ(i));
        }
      }
    }

    // Reverse face winding order to maintain correct normals
    const index = newGeometry.index;
    if (index) {
      const indices = [];
      for (let i = 0; i < index.count; i += 3) {
        indices.push(index.getX(i), index.getX(i + 2), index.getX(i + 1));
      }
      newGeometry.setIndex(indices);
    }

    newGeometry.computeVertexNormals();

    return newGeometry;
  }

  /**
   * Rotate geometry around an axis
   * @param geometry - Source geometry
   * @param axis - 'x', 'y', or 'z'
   * @param angle - Rotation angle in degrees
   * @returns New rotated geometry
   */
  rotate(geometry: THREE.BufferGeometry, axis: 'x' | 'y' | 'z', angle: number): THREE.BufferGeometry {
    const newGeometry = geometry.clone();
    const radians = (angle * Math.PI) / 180;

    const matrix = new THREE.Matrix4();
    if (axis === 'x') {
      matrix.makeRotationX(radians);
    } else if (axis === 'y') {
      matrix.makeRotationY(radians);
    } else if (axis === 'z') {
      matrix.makeRotationZ(radians);
    }

    newGeometry.applyMatrix4(matrix);

    return newGeometry;
  }

  /**
   * Scale geometry
   * @param geometry - Source geometry
   * @param scaleX - X scale factor
   * @param scaleY - Y scale factor
   * @param scaleZ - Z scale factor
   * @returns New scaled geometry
   */
  scale(
    geometry: THREE.BufferGeometry,
    scaleX: number,
    scaleY: number,
    scaleZ: number
  ): THREE.BufferGeometry {
    const newGeometry = geometry.clone();
    const matrix = new THREE.Matrix4().makeScale(scaleX, scaleY, scaleZ);
    newGeometry.applyMatrix4(matrix);

    return newGeometry;
  }

  /**
   * Translate (move) geometry
   * @param geometry - Source geometry
   * @param x - X offset
   * @param y - Y offset
   * @param z - Z offset
   * @returns New translated geometry
   */
  translate(
    geometry: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number
  ): THREE.BufferGeometry {
    const newGeometry = geometry.clone();
    const matrix = new THREE.Matrix4().makeTranslation(x, y, z);
    newGeometry.applyMatrix4(matrix);

    return newGeometry;
  }

  /**
   * Apply multiple transformations in sequence
   * @param geometry - Source geometry
   * @param transforms - Array of transform operations
   * @returns New transformed geometry
   */
  applyTransforms(
    geometry: THREE.BufferGeometry,
    transforms: Array<{
      type: 'mirror' | 'rotate' | 'scale' | 'translate';
      axis?: 'x' | 'y' | 'z';
      angle?: number;
      scaleX?: number;
      scaleY?: number;
      scaleZ?: number;
      x?: number;
      y?: number;
      z?: number;
    }>
  ): THREE.BufferGeometry {
    let result = geometry.clone();

    for (const transform of transforms) {
      switch (transform.type) {
        case 'mirror':
          if (transform.axis) {
            result = this.mirror(result, transform.axis);
          }
          break;
        case 'rotate':
          if (transform.axis && transform.angle !== undefined) {
            result = this.rotate(result, transform.axis, transform.angle);
          }
          break;
        case 'scale':
          result = this.scale(
            result,
            transform.scaleX || 1,
            transform.scaleY || 1,
            transform.scaleZ || 1
          );
          break;
        case 'translate':
          result = this.translate(
            result,
            transform.x || 0,
            transform.y || 0,
            transform.z || 0
          );
          break;
      }
    }

    return result;
  }
}
