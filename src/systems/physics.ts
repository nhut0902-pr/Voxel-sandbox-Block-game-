import * as THREE from 'three';
import { ChunkManager } from './chunkManager';
import { BLOCK_IDS, BLOCK_CONFIGS } from '../types';

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class PhysicsEngine {
  private chunkManager: ChunkManager;
  public gravity = 32.0;
  public terminalVelocity = 55.0;

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager;
  }

  private isSolidBlock(bid: number): boolean {
    if (bid === BLOCK_IDS.AIR || bid === BLOCK_IDS.WATER) return false;
    const config = BLOCK_CONFIGS[bid];
    return config?.isSolid ?? true;
  }

  /**
   * Check if a specific coordinate intersects any solid block
   */
  public getBlocksInAABB(aabb: AABB): { pos: THREE.Vector3; id: number }[] {
    const list: { pos: THREE.Vector3; id: number }[] = [];
    const minX = Math.floor(aabb.min.x);
    const maxX = Math.ceil(aabb.max.x);
    const minY = Math.floor(aabb.min.y);
    const maxY = Math.ceil(aabb.max.y);
    const minZ = Math.floor(aabb.min.z);
    const maxZ = Math.ceil(aabb.max.z);

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        for (let z = minZ; z < maxZ; z++) {
          const bid = this.chunkManager.getBlock(x, y, z);
          if (this.isSolidBlock(bid)) {
            list.push({ pos: new THREE.Vector3(x, y, z), id: bid });
          }
        }
      }
    }
    return list;
  }

  /**
   * Slides player AABB coordinates out of intersecting solid blocks.
   * This is a standard sweep axis-aligned collision resolution.
   */
  public updateEntity(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    dimensions: { width: number; height: number },
    dt: number,
    flying: boolean,
    onGroundState: { onGround: boolean }
  ): void {
    if (dt > 0.1) dt = 0.1; // Cap time step delta to prevent clipping through walls if lag spikes occurs

    // Check if swimming in water
    const currentBlockAtFeet = this.chunkManager.getBlock(
      Math.floor(pos.x),
      Math.floor(pos.y),
      Math.floor(pos.z)
    );
    const isSwimming = currentBlockAtFeet === BLOCK_IDS.WATER;

    // Apply movement dynamics
    if (!flying) {
      if (isSwimming) {
        vel.y = Math.max(-4, vel.y - this.gravity * 0.15 * dt); // Lower sink speed
      } else {
        vel.y -= this.gravity * dt;
        vel.y = Math.max(-this.terminalVelocity, vel.y);
      }
    }

    const halfW = dimensions.width / 2;
    const h = dimensions.height;

    // 1. Resolve Y axis first
    pos.y += vel.y * dt;
    let aabb: AABB = {
      min: new THREE.Vector3(pos.x - halfW, pos.y, pos.z - halfW),
      max: new THREE.Vector3(pos.x + halfW, pos.y + h, pos.z + halfW),
    };

    let blocks = this.getBlocksInAABB(aabb);
    onGroundState.onGround = false;

    for (const b of blocks) {
      // Collision detected
      if (vel.y < 0) {
        // Landing on block top
        pos.y = b.pos.y + 1;
        vel.y = 0;
        onGroundState.onGround = true;
      } else if (vel.y > 0) {
        // Hitting ceiling
        pos.y = b.pos.y - h;
        vel.y = 0;
      }
    }

    // 2. Resolve X axis
    pos.x += vel.x * dt;
    aabb = {
      min: new THREE.Vector3(pos.x - halfW, pos.y, pos.z - halfW),
      max: new THREE.Vector3(pos.x + halfW, pos.y + h, pos.z + halfW),
    };
    blocks = this.getBlocksInAABB(aabb);

    for (const b of blocks) {
      if (vel.x > 0) {
        pos.x = b.pos.x - halfW;
      } else if (vel.x < 0) {
        pos.x = b.pos.x + 1 + halfW;
      }
      vel.x = 0;
    }

    // 3. Resolve Z axis
    pos.z += vel.z * dt;
    aabb = {
      min: new THREE.Vector3(pos.x - halfW, pos.y, pos.z - halfW),
      max: new THREE.Vector3(pos.x + halfW, pos.y + h, pos.z + halfW),
    };
    blocks = this.getBlocksInAABB(aabb);

    for (const b of blocks) {
      if (vel.z > 0) {
        pos.z = b.pos.z - halfW;
      } else if (vel.z < 0) {
        pos.z = b.pos.z + 1 + halfW;
      }
      vel.z = 0;
    }

    // Safeguard ground Y index
    if (pos.y < 1) {
      pos.y = 1;
      vel.y = 0;
      onGroundState.onGround = true;
    }
  }
}
