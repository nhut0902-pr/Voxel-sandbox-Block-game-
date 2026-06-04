import * as THREE from 'three';
import { BLOCK_IDS, BLOCK_CONFIGS } from '../types';
import { WorldGenerator } from './worldGenerator';

export interface Chunk {
  cx: number;
  cz: number;
  blocks: Uint8Array;
  mesh?: THREE.Mesh | null;
  geometry?: THREE.BufferGeometry | null;
}

export class ChunkManager {
  public chunks: Map<string, Chunk> = new Map();
  private generator: WorldGenerator;
  public renderDistance = 4; // chunks radii (4x2 = 8 range looks amazing and runs very fast)
  private scene: THREE.Scene;
  private material: THREE.Material;
  private transparentMaterial: THREE.Material;

  constructor(scene: THREE.Scene, seed: string) {
    this.scene = scene;
    this.generator = new WorldGenerator(seed);

    // Setup beautiful vertex-color solid materials
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      shadowSide: THREE.FrontSide
    });

    // Special semi-transparent material for water & glass
    this.transparentMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.62,
      depthWrite: false, // Prevents Z-sorting artifacts for semi-transparent layers
    });
  }

  private getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getBlock(x: number, y: number, z: number): number {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (!chunk) return BLOCK_IDS.AIR;

    // Local coordinates
    const lx = ((x % 16) + 16) % 16;
    const lz = ((z % 16) + 16) % 16;
    if (y < 0 || y >= 128) return BLOCK_IDS.AIR;

    const index = lx + lz * 16 + y * 16 * 16;
    return chunk.blocks[index];
  }

  public setBlock(x: number, y: number, z: number, blockId: number): void {
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    const key = this.getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    
    if (chunk) {
      const lx = ((x % 16) + 16) % 16;
      const lz = ((z % 16) + 16) % 16;
      if (y >= 0 && y < 128) {
        const index = lx + lz * 16 + y * 16 * 16;
        chunk.blocks[index] = blockId;
        
        // Remesh chunk & adjacent chunks if boundary edit
        this.remeshChunk(cx, cz);
        if (lx === 0) this.remeshChunk(cx - 1, cz);
        if (lx === 15) this.remeshChunk(cx + 1, cz);
        if (lz === 0) this.remeshChunk(cx, cz - 1);
        if (lz === 15) this.remeshChunk(cx, cz + 1);
      }
    }
  }

  /**
   * Loads chunks inside the radius of current user position.
   */
  public updateLoadCenter(px: number, pz: number): boolean {
    const pcx = Math.floor(px / 16);
    const pcz = Math.floor(pz / 16);
    let changed = false;

    const keysToKeep = new Set<string>();

    // Load within radius
    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = this.getChunkKey(cx, cz);
        keysToKeep.add(key);

        if (!this.chunks.has(key)) {
          const blocks = this.generator.generateChunk(cx, cz);
          const chunk: Chunk = { cx, cz, blocks };
          this.chunks.set(key, chunk);
          this.buildChunkMesh(chunk);
          changed = true;
        }
      }
    }

    // Unload far chunks to prevent WebGL memory saturation & maintain 60 FPS
    for (const [key, chunk] of this.chunks.entries()) {
      if (!keysToKeep.has(key)) {
        if (chunk.mesh) {
          this.scene.remove(chunk.mesh);
          chunk.mesh.geometry.dispose();
        }
        this.chunks.delete(key);
        changed = true;
      }
    }

    return changed;
  }

  private remeshChunk(cx: number, cz: number): void {
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (chunk) {
      this.buildChunkMesh(chunk);
    }
  }

  /**
   * Fast face-culled voxel chunk builder
   */
  private buildChunkMesh(chunk: Chunk): void {
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.geometry?.dispose();
    }

    const { cx, cz, blocks } = chunk;
    const worldXOffset = cx * 16;
    const worldZOffset = cz * 16;

    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];

    // Temporary list for semi-transparent mesh parts (to separate water/glass drawcalls)
    const tVertices: number[] = [];
    const tIndices: number[] = [];
    const tColors: number[] = [];
    const tNormals: number[] = [];

    let vertexIdx = 0;
    let tVertexIdx = 0;

    // Helper functions for building block face components
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
    };

    const isOpaque = (bid: number) => {
      if (bid === BLOCK_IDS.AIR) return false;
      const config = BLOCK_CONFIGS[bid];
      return config ? !config.isTransparent : true;
    };

    const isSolidBlock = (bid: number) => {
      return bid !== BLOCK_IDS.AIR && bid !== BLOCK_IDS.WATER;
    };

    // Precompute directional offsets
    // UP (0,1,0), DOWN (0,-1,0), RIGHT (1,0,0), LEFT (-1,0,0), FORWARD (0,0,1), BACKWARD (0,0,-1)
    const faces = [
      { dir: [0, 1, 0], norm: [0, 1, 0], tint: 1.0, corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]] }, // Top
      { dir: [0, -1, 0], norm: [0, -1, 0], tint: 0.5, corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]] }, // Bottom
      { dir: [1, 0, 0], norm: [1, 0, 0], tint: 0.72, corners: [[1,0,1], [1,0,0], [1,1,0], [1,1,1]] }, // Right
      { dir: [-1, 0, 0], norm: [-1, 0, 0], tint: 0.72, corners: [[0,0,0], [0,0,1], [0,1,1], [0,1,0]] }, // Left
      { dir: [0, 0, 1], norm: [0, 0, 1], tint: 0.85, corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] }, // Front
      { dir: [0, 0, -1], norm: [0, 0, -1], tint: 0.85, corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] }, // Back
    ];

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y < 128; y++) {
          const index = x + z * 16 + y * 16 * 16;
          const bid = blocks[index];

          if (bid === BLOCK_IDS.AIR) continue;

          const config = BLOCK_CONFIGS[bid] || BLOCK_CONFIGS[BLOCK_IDS.STONE];
          const isTransparent = config.isTransparent;

          const wx = worldXOffset + x;
          const wz = worldZOffset + z;

          for (const f of faces) {
            const nx = x + f.dir[0];
            const ny = y + f.dir[1];
            const nz = z + f.dir[2];

            // Access neighboring block status inside or outside chunk bounds
            let neighborBid: number;
            if (nx >= 0 && nx < 16 && ny >= 0 && ny < 128 && nz >= 0 && nz < 16) {
              neighborBid = blocks[nx + nz * 16 + ny * 16 * 16];
            } else {
              neighborBid = this.getBlock(worldXOffset + nx, ny, worldZOffset + nz);
            }

            // Cull face if neighbor is fully opaque
            const showFace = !isOpaque(neighborBid) && (bid !== neighborBid);

            if (showFace) {
              // Special Grass Top/Dirt bottom coloring
              let faceColor = hexToRgb(config.color);
              if (bid === BLOCK_IDS.GRASS) {
                if (f.dir[1] === 1) {
                  // Lush Grass top
                  faceColor = [0.38, 0.65, 0.18];
                } else if (f.dir[1] === -1) {
                  // Bottom is dirt
                  faceColor = [0.52, 0.37, 0.26];
                }
              }

              // Apply face culling/lighting shadows (tint)
              const r = faceColor[0] * f.tint;
              const g = faceColor[1] * f.tint;
              const b = faceColor[2] * f.tint;

              // Diverge transparent/opaque vertices arrays
              const activeVertices = isTransparent ? tVertices : vertices;
              const activeIndices = isTransparent ? tIndices : indices;
              const activeColors = isTransparent ? tColors : colors;
              const activeNormals = isTransparent ? tNormals : normals;
              const activeIdxRef = isTransparent ? tVertexIdx : vertexIdx;

              // Add face geometric data
              for (const corner of f.corners) {
                activeVertices.push(wx + corner[0], y + corner[1], wz + corner[2]);
                activeColors.push(r, g, b);
                activeNormals.push(...f.norm);
              }

              // Triangle indexing (Two visual triangles per face block)
              activeIndices.push(
                activeIdxRef, activeIdxRef + 1, activeIdxRef + 2,
                activeIdxRef, activeIdxRef + 2, activeIdxRef + 3
              );

              if (isTransparent) {
                tVertexIdx += 4;
              } else {
                vertexIdx += 4;
              }
            }
          }
        }
      }
    }

    if (vertices.length === 0 && tVertices.length === 0) return;

    // Compile into combined container Mesh
    const activeGroup = new THREE.Group();
    activeGroup.name = `chunk_${cx}_${cz}`;

    if (vertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();

      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      activeGroup.add(mesh);
    }

    if (tVertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(tVertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(tColors, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(tNormals, 3));
      geometry.setIndex(tIndices);
      geometry.computeBoundingSphere();

      const mesh = new THREE.Mesh(geometry, this.transparentMaterial);
      activeGroup.add(mesh);
    }

    this.scene.add(activeGroup);
    chunk.mesh = activeGroup as any;
  }

  public destroy(): void {
    for (const chunk of this.chunks.values()) {
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
        // Dispose geometries
        chunk.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
      }
    }
    this.chunks.clear();
    this.material.dispose();
    this.transparentMaterial.dispose();
  }
}
