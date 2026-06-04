/**
 * A seedable procedural noise and world generator.
 * Employs a custom 2D fractional Brownian motion (fBm) noise
 * mapped to biome configs.
 */
import { BLOCK_IDS } from '../types';

export class WorldGenerator {
  private seedHash: number;

  constructor(seed: string) {
    this.seedHash = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Simple repeatable pseudo-random 2D noise
   */
  private noise2D(x: number, z: number): number {
    const s = this.seedHash;
    const value = Math.sin(x * 0.0123 + s) * Math.cos(z * 0.0123 + s) +
                  Math.sin(x * 0.0456 - s) * Math.sin(z * 0.0321) * 0.5 +
                  Math.cos(x * 0.0023 + z * 0.0031) * 2.0;
    // Normalize roughly to [-1, 1] then shift to [0, 1]
    return (value / 3.5) + 0.5;
  }

  private fbm(x: number, z: number, octaves = 3): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return total / maxValue;
  }

  /**
   * Generates block IDs for a custom chunk at coordinates (cx, cz).
   * Size of chunk: 16x16 width/depth, 128 height.
   * Returns a flat array of size 16 * 16 * 128.
   */
  public generateChunk(cx: number, cz: number): Uint8Array {
    const width = 16;
    const depth = 16;
    const height = 128;
    const blocks = new Uint8Array(width * depth * height);

    const worldXOffset = cx * width;
    const worldZOffset = cz * depth;

    // Generate terrain base height
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const wx = worldXOffset + x;
        const wz = worldZOffset + z;

        // Custom biome mapping based on wider position sampling
        const heightNoise = this.fbm(wx, wz, 4);
        const tempNoise = this.noise2D(wx * 0.5, wz * 0.5); // moisture / warmth

        // Determine ground level
        let terrainHeight = Math.floor(10 + heightNoise * 45); // Grass valleys to high peaks
        
        // Multi-biome height modification
        let isDesert = tempNoise > 0.72;
        let isSnowy = tempNoise < 0.28 && terrainHeight > 30;

        if (isDesert) {
          terrainHeight = Math.floor(12 + heightNoise * 18); // Deserts are flatter
        }

        // Fill column
        for (let y = 0; y < height; y++) {
          const index = x + z * width + y * width * depth;

          if (y === 0) {
            blocks[index] = BLOCK_IDS.OBSIDIAN; // Bedrock barrier
          } else if (y < terrainHeight) {
            // Under ground layers
            if (y < terrainHeight - 4) {
              // Deep Stone & Ore veins
              const oreRand = Math.random();
              if (y < 15 && oreRand < 0.015) {
                blocks[index] = BLOCK_IDS.DIAMOND_ORE;
              } else if (y < 25 && oreRand < 0.025) {
                blocks[index] = BLOCK_IDS.GOLD_ORE;
              } else if (y < 35 && oreRand < 0.045) {
                blocks[index] = BLOCK_IDS.IRON_ORE;
              } else {
                blocks[index] = BLOCK_IDS.STONE;
              }
            } else {
              // Soil layers
              if (isDesert) {
                blocks[index] = BLOCK_IDS.SAND;
              } else {
                blocks[index] = BLOCK_IDS.DIRT;
              }
            }
          } else if (y === terrainHeight) {
            // Surface block
            if (isDesert) {
              blocks[index] = BLOCK_IDS.SAND;
            } else if (isSnowy) {
              blocks[index] = BLOCK_IDS.STONE; // Rocky peaks with snow
            } else {
              blocks[index] = BLOCK_IDS.GRASS;
            }
          } else {
            // Empty space or water
            if (y < 12) {
              blocks[index] = BLOCK_IDS.WATER; // Water table
            } else {
              blocks[index] = BLOCK_IDS.AIR;
            }
          }
        }

        // Randomly place trees in valleys
        if (!isDesert && terrainHeight > 14 && terrainHeight < 40) {
          const treeSeed = Math.sin(wx * 345.67 + wz * 789.12 + this.seedHash);
          if (treeSeed > 0.985) {
            // Tree trunk starting at terrainHeight + 1
            const trunkHeight = Math.floor(4 + Math.abs(treeSeed) * 3);
            for (let th = 1; th <= trunkHeight; th++) {
              const ty = terrainHeight + th;
              if (ty < height) {
                const trIdx = x + z * width + ty * width * depth;
                blocks[trIdx] = BLOCK_IDS.WOOD;
              }
            }
            // Tree leaves canopy
            const leafTop = terrainHeight + trunkHeight;
            for (let lx = -2; lx <= 2; lx++) {
              for (let lz = -2; lz <= 2; lz++) {
                for (let ly = -2; ly <= 1; ly++) {
                  const tx = x + lx;
                  const tz = z + lz;
                  const ty = leafTop + ly;
                  if (tx >= 0 && tx < width && tz >= 0 && tz < depth && ty > terrainHeight && ty < height) {
                    const lfIdx = tx + tz * width + ty * width * depth;
                    // Keep trunk logic
                    if (blocks[lfIdx] !== BLOCK_IDS.WOOD) {
                      blocks[lfIdx] = BLOCK_IDS.LEAVES;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return blocks;
  }
}
