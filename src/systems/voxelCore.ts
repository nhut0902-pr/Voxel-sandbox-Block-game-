import * as THREE from 'three';

/* ─── Global Constants ─── */
export const CW = 16;
export const CH = 128;

/* ─── Block & Item Databases ─── */
export interface BlockDef {
  n: string;
  s: number;
  c: number;
  top?: number;
  side?: number;
  tr?: number; // transparent
  e?: string;  // emoji
}

export const BLK: Record<number, BlockDef> = {
  0: { n: 'air', s: 0, c: 0, e: '' },
  1: { n: 'grass', s: 1, c: 0x6abf4b, top: 0x5bb33c, side: 0x6abf4b, e: '🌿' },
  2: { n: 'dirt', s: 1, c: 0x8a5a3c, e: '🟫' },
  3: { n: 'stone', s: 1, c: 0x8a8d96, e: '🪨' },
  4: { n: 'sand', s: 1, c: 0xe8d59a, e: '🏖️' },
  5: { n: 'water', s: 0, tr: 1, c: 0x3a78d6, e: '💧' },
  6: { n: 'wood', s: 1, c: 0x6b4a2b, top: 0x8a6a3b, e: '🪵' },
  7: { n: 'leaves', s: 1, tr: 1, c: 0x3d8a3a, e: '🍃' },
  8: { n: 'snow', s: 1, c: 0xf2f7ff, e: '❄️' },
  9: { n: 'ice', s: 1, tr: 1, c: 0xa9d8ff, e: '🧊' },
  10: { n: 'glass', s: 1, tr: 1, c: 0xcde6ff, e: '🔵' },
  11: { n: 'obsidian', s: 1, c: 0x231632, e: '⬛' },
  12: { n: 'cherry', s: 1, c: 0xf3a7c8, e: '🌸' },
  13: { n: 'lava', s: 0, tr: 1, c: 0xff3700, e: '🔥' },
  14: { n: 'gold ore', s: 1, c: 0xd9b441, e: '🥇' },
  15: { n: 'diamond', s: 1, c: 0x5be0d2, e: '💎' },
  16: { n: 'brick', s: 1, c: 0xb34a3c, e: '🧱' },
  17: { n: 'planks', s: 1, c: 0xc4903d, e: '🪟' },
  18: { n: 'treasure chest', s: 1, c: 0xd9a741, e: '🎁' },
  19: { n: 'gold key block', s: 1, c: 0xffd700, e: '🔑' },
  20: { n: 'bẫy chông gai', s: 1, c: 0x475569, side: 0x64748b, top: 0x94a3b8, e: '📌' },
  21: { n: 'khối phun lửa', s: 1, c: 0xf97316, side: 0xea580c, top: 0xef4444, e: '🔥' },
};

export const BL = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export interface ItemDef {
  id: string;
  n: string;
  e: string;
  dmg?: number;
  def?: number;
  spd?: number;
  hg?: number;
  hl?: number;
  fly?: boolean;
  range?: number;
  t: 'weapon' | 'tool' | 'armor' | 'food' | 'potion' | 'special';
}

export const ITM: Record<string, ItemDef> = {
  sw1: { id: 'sw1', n: 'Kiếm Gỗ', e: '🗡️', dmg: 3, t: 'weapon' },
  sw2: { id: 'sw2', n: 'Kiếm Đá', e: '⚔️', dmg: 5, t: 'weapon' },
  knife: { id: 'knife', n: 'Dao Thép', e: '🔪', dmg: 6, t: 'weapon' },
  sw3: { id: 'sw3', n: 'Kiếm Vàng', e: '🔱', dmg: 7, t: 'weapon' },
  sw4: { id: 'sw4', n: 'Kiếm KCương', e: '💎⚔️', dmg: 10, t: 'weapon' },
  pistol: { id: 'pistol', n: 'Súng Lục 🔫', e: '🔫', dmg: 14, range: 15, t: 'weapon' },
  rifle: { id: 'rifle', n: 'Súng Trường ︻╦╤─', e: '🔫︻╦╤─', dmg: 22, range: 25, t: 'weapon' },
  laser: { id: 'laser', n: 'Súng Laser Đột Phá', e: '☄️🔫', dmg: 35, range: 20, t: 'weapon' },
  sniper: { id: 'sniper', n: 'Súng Bắn Xa', e: '🔭', dmg: 30, range: 40, t: 'weapon' },
  rocket: { id: 'rocket', n: 'Súng Tên Lửa', e: '🚀', dmg: 50, range: 60, t: 'weapon' },
  artillery: { id: 'artillery', n: 'Súng Pháo', e: '☄️', dmg: 80, range: 100, t: 'weapon' },
  spam: { id: 'spam', n: 'Súng Spam Nổ', e: '💥', dmg: 150, range: 9999, t: 'weapon' },
  axe: { id: 'axe', n: 'Rìu', e: '🪓', dmg: 4, t: 'tool' },
  pick: { id: 'pick', n: 'Cuốc', e: '⛏️', dmg: 2, t: 'tool' },
  shield: { id: 'shield', n: 'Khiên', e: '🛡️', def: 3, t: 'armor' },
  helm: { id: 'helm', n: 'Nón', e: '⛑️', def: 2, t: 'armor' },
  boots: { id: 'boots', n: 'Bốt', e: '👟', spd: 2, t: 'armor' },
  scuba: { id: 'scuba', n: 'Mũ Lặn Ô-xy', e: '🤿', def: 1, t: 'armor' },
  fireproof: { id: 'fireproof', n: 'Giáp Chống Lửa', e: '🧑‍🚒', def: 1, t: 'armor' },
  bread: { id: 'bread', n: 'Bánh Mì', e: '🍞', hg: 4, t: 'food' },
  apple: { id: 'apple', n: 'Táo', e: '🍎', hg: 3, hl: 2, t: 'food' },
  meat: { id: 'meat', n: 'Thịt', e: '🍖', hg: 6, hl: 3, t: 'food' },
  pot_hp: { id: 'pot_hp', n: 'Thuốc HP', e: '🧪', hl: 10, t: 'potion' },
  pot_hp_big: { id: 'pot_hp_big', n: 'Bình Máu Lớn', e: '💖🧪', hl: 30, t: 'potion' },
  pot_spd: { id: 'pot_spd', n: 'Thuốc Tốc', e: '⚗️', spd: 5, t: 'potion' },
  pot_dmg: { id: 'pot_dmg', n: 'Thuốc Sức Mạnh', e: '💥🧪', dmg: 5, t: 'potion' },
  wings: { id: 'wings', n: 'Cánh', e: '🪽', fly: true, t: 'special' },
  key: { id: 'key', n: 'Chìa khóa vàng', e: '🔑', t: 'special' },
  tesla: { id: 'tesla', n: 'Súng Tesla Sấm Sét', e: '⚡🔫', dmg: 50, t: 'weapon' },
  doom: { id: 'doom', n: 'Rìu Diệt Vong Thần Thoại', e: '🪓🔥', dmg: 40, t: 'weapon' },
  plat_shield: { id: 'plat_shield', n: 'Khiên Vệ Thần Thượng Cổ', e: '🛡️✨', def: 8, t: 'armor' },
};

export interface ShopItem {
  id: string;
  p: number;
}

export const SHOP: Record<string, ShopItem[]> = {
  weapons: [
    { id: 'sw1', p: 10 },
    { id: 'sw2', p: 30 },
    { id: 'knife', p: 50 },
    { id: 'sw3', p: 80 },
    { id: 'sw4', p: 150 },
    { id: 'pistol', p: 200 },
    { id: 'rifle', p: 350 },
    { id: 'laser', p: 600 },
    { id: 'sniper', p: 800 },
    { id: 'rocket', p: 1200 },
    { id: 'artillery', p: 2000 },
    { id: 'spam', p: 5000 }
  ],
  tools: [{ id: 'axe', p: 20 }, { id: 'pick', p: 25 }],
  food: [{ id: 'bread', p: 8 }, { id: 'apple', p: 6 }, { id: 'meat', p: 15 }, { id: 'pot_hp', p: 25 }, { id: 'pot_hp_big', p: 60 }, { id: 'pot_spd', p: 35 }, { id: 'pot_dmg', p: 50 }],
  special: [{ id: 'shield', p: 60 }, { id: 'helm', p: 70 }, { id: 'boots', p: 55 }, { id: 'wings', p: 300 }, { id: 'scuba', p: 120 }, { id: 'fireproof', p: 160 }],
};

/* ─── Math Utilities ─── */
export function sh(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function mb(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function dk(hex: number, f: number): number {
  return (Math.floor(((hex >> 16) & 255) * f) << 16) | (Math.floor(((hex >> 8) & 255) * f) << 8) | Math.floor((hex & 255) * f);
}

/* ─── Noise Generator Class ─── */
export class Noise {
  rng: () => number;
  p: Uint8Array;

  constructor(s: string) {
    this.rng = mb(sh(s));
    this.p = new Uint8Array(512);
    const q = new Uint8Array(256);
    for (let i = 0; i < 256; i++) q[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = ~~(this.rng() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = q[i & 255];
  }

  _g(h: number, x: number, y: number): number {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return x - y;
      case 2: return -x + y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  }

  n2(x: number, y: number): number {
    const X = ~~x & 255;
    const Y = ~~y & 255;
    const xf = x - ~~x;
    const yf = y - ~~y;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];
    return lerp(lerp(this._g(aa, xf, yf), this._g(ba, xf - 1, yf), u), lerp(this._g(ab, xf, yf - 1), this._g(bb, xf - 1, yf - 1), u), v);
  }

  fbm(x: number, y: number, o = 4, l = 2, g = 0.5): number {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < o; i++) {
      s += this.n2(x * f, y * f) * a;
      n += a;
      a *= g;
      f *= l;
    }
    return s / n;
  }
}

/* ─── Device Performance Tiering ─── */
export const Dev = {
  mob: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
  cores: navigator.hardwareConcurrency || 4,
  mem: (navigator as any).deviceMemory || 4,
  tier(): 'low' | 'mid' | 'high' {
    return (this.mob && this.mem <= 2) ? 'low' : (this.mob && this.mem <= 4) ? 'mid' : (!this.mob && this.cores >= 8) ? 'high' : 'mid';
  },
  rd(): number {
    return this.tier() === 'low' ? 4 : this.tier() === 'mid' ? 6 : 9;
  }
};

/* ─── Procedural World Generator Class ─── */
export class WGen {
  seed: string;
  biome: string;
  n1: Noise;
  n2: Noise;
  SEA: number;

  constructor(seed: string, biome: string) {
    this.seed = seed;
    this.biome = biome;
    this.n1 = new Noise(seed);
    this.n2 = new Noise(seed + 'c');
    this.SEA = 30;
  }

  h(wx: number, wz: number): number {
    // Near spawn safe beach island zone
    const distToSpawn = Math.max(Math.abs(wx - 8), Math.abs(wz - 8));
    if (distToSpawn < 12) {
      if (this.biome === 'treasure_ocean') return 33; // High spawn island above sea level 30
      if (this.biome === 'treasure_lava') return 33;  // Safe oasis above lava sea level 30
    }

    const b = this.n1.fbm(wx * 0.012, wz * 0.012, 5, 2, 0.5);
    const m = Math.max(0, this.n1.fbm(wx * 0.003, wz * 0.003, 3) - 0.2) * 60;
    let h = 32 + b * 14 + m;
    if (this.biome === 'desert') h = 30 + b * 6;
    if (this.biome === 'snow') h = 40 + b * 20 + m;
    if (this.biome === 'volcano') h = 36 + b * 22 + m * 1.5;
    if (this.biome === 'treasure_lava') h = 34 + b * 20 + m * 1.2;
    if (this.biome === 'treasure_ocean') h = 10 + b * 8; // Deep seabed
    return Math.max(8, Math.min(120, ~~h));
  }

  blk(wx: number, wy: number, wz: number): number {
    const h = this.h(wx, wz);
    if (wy < h - 2) {
      const cv = this.n2.fbm(wx * 0.05, wz * 0.05 + wy * 0.08, 3);
      if (cv > 0.55 && wy > 4 && wy < h - 3) return 0; // Cave
    }
    if (wy > h) return wy <= this.SEA ? (this.biome === 'treasure_lava' ? 13 : 5) : 0; // Lava instead of water!
    if (wy === h) {
      if (this.biome === 'desert') return 4;
      if (this.biome === 'snow') return 8;
      if (this.biome === 'volcano') return wy > 50 ? 11 : 3;
      if (this.biome === 'treasure_lava') return wy > 45 ? 11 : 3; // Obsidian spikes
      if (this.biome === 'treasure_ocean') return 4; // Sandy seabed floor
      return wy <= this.SEA + 1 ? 4 : 1;
    }
    if (wy > h - 4) {
      if (this.biome === 'desert') return 4;
      if (this.biome === 'treasure_lava') return 11;
      if (this.biome === 'treasure_ocean') return 4; // Sand core
      return 2;
    }
    if (wy < 12 && this.n2.n2(wx * 0.3, wz * 0.3 + wy * 0.2) > 0.55) return 15; // Diamond Ore
    if (wy < 24 && this.n2.n2(wx * 0.25 + wy * 0.1, wz * 0.25) > 0.5) return 14; // Gold Ore
    if (wy < 3) return 11; // Obsidian core floor
    return 3; // Stone
  }

  isTree(wx: number, wz: number): boolean {
    if (['desert', 'snow', 'volcano', 'treasure_lava', 'treasure_ocean'].includes(this.biome)) return false;
    const r = Math.sin(wx * 12.9898 + wz * 78.233 + sh(this.seed)) * 43758.5453;
    return (r - ~~r) > 0.985;
  }
}

/* ─── Voxel Chunk Storage Class ─── */
export class Chunk {
  cx: number;
  cz: number;
  data: Uint8Array;
  mesh: THREE.Mesh | null;
  tm: THREE.Mesh | null; // Transparent mesh
  dirty: boolean;
  gen: boolean;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.data = new Uint8Array(CW * CW * CH);
    this.mesh = null;
    this.tm = null;
    this.dirty = true;
    this.gen = false;
  }

  get(x: number, y: number, z: number): number {
    if (x < 0 || x >= CW || z < 0 || z >= CW || y < 0 || y >= CH) return 0;
    return this.data[(y * CW + z) * CW + x];
  }

  set(x: number, y: number, z: number, v: number): void {
    if (x < 0 || x >= CW || z < 0 || z >= CW || y < 0 || y >= CH) return;
    this.data[(y * CW + z) * CW + x] = v;
    this.dirty = true;
  }
}

/* ─── Voxel Chunk Manager Class ─── */
export class CM {
  scene: THREE.Scene;
  wg: WGen;
  map: Map<string, Chunk>;
  mat: THREE.MeshLambertMaterial;
  tmat: THREE.MeshLambertMaterial;
  mods: Record<string, Record<string, number>>;

  constructor(scene: THREE.Scene, wg: WGen) {
    this.scene = scene;
    this.wg = wg;
    this.map = new Map();
    this.mods = {};
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.tmat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false });
  }

  key(cx: number, cz: number): string {
    return cx + ',' + cz;
  }

  gc(cx: number, cz: number): Chunk {
    const k = this.key(cx, cz);
    let c = this.map.get(k);
    if (!c) {
      c = new Chunk(cx, cz);
      this.map.set(k, c);
    }
    return c;
  }

  gen(ck: Chunk): void {
    if (ck.gen) return;
    const { cx, cz } = ck, wg = this.wg;
    for (let x = 0; x < CW; x++) {
      for (let z = 0; z < CW; z++) {
        const wx = cx * CW + x, wz = cz * CW + z, h = wg.h(wx, wz);
        for (let y = 0; y <= Math.min(CH - 1, Math.max(h, wg.SEA)); y++) {
          ck.set(x, y, z, wg.blk(wx, y, wz));
        }
        if (wg.isTree(wx, wz) && h > wg.SEA && h < CH - 10) {
          const th = 4 + ~~(Math.abs(Math.sin(wx * 0.7 + wz * 1.3)) * 3);
          const lt = wg.biome === 'cherry' ? 12 : 7; // Cherry or standard leaves
          for (let i = 1; i <= th; i++) ck.set(x, h + i, z, 6); // Trunks
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              for (let dy = th - 1; dy <= th + 2; dy++) {
                if (dx === 0 && dz === 0 && dy <= th) continue;
                if (Math.abs(dx) + Math.abs(dz) > 3) continue;
                const lx = x + dx, lz2 = z + dz, ly = h + dy;
                if (lx >= 0 && lx < CW && lz2 >= 0 && lz2 < CW && ly < CH && ck.get(lx, ly, lz2) === 0) {
                  ck.set(lx, ly, lz2, lt);
                }
              }
            }
          }
        }

        // Spawning chests & keys on dry ground
        const isTreasureBiome = wg.biome === 'treasure_lava' || wg.biome === 'treasure_ocean';
        if (h > wg.SEA && h < CH - 4 && !isTreasureBiome) {
          const valSeed = wx * 31.415 + wz * 17.89 + sh(wg.seed);
          const pseudoR = (Math.sin(valSeed) * 43758.5453) % 1;
          const absR = Math.abs(pseudoR);
          
          // Ensure we don't spawn onto a tree trunk or leaves
          if (ck.get(x, h + 1, z) === 0) {
            // (Removed random block chests and keys)
          }
        }

        // ─── Procedural Landmark Shrines & Palace ───
        // We generate these epic land architecture elements in ALL worlds so players have fantastic landmarks!
        const distA1X = Math.abs(wx - (-150)), distA1Z = Math.abs(wz - 150);
        const distA2X = Math.abs(wx - 150), distA2Z = Math.abs(wz - (-150));
        const distA3X = Math.abs(wx - (-200)), distA3Z = Math.abs(wz - (-200));
        
        let nearAltar = false;
        let ax = 0, az = 0;
        let distAX = 999, distAZ = 999;
        
        if (distA1X <= 4 && distA1Z <= 4) { nearAltar = true; ax = -150; az = 150; distAX = distA1X; distAZ = distA1Z; }
        else if (distA2X <= 4 && distA2Z <= 4) { nearAltar = true; ax = 150; az = -150; distAX = distA2X; distAZ = distA2Z; }
        else if (distA3X <= 4 && distA3Z <= 4) { nearAltar = true; ax = -200; az = -200; distAX = distA3X; distAZ = distA3Z; }

        if (nearAltar) {
          // Clear natural dirt/rocks upwards
          for (let ly = h + 1; ly < CH; ly++) {
            ck.set(x, ly, z, 0); // Air
          }
          
          const maxTowerY = Math.max(h + 10, 35);

          // ─── 5x5 Stepped Base at Y = h+1 ───
          if (distAX <= 2 && distAZ <= 2) {
            ck.set(x, h + 1, z, 16); // Brick base
          }
          // ─── 3x3 Stepped Center at Y = h+2 ───
          if (distAX <= 1 && distAZ <= 1) {
            ck.set(x, h + 2, z, 11); // Obsidian center
          }
          
          // ─── Tower Shaft ───
          // Clean central 1x1 obsidian core up to maxTowerY
          if (wx === ax && wz === az) {
            for (let ly = h + 1; ly <= maxTowerY; ly++) {
              ck.set(x, ly, z, 11); // Solid Obsidian Column
            }
            ck.set(x, maxTowerY + 1, z, 12); // Gold Ore Altar Block (Cap)!
          }
          
          // Decorative corner towers around the base
          if (distAX === 2 && distAZ === 2) {
            for (let ly = h + 1; ly <= h + 5; ly++) {
              ck.set(x, ly, z, 14); // Glowing Gold Ore pillars at the 4 corners of the base!
            }
          }
          
          // ─── Spiral Climbing Stairs ───
          // Spiral staircase winding around the central core to let players reach the key easily
          const stepsCount = maxTowerY - (h + 3);
          if (stepsCount > 0) {
            for (let dy = 1; dy <= stepsCount; dy++) {
              const ang = dy * 0.7; // stable spiral turn coefficient
              const u = Math.round(Math.cos(ang) * 1.4);
              const v = Math.round(Math.sin(ang) * 1.4);
              if (wx === ax + u && wz === az + v) {
                const stepY = h + 2 + dy;
                // Place solid brick steps and supporting column underneath
                for (let sy = h + 1; sy <= stepY; sy++) {
                  ck.set(x, sy, z, 16); // Brick supports & steps
                }
              }
            }
          }
        }

        // ─── Massive 33x33 Obsidian & Brick Medieval Castle Palace ───
        const distChestX = Math.abs(wx - 300);
        const distChestZ = Math.abs(wz - 300);
        
        if (distChestX <= 16 && distChestZ <= 16) {
          // Clear all space to open the field for the grand palace (from depth Y=12 up to sky Y=CH-1)
          for (let ly = 12; ly < CH; ly++) {
            ck.set(x, ly, z, 0); // Air
          }
          
          // ─── Floors ───
          // Foundation floor at Y=12
          ck.set(x, 12, z, 11); // Obsidian solid bedrock foundation
          
          // Checkered grand palace hall floor at Y=15
          if (distChestX <= 15 && distChestZ <= 15) {
            const isCheckered = (wx + wz) % 2 === 0;
            ck.set(x, 15, z, isCheckered ? 11 : 16); // Checkered Obsidian & Brick floor
          }
          
          // Solid foundation under the checkered floor
          if (distChestX <= 15 && distChestZ <= 15) {
            ck.set(x, 13, z, 11);
            ck.set(x, 14, z, 11);
          }
          
          // ─── Giant Outer Castle Walls ───
          if (distChestX === 15 || distChestZ === 15) {
            // Build walls up to Y=45 to meet the roof
            const isPillar = (wx % 4 === 0 || wz % 4 === 0);
            for (let ly = 15; ly <= 45; ly++) {
              ck.set(x, ly, z, isPillar ? 16 : 11); // Checkered Brick buttresses on Obsidian wall
            }
            
            // Wall Crenellations / Battlements at Y=46
            if ((wx + wz) % 2 === 0) {
              ck.set(x, 46, z, 11); // Obsidian battlement blocks
            }
          }
          
          // ─── Flat Enclosed Roof at Y=45 ───
          if (distChestX <= 14 && distChestZ <= 14) {
             ck.set(x, 45, z, 11); // Obsidian Flat Impenetrable Roof
          }
          
          // ─── Four Massive Corner Watchtowers (5x5 thick) ───
          const isNW = (wx >= 285 && wx <= 289 && wz >= 285 && wz <= 289);
          const isNE = (wx >= 311 && wx <= 315 && wz >= 285 && wz <= 289);
          const isSW = (wx >= 285 && wx <= 289 && wz >= 311 && wz <= 315);
          const isSE = (wx >= 311 && wx <= 315 && wz >= 311 && wz <= 315);
          
          if (isNW || isNE || isSW || isSE) {
            // Corner towers rise much higher (up to Y=55)
            for (let ly = 15; ly <= 55; ly++) {
              const isOuterShell = (wx === 285 || wx === 289 || wx === 311 || wx === 315 || 
                                    wz === 285 || wz === 289 || wz === 311 || wz === 315);
              ck.set(x, ly, z, isOuterShell ? 14 : 11); // Gold Ore outer lining with Obsidian core
            }
            
            // Peak Golden Spires on towers at Y=56 to 58
            const tx = isNW ? 287 : (isNE ? 313 : (isSW ? 287 : 313));
            const tz = isNW ? 287 : (isNE ? 287 : (isSW ? 313 : 313));
            if (wx === tx && wz === tz) {
              ck.set(x, 56, z, 14);
              ck.set(x, 57, z, 14);
              ck.set(x, 58, z, 12); // Gold ore tip
            }
          }
          
          // ─── Arching Grand Pillars (Inside Hall) ───
          const isPillarPos = (
            (wx === 293 && wz === 293) ||
            (wx === 307 && wz === 293) ||
            (wx === 293 && wz === 307) ||
            (wx === 307 && wz === 307)
          );
          if (isPillarPos) {
            for (let ly = 15; ly <= 44; ly++) {
              const isBand = (ly === 17 || ly === 24 || ly === 30 || ly === 36);
              ck.set(x, ly, z, isBand ? 14 : 11); // Gold-banded Obsidian columns
            }
          }
          
          // ─── Grand Gateway Arched Portcullis (South interface face wz=315) ───
          if (wz === 315 && distChestX <= 3) {
            // Dig out entry-way tunnel through the outer wall
            for (let ly = 16; ly <= 25; ly++) {
              ck.set(x, ly, z, 0); // Air passage
            }
          }
          
          // ─── Grand Entrance Staircase ───
          // Symmetrical slope downwards from wz=316 to 327
          if (wz >= 316 && wz <= 327 && distChestX <= 3) {
            const stairY = 15 - Math.floor((wz - 316) / 1.5); // smooth slope
            for (let ly = 12; ly <= stairY; ly++) {
              ck.set(x, ly, z, 16); // Brick staircase
            }
          }
          
          // ─── Central Sacred Treasure Altar ───
          // Centered around (115, 115) of the checkered hall
          if (distChestX <= 3 && distChestZ <= 3) {
            // First tier (Y=16): 7x7 diamond plate
            if (distChestX <= 3 && distChestZ <= 3) {
              ck.set(x, 16, z, 15); // Diamond blocks
            }
            // Second tier (Y=17): 5x5 gold block base
            if (distChestX <= 2 && distChestZ <= 2) {
              ck.set(x, 17, z, 14); // Gold Ore blocks
            }
            // Third tier (Y=18): 3x3 obsidian column
            if (distChestX <= 1 && distChestZ <= 1) {
              ck.set(x, 18, z, 11); // Obsidian pedestal base
            }
            
            // Finally: place the legendary chest at (300, 19, 300)
            if (wx === 300 && wz === 300) {
              ck.set(x, 19, z, 18); // Block 18: Legendary Treasure Chest!
            }
          }
        }
      }
    }
    
    // Apply mods AFTER standard generation
    const cm = this.mods[this.key(cx, cz)];
    if (cm) {
      for (const key in cm) {
        const [lx, ly, lz] = key.split(',').map(Number);
        ck.set(lx, ly, lz, cm[key]);
      }
    }

    ck.gen = true;
  }

  bld(ck: Chunk): void {
    const { cx, cz } = ck;
    const P: number[] = [], N: number[] = [], C: number[] = [], I: number[] = [];
    const PT: number[] = [], NT: number[] = [], CT: number[] = [], IT: number[] = [];
    let vi = 0, vt = 0;

    const gb = (lx: number, ly: number, lz: number): number => {
      if (ly < 0 || ly >= CH) return 0;
      let dx2 = cx, dz2 = cz, ax = lx, az = lz;
      if (lx < 0) { dx2--; ax = CW - 1; }
      else if (lx >= CW) { dx2++; ax = 0; }
      if (lz < 0) { dz2--; az = CW - 1; }
      else if (lz >= CW) { dz2++; az = 0; }
      if (dx2 === cx && dz2 === cz) return ck.data[(ly * CW + lz) * CW + lx];
      const n = this.map.get(this.key(dx2, dz2));
      return (!n || !n.gen) ? 0 : n.data[(ly * CW + az) * CW + ax];
    };

    const F = [
      { d: [0, 1, 0], n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], f: 't' },
      { d: [0, -1, 0], n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], f: 'b' },
      { d: [1, 0, 0], n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], f: 's' },
      { d: [-1, 0, 0], n: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], f: 's' },
      { d: [0, 0, 1], n: [0, 0, 1], v: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], f: 's' },
      { d: [0, 0, -1], n: [0, 0, -1], v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], f: 's' }
    ];

    for (let x = 0; x < CW; x++) {
      for (let z = 0; z < CW; z++) {
        for (let y = 0; y < CH; y++) {
          const b = ck.data[(y * CW + z) * CW + x];
          if (!b) continue;
          const def = BLK[b];
          if (!def) continue;
          const iT = !!def.tr;
          for (const fc of F) {
            const nb = gb(x + fc.d[0], y + fc.d[1], z + fc.d[2]);
            if (nb) {
              const nd = BLK[nb];
              if (nd && !nd.tr) continue; // Hidden solid face
              if (nb === b) continue; // Face internal to block group
            }
            let col = def.c;
            if (fc.f === 't' && def.top != null) col = def.top;
            if (fc.f === 's' && def.side != null) col = def.side;
            if (fc.f === 'b') col = dk(col, 0.6);
            else if (fc.f === 's') col = dk(col, 0.85);

            const r = ((col >> 16) & 255) / 255;
            const g = ((col >> 8) & 255) / 255;
            const bl = (col & 255) / 255;

            const ap = iT ? PT : P;
            const an = iT ? NT : N;
            const ac = iT ? CT : C;
            const ai = iT ? IT : I;
            const base = iT ? vt : vi;

            for (const vv of fc.v) {
              ap.push(x + vv[0], y + vv[1], z + vv[2]);
              an.push(fc.n[0], fc.n[1], fc.n[2]);
              ac.push(r, g, bl);
            }
            ai.push(base, base + 1, base + 2, base, base + 2, base + 3);
            if (iT) vt += 4; else vi += 4;
          }
        }
      }
    }

    if (ck.mesh) { this.scene.remove(ck.mesh); ck.mesh.geometry.dispose(); }
    if (ck.tm) { this.scene.remove(ck.tm); ck.tm.geometry.dispose(); }

    const mk = (pos: number[], nor: number[], col: number[], idx: number[], mat: THREE.Material): THREE.Mesh | null => {
      if (!pos.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      m.position.set(cx * CW, 0, cz * CW);
      m.frustumCulled = true;
      this.scene.add(m);
      return m;
    };

    ck.mesh = mk(P, N, C, I, this.mat);
    ck.tm = mk(PT, NT, CT, IT, this.tmat);
    ck.dirty = false;
  }

  upd(px: number, pz: number, dist: number): void {
    const cx = ~~(px / CW);
    const pz_i = ~~(pz / CW);
    for (let dx = -dist; dx <= dist; dx++) {
      for (let dz = -dist; dz <= dist; dz++) {
        const c = this.gc(cx + dx, pz_i + dz);
        if (!c.gen) this.gen(c);
      }
    }
    let b = 0;
    for (let dx = -dist; dx <= dist; dx++) {
      for (let dz = -dist; dz <= dist; dz++) {
        const c = this.map.get(this.key(cx + dx, pz_i + dz));
        if (c && c.dirty && b < 2) {
          this.bld(c);
          b++;
        }
      }
    }
    for (const [k, c] of this.map) {
      if (Math.abs(c.cx - cx) > dist + 1 || Math.abs(c.cz - pz_i) > dist + 1) {
        if (c.mesh) { this.scene.remove(c.mesh); c.mesh.geometry.dispose(); }
        if (c.tm) { this.scene.remove(c.tm); c.tm.geometry.dispose(); }
        this.map.delete(k);
      }
    }
  }

  wGet(wx: number, wy: number, wz: number): number {
    if (wy < 0 || wy >= CH) return 0;
    const c = this.map.get(this.key(Math.floor(wx / CW), Math.floor(wz / CW)));
    return c ? c.get(((wx % CW) + CW) % CW, wy, ((wz % CW) + CW) % CW) : 0;
  }

  wSet(wx: number, wy: number, wz: number, v: number): void {
    if (wy < 0 || wy >= CH) return;
    const cx = Math.floor(wx / CW);
    const cz = Math.floor(wz / CW);
    const k = this.key(cx, cz);
    if (!this.mods[k]) this.mods[k] = {};
    const lx = ((wx % CW) + CW) % CW;
    const lz2 = ((wz % CW) + CW) % CW;
    this.mods[k][`${lx},${wy},${lz2}`] = v;
    const c = this.gc(cx, cz);
    c.set(lx, wy, lz2, v);

    const mk = (x: number, z: number) => {
      const n = this.map.get(this.key(x, z));
      if (n) n.dirty = true;
    };
    if (lx === 0) mk(cx - 1, cz);
    if (lx === CW - 1) mk(cx + 1, cz);
    if (lz2 === 0) mk(cx, cz - 1);
    if (lz2 === CW - 1) mk(cx, cz + 1);
  }

  cnt(): number {
    return this.map.size;
  }
}

/* ─── Player Entity Class ─── */
export class Player {
  cam: THREE.PerspectiveCamera;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  onG: boolean;
  fly: boolean;
  spd: number;
  fspd: number;
  eyeH: number;
  r: number;
  h: number;
  yaw: number;
  pitch: number;
  hp: number;
  mhp: number;
  hunger: number;
  xp: number;
  lv: number;
  gold: number;
  kills: number;
  dead: boolean;
  def: number;
  spdB: number;
  dmgB: number = 0;
  wpn: ItemDef | null;
  lastH: number;
  oxygen: number;
  equippedArmor: string[];
  invincibleShieldT?: number;

  constructor(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    this.pos = new THREE.Vector3(8, 80, 8);
    this.vel = new THREE.Vector3();
    this.onG = false;
    this.fly = true;
    this.spd = 2.8;
    this.fspd = 7.0;
    this.eyeH = 1.65;
    this.r = 0.35;
    this.h = 1.8;
    this.yaw = 0;
    this.pitch = 0;
    this.hp = 20;
    this.mhp = 20;
    this.hunger = 20;
    this.xp = 0;
    this.lv = 1;
    this.gold = 0;
    this.kills = 0;
    this.dead = false;
    this.def = 0;
    this.spdB = 0;
    this.wpn = null;
    this.lastH = 0;
    this.oxygen = 100;
    this.equippedArmor = [];
    this.invincibleShieldT = 0;
  }

  look(): void {
    this.cam.rotation.order = 'YXZ';
    this.cam.rotation.y = this.yaw;
    this.cam.rotation.x = this.pitch;
    this.cam.position.set(this.pos.x, this.pos.y + this.eyeH, this.pos.z);
  }

  upd(dt: number, inp: any, world: CM, mode: string, onDie: (src: string) => void): void {
    if (this.dead) return;
    if (this.invincibleShieldT !== undefined && this.invincibleShieldT > 0) {
      this.invincibleShieldT = Math.max(0, this.invincibleShieldT - dt);
    }
    const fw = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const mv = new THREE.Vector3();

    if (inp.fwd) mv.add(fw);
    if (inp.bk) mv.sub(fw);
    if (inp.rt) mv.add(rt);
    if (inp.lt) mv.sub(rt);

    if (inp.jx || inp.jy) {
      mv.add(fw.clone().multiplyScalar(-inp.jy));
      mv.add(rt.clone().multiplyScalar(inp.jx));
    }

    if (mv.lengthSq() > 0) mv.normalize();
    const sp = (this.fly ? this.fspd : this.spd) + this.spdB;
    this.vel.x = mv.x * sp;
    this.vel.z = mv.z * sp;

    if (this.fly) {
      this.vel.y = 0;
      if (inp.jump) this.vel.y = sp;
      if (inp.crouch) this.vel.y = -sp;
    } else {
      this.vel.y -= 25 * dt;
      if (inp.jump && this.onG) {
        this.vel.y = 9;
        this.onG = false;
      }
    }

    this._mv('x', this.vel.x * dt, world);
    this._mv('y', this.vel.y * dt, world);
    this._mv('z', this.vel.z * dt, world);
    this.look();

    // Lava (Dung nham) or Water (Nước) environmental damage and Oxygen logic
    const px = Math.floor(this.pos.x);
    const py = Math.floor(this.pos.y);
    const pz = Math.floor(this.pos.z);
    const standBlock = world.wGet(px, py, pz);
    const belowBlock = world.wGet(px, py - 1, pz);
    const headBlock = world.wGet(px, py + 1, pz);

    // Trap blocks damage (bẫy chông gai - 20, khối phun lửa - 21)
    const isTrap = standBlock === 20 || standBlock === 21 || belowBlock === 20 || belowBlock === 21;
    if (isTrap && mode !== 'creative') {
      this.dmg(2.0, 'Dính bẫy nguy hiểm ⚠️', onDie);
    }

    const isLava = standBlock === 13 || belowBlock === 13 || headBlock === 13;
    const isWater = standBlock === 5 || belowBlock === 5 || headBlock === 5;

    // Lava burning damage - shielded by fireproof costume
    if (isLava && mode !== 'creative') {
      const hasFireproof = this.equippedArmor && this.equippedArmor.includes('fireproof');
      if (!hasFireproof) {
        this.dmg(3.5, 'Dung nham nóng bỏng 🔥', onDie);
      }
    }

    // Oxygen consumption underwater
    const isSubmerged = headBlock === 5 || (isWater && headBlock === 0 && standBlock === 5); // Submerged in water
    if (isSubmerged && mode !== 'creative') {
      const hasScuba = this.equippedArmor && this.equippedArmor.includes('scuba');
      if (hasScuba) {
        // Scuba maintains breath
        this.oxygen = Math.min(100, this.oxygen + dt * 2);
      } else {
        this.oxygen = Math.max(0, this.oxygen - dt * 20); // Drowns in 5 seconds
        if (this.oxygen <= 0) {
          this.dmg(1.5, 'Ngạt nước dưới biển sâu 🛑🌊', onDie);
        }
      }
    } else {
      // Return to air regenerates oxygen rapid
      this.oxygen = Math.min(100, this.oxygen + dt * 50);
    }

    if (mode === 'survival' || mode === 'treasure') {
      this.hunger = Math.max(0, this.hunger - dt * 0.005);
      if (this.hunger < 5) this.hp = Math.max(0, this.hp - dt * 0.35);
      
      // Auto health regeneration feature
      const timeSinceDamage = performance.now() - this.lastH;
      if (this.hunger >= 15 && this.hp < this.mhp && timeSinceDamage > 4000) {
        // High saturation: heal faster when out of combat (>= 4s since last hit)
        this.hp = Math.min(this.mhp, this.hp + dt * 0.6);
      } else if (this.hunger >= 8 && this.hp < this.mhp && timeSinceDamage > 7000) {
        // Moderate saturation: slow healing when safe (>= 7s since last hit)
        this.hp = Math.min(this.mhp, this.hp + dt * 0.2);
      }

      if (this.hp <= 0 && !this.dead) {
        this.hp = 0;
        this.dead = true;
        onDie('đói');
      }
    } else {
      // Auto heal quickly in creative / sandbox mode
      if (this.hp < this.mhp) {
        this.hp = Math.min(this.mhp, this.hp + dt * 5.0);
      }
    }
  }

  dmg(amt: number, src: string, onDie: (src: string) => void): boolean {
    if (this.dead) return false;
    if (this.invincibleShieldT !== undefined && this.invincibleShieldT > 0) return false; // SOS invincible check
    const n = performance.now();
    if (n - this.lastH < 450) return false;
    this.lastH = n;
    this.hp = Math.max(0, this.hp - Math.max(1, amt - this.def));
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      onDie(src);
    }
    return true; // Damage actually applied
  }

  heal(v: number): void {
    this.hp = Math.min(this.mhp, this.hp + v);
  }

  addXP(v: number): boolean {
    this.xp += v;
    const nd = this.lv * 100;
    if (this.xp >= nd) {
      this.xp -= nd;
      this.lv++;
      this.mhp += 2;
      this.hp = this.mhp;
      return true; // Levelled up
    }
    return false;
  }

  respawn(worldHeight: number): void {
    this.dead = false;
    this.hp = this.mhp;
    this.hunger = 20;
    this.pos.set(8, worldHeight + 3, 8);
    this.vel.set(0, 0, 0);
  }

  col(world: CM, x: number, y: number, z: number): boolean {
    for (let bx = Math.floor(x - this.r); bx <= Math.floor(x + this.r); bx++) {
      for (let bz = Math.floor(z - this.r); bz <= Math.floor(z + this.r); bz++) {
        for (let by = Math.floor(y); by <= Math.floor(y + this.h); by++) {
          const b = world.wGet(bx, by, bz);
          if (b && BLK[b] && BLK[b].s) return true;
        }
      }
    }
    return false;
  }

  _mv(axis: 'x' | 'y' | 'z', delta: number, world: CM): void {
    if (!delta) return;
    const np = this.pos.clone();
    np[axis] += delta;
    if (!this.col(world, np.x, np.y, np.z)) {
      this.pos.copy(np);
      if (axis === 'y') this.onG = false;
    } else {
      if (axis === 'y') {
        if (delta < 0) this.onG = true;
        this.vel.y = 0;
      } else {
        this.vel[axis] = 0;
      }
    }
  }
}

/* ─── Voxel Entities Configurations ─── */
export const EC: Record<string, any> = {
  zombie: { hp: 20, spd: 2.2, dmg: 4, c: 0x4a7a4a, hc: 0x6abf6a, hos: 1, gold: 5, xp: 10, agr: 12, w: 0.8, h: 1.9, e: '🧟' },
  skeleton: { hp: 15, spd: 2.7, dmg: 5, c: 0xd0d0d0, hc: 0xe8e8e8, hos: 1, gold: 8, xp: 12, agr: 16, w: 0.7, h: 1.8, e: '💀' },
  spider: { hp: 12, spd: 4.0, dmg: 3, c: 0x222222, hc: 0x333333, hos: 1, gold: 4, xp: 8, agr: 10, w: 1.2, h: 0.7, e: '🕷️' },
  creeper: { hp: 20, spd: 3.0, dmg: 14, c: 0x3a7a3a, hc: 0x4a8a4a, hos: 1, gold: 10, xp: 15, agr: 8, w: 0.8, h: 1.7, e: '💚', boom: 1 },
  wolf: { hp: 12, spd: 3.8, dmg: 6, c: 0x888888, hc: 0x777777, hos: 1, gold: 6, xp: 8, agr: 14, w: 0.8, h: 1.2, e: '🐺' },
  cow: { hp: 15, spd: 1.5, dmg: 0, c: 0xffffff, hc: 0xd4c0a0, hos: 0, gold: 3, xp: 3, w: 1.0, h: 1.4, e: '🐄' },
  pig: { hp: 10, spd: 1.8, dmg: 0, c: 0xf0b0b0, hc: 0xff9999, hos: 0, gold: 2, xp: 2, w: 0.9, h: 1.1, e: '🐷' },
  chicken: { hp: 4, spd: 2.0, dmg: 0, c: 0xffffff, hc: 0xffd700, hos: 0, gold: 1, xp: 1, w: 0.6, h: 0.8, e: '🐔' },
  sheep: { hp: 8, spd: 1.6, dmg: 0, c: 0xe8e8e8, hc: 0xd4d4d4, hos: 0, gold: 2, xp: 2, w: 1.0, h: 1.2, e: '🐑' },
  key_collectible: { hp: 9999, spd: 0, dmg: 0, c: 0xffd700, hc: 0xffd700, hos: 0, gold: 0, xp: 0, w: 0.5, h: 0.8, e: '🔑', key: true },
  mutant_zombie: { hp: 120, spd: 3.2, dmg: 12, c: 0x990000, hc: 0xff3333, hos: 1, gold: 150, xp: 80, agr: 20, w: 1.4, h: 2.8, e: '💀👹' },
  world_boss: { hp: 500, spd: 1.6, dmg: 15, c: 0x2e1065, hc: 0xa855f7, hos: 1, gold: 350, xp: 200, agr: 40, w: 2.2, h: 4.8, e: '💀👹' }
};

/* ─── Voxel Entity Instance Class ─── */
export class Entity {
  type: string;
  cfg: any;
  dead: boolean;
  hp: number;
  pos: THREE.Vector3;
  st: 'idle' | 'chase';
  stT: number;
  aCD: number;
  wd: THREE.Vector3 | null;
  _ph: number;
  mesh: THREE.Mesh;
  head: THREE.Mesh;
  scene: THREE.Scene;

  constructor(type: string, x: number, y: number, z: number, scene: THREE.Scene) {
    this.type = type;
    this.cfg = EC[type] || EC.zombie;
    this.dead = false;
    this.hp = this.cfg.hp;
    this.pos = new THREE.Vector3(x, y, z);
    this.st = 'idle';
    this.stT = 0;
    this.aCD = 0;
    this.wd = null;
    this._ph = Math.random() * Math.PI * 2;
    this.scene = scene;

    if (type === 'key_collectible') {
      const gGroup = new THREE.Group();
      
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '90px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 215, 0, 1)';
        ctx.shadowBlur = 20;
        ctx.fillText('🔑', 64, 64);
      }
      
      const map = new THREE.CanvasTexture(canvas);
      map.needsUpdate = true;
      map.colorSpace = THREE.SRGBColorSpace;
      map.magFilter = THREE.LinearFilter;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      
      const spriteMat = new THREE.SpriteMaterial({ map: map, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2, 2, 2);
      
      gGroup.add(sprite);

      // Add a bright point light so it acts as a beacon!
      const light = new THREE.PointLight(0xffd700, 2, 15);
      gGroup.add(light);

      this.mesh = gGroup as any;
      this.head = null as any;
      this.mesh.position.copy(this.pos);
      scene.add(this.mesh);
    } else if (type === 'chest_collectible') {
      const gGroup = new THREE.Group();
      // Main box
      const chestMat = new THREE.MeshLambertMaterial({ color: 0xd9a741 });
      const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), chestMat);
      gGroup.add(chestBox);
      // Red ribbon wrap
      const ribMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.1), ribMat);
      const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.82), ribMat);
      gGroup.add(rib1);
      gGroup.add(rib2);
      
      this.mesh = gGroup as any;
      this.head = null as any;
      this.mesh.position.copy(this.pos);
      scene.add(this.mesh);
    } else {
      const c = this.cfg;
      if (type === 'zombie') {
        const gGroup = new THREE.Group();
        const textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load('/zombie-shambler-voxel.webp');
        map.colorSpace = THREE.SRGBColorSpace;
        const spriteMat = new THREE.SpriteMaterial({ map: map, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(c.h * 1.5, c.h * 1.5, c.h * 1.5);
        sprite.position.y = c.h * 0.5;
        gGroup.add(sprite);

        this.head = sprite as any; // Using sprite as pseudo-head for animation reference
        this.mesh = gGroup as any;
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
      } else if (type === 'world_boss') {
        const bossColor = 0x2e1065; 
        const eyeColor = 0xff0055; 
        const gGroup = new THREE.Group();
        
        const torsoMat = new THREE.MeshLambertMaterial({ color: bossColor, emissive: 0x120024 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.9, c.h * 0.5, c.w * 0.9), torsoMat);
        torso.position.y = c.h * 0.35;
        gGroup.add(torso);
        
        const legMat = new THREE.MeshLambertMaterial({ color: 0x111827 }); 
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.4, c.h * 0.35, c.w * 0.4), legMat);
        leftLeg.position.set(-c.w * 0.22, c.h * 0.18, 0);
        leftLeg.name = 'lLeg';
        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.4, c.h * 0.35, c.w * 0.4), legMat);
        rightLeg.position.set(c.w * 0.22, c.h * 0.18, 0);
        rightLeg.name = 'rLeg';
        gGroup.add(leftLeg);
        gGroup.add(rightLeg);
        
        this.head = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.7, c.w * 0.7, c.w * 0.7), new THREE.MeshLambertMaterial({ color: bossColor }));
        this.head.position.set(0, c.h * 0.6 + c.w * 0.35, 0);
        gGroup.add(this.head);
        
        const em = new THREE.MeshBasicMaterial({ color: eyeColor });
        const eg = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        const el = new THREE.Mesh(eg, em);
        el.position.set(-c.w * 0.18, 0.1, -c.w * 0.36);
        const er = new THREE.Mesh(eg, em);
        er.position.set(c.w * 0.18, 0.1, -c.w * 0.36);
        this.head.add(el);
        this.head.add(er);
        
        const sMat = new THREE.MeshLambertMaterial({ color: 0xa855f7 }); 
        const sL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), sMat);
        sL.position.set(-c.w * 0.55, c.h * 0.5, 0);
        const sR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), sMat);
        sR.position.set(c.w * 0.55, c.h * 0.5, 0);
        gGroup.add(sL);
        gGroup.add(sR);
        
        const bossLight = new THREE.PointLight(0xa855f7, 4, 15);
        bossLight.position.y = c.h * 0.5;
        gGroup.add(bossLight);
        
        this.mesh = gGroup as any;
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
      } else {
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.w), new THREE.MeshLambertMaterial({ color: c.c }));
        this.head = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.9, c.w * 0.9, c.w * 0.9), new THREE.MeshLambertMaterial({ color: c.hc }));
        this.head.position.set(0, c.h / 2 + c.w * 0.45, 0);
        this.mesh.add(this.head);

        if (c.hos) {
          const em = new THREE.MeshBasicMaterial({ color: 0xff2200 });
          const eg = new THREE.BoxGeometry(0.09, 0.09, 0.09);
          const el = new THREE.Mesh(eg, em);
          el.position.set(-c.w * 0.18, 0, -c.w * 0.46);
          const er = new THREE.Mesh(eg, em);
          er.position.set(c.w * 0.18, 0, -c.w * 0.46);
          this.head.add(el);
          this.head.add(er);
        }
        this.mesh.position.set(x, y + c.h / 2, z);
        scene.add(this.mesh);
      }
    }
  }

  hit(amt: number): boolean {
    this.hp = Math.max(0, this.hp - amt);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if ('emissive' in m) {
            const oldColor = m.emissive.clone();
            m.emissive.setHex(0x660000);
            setTimeout(() => {
              try { m.emissive.copy(oldColor); } catch (e) {}
            }, 120);
          }
        });
      }
    });
    return this.hp <= 0;
  }

  upd(dt: number, player: Player, world: CM, onHitPlayer: (dmg: number, src: string) => void, onBoom: () => void, isNight?: boolean): void {
    if (this.dead) return;

    // Direct sunlight burn check for hostile mob types in survival
    if (isNight === false && this.cfg.hos) {
      let shielded = false;
      const sx = ~~this.pos.x;
      const sy = Math.ceil(this.pos.y) + 1;
      const sz = ~~this.pos.z;
      for (let y = sy; y < sy + 15; y++) {
        if (world.wGet(sx, y, sz)) {
          shielded = true;
          break;
        }
      }
      if (!shielded) {
        // Burn high rate
        this.hit(dt * 3.5);
        this.pos.y += Math.sin(performance.now() * 0.1) * 0.01; // Panic jump wiggle
        if (this.hp <= 0) {
          this.dead = true;
          this.remove();
          return;
        }
      }
    }

    this.stT -= dt;
    this.aCD = Math.max(0, this.aCD - dt);
    const c = this.cfg;
    const dp = this.pos.distanceTo(player.pos);

    if (c.hos) {
      if (dp < c.agr) this.st = 'chase';
      else if (this.st === 'chase') this.st = 'idle';

      if (this.st === 'chase') {
        const d = new THREE.Vector3().subVectors(player.pos, this.pos);
        if (!c.fly) {
          d.y = 0;
        } else {
          // Flying mobs drift towards player's Y level
          if (Math.abs(d.y) > 0.5) {
            this.pos.y += Math.sign(d.y) * c.spd * dt;
          }
        }
        
        if (d.length() > 0.1) {
          d.normalize();
          this.pos.x += d.x * c.spd * dt;
          if (!c.fly) {
            this.pos.z += d.z * c.spd * dt;
          } else {
            this.pos.z += d.z * c.spd * dt;
          }
          this.mesh.rotation.y = Math.atan2(d.x, d.z);
        }
        if (dp < 2.5 && this.aCD <= 0) {
          onHitPlayer(c.dmg, c.e + ' ' + this.type);
          this.aCD = 1.5;
        }
        if (c.boom && dp < 2.5) {
          onBoom();
          this.remove();
          return;
        }
      } else {
        if (this.stT <= 0) {
          this.wd = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
          this.stT = 1.5 + Math.random() * 2;
        }
        if (this.wd) {
          this.pos.x += this.wd.x * c.spd * 0.35 * dt;
          this.pos.z += this.wd.z * c.spd * 0.35 * dt;
        }
      }
    } else {
      if (this.stT <= 0) {
        this.wd = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
        this.stT = 2 + Math.random() * 3;
      }
      if (this.wd && Math.random() < 0.85) {
        this.pos.x += this.wd.x * c.spd * 0.35 * dt;
        this.pos.z += this.wd.z * c.spd * 0.35 * dt;
        this.mesh.rotation.y = Math.atan2(this.wd.x, this.wd.z);
      }
      if (dp < 5) {
        const fl = new THREE.Vector3().subVectors(this.pos, player.pos).normalize();
        this.pos.x += fl.x * c.spd * dt;
        this.pos.z += fl.z * c.spd * dt;
      }
    }

    if (!this.cfg.fly && !world.wGet(~~this.pos.x, ~~this.pos.y - 1, ~~this.pos.z)) {
      this.pos.y = Math.max(1, this.pos.y - 4 * dt);
    }
    
    this._ph += dt * 5;
    const hoverOffset = this.cfg.fly ? Math.sin(this._ph * 0.5) * 0.5 : Math.abs(Math.sin(this._ph)) * 0.04;
    this.mesh.position.set(this.pos.x, this.pos.y + c.h / 2 + hoverOffset, this.pos.z);
    
    if (this.head) this.head.rotation.x = Math.sin(this._ph) * 0.08;
  }

  remove(): void {
    this.dead = true;
    try { this.scene.remove(this.mesh); } catch (e) { }
  }
}

/* ─── Day-Night Cycle Class ─── */
export class DN {
  scene: THREE.Scene;
  t: number;
  spd: number;
  cN: THREE.Color;
  cD: THREE.Color;
  cDy: THREE.Color;
  cDk: THREE.Color;
  sun: THREE.Mesh;
  moon: THREE.Mesh;
  stars: THREE.Points;
  hemi: THREE.HemisphereLight;
  dir: THREE.DirectionalLight;
  isTreasure: boolean;
  clouds: { group: THREE.Group; speedX: number; speedZ: number; }[] = [];
  cloudMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, isTreasure = false) {
    this.scene = scene;
    this.isTreasure = isTreasure;
    this.t = 0.35;
    this.spd = 0.00015;
    
    if (isTreasure) {
      this.cN = new THREE.Color(0x1a0500); // Dark red sky
      this.cD = new THREE.Color(0xff2200); // Fiery orange-red
      this.cDy = new THREE.Color(0x400e00); // Ash-grey day with red tint
      this.cDk = new THREE.Color(0xff4400); // Crimson dusk
    } else {
      this.cN = new THREE.Color(0x040a18);
      this.cD = new THREE.Color(0xff6b35);
      this.cDy = new THREE.Color(0x87ceeb);
      this.cDk = new THREE.Color(0xff4500);
    }

    const sg = new THREE.SphereGeometry(7, 12, 12);
    this.sun = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xfffcdd }));
    scene.add(this.sun);

    const mg = new THREE.SphereGeometry(4.5, 12, 12);
    this.moon = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0xd0dfff }));
    scene.add(this.moon);

    const stg = new THREE.BufferGeometry();
    const sp: number[] = [];
    for (let i = 0; i < 600; i++) {
      const tVal = Math.random() * Math.PI * 2;
      const pVal = Math.random() * Math.PI;
      const rVal = 380;
      sp.push(rVal * Math.sin(pVal) * Math.cos(tVal), rVal * Math.cos(pVal), rVal * Math.sin(pVal) * Math.sin(tVal));
    }
    stg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: true, transparent: true, opacity: 0 }));
    scene.add(this.stars);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 0.7);
    scene.add(this.hemi);

    this.dir = new THREE.DirectionalLight(0xfff2cc, 1.0);
    scene.add(this.dir);

    // --- PROCEDURAL BLOCKY CLOUDS INITIALIZATION ---
    this.cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    const cloudAlt = 50; // High in the sky
    const cloudCount = 18;

    for (let i = 0; i < cloudCount; i++) {
      const group = new THREE.Group();
      
      // Combine 3 to 6 overlapping blocky boxes to make a real cumulative cloud shape
      const blockCount = 3 + Math.floor(Math.random() * 4);
      const baseW = 12 + Math.random() * 16;
      const baseD = 12 + Math.random() * 16;
      const baseH = 1 + Math.random() * 1.2;

      for (let b = 0; b < blockCount; b++) {
        // Multi-layered sizes with randomized dimension multipliers
        const w = baseW * (0.5 + Math.random() * 0.6);
        const d = baseD * (0.5 + Math.random() * 0.6);
        const h = baseH * (0.7 + Math.random() * 0.4);

        const geom = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geom, this.cloudMaterial);

        // Displace position in voxel fashion
        const ox = (Math.random() - 0.5) * baseW * 0.6;
        const oy = (Math.random() - 0.5) * 0.3;
        const oz = (Math.random() - 0.5) * baseD * 0.6;
        mesh.position.set(ox, oy, oz);

        group.add(mesh);
      }

      // Distribute randomly in a 3D coordinate space around (0, 0, 0)
      const cx = (Math.random() - 0.5) * 440;
      const cz = (Math.random() - 0.5) * 440;
      const cy = cloudAlt + (Math.random() - 0.5) * 5;

      group.position.set(cx, cy, cz);
      scene.add(group);

      this.clouds.push({
        group,
        speedX: (0.15 + Math.random() * 0.35) * (Math.random() < 0.5 ? 1 : -1),
        speedZ: (0.15 + Math.random() * 0.35) * (Math.random() < 0.5 ? 1 : -1)
      });
    }
  }

  upd(dt: number, playerPos?: THREE.Vector3, isMultiplayer = false): void {
    if (!isMultiplayer) {
      this.t = (this.t + this.spd * dt * 60) % 1;
    }
    const ang = this.t * Math.PI * 2 - Math.PI / 2, R = 260;
    this.sun.position.set(Math.cos(ang) * R, Math.sin(ang) * R, 40);
    this.moon.position.set(-Math.cos(ang) * R, -Math.sin(ang) * R, 40);
    this.sun.visible = this.sun.position.y > -30;
    this.moon.visible = this.moon.position.y > -30;

    let sky: THREE.Color;
    const t = this.t;
    if (t < 0.20) sky = this.cN.clone().lerp(this.cD, t / 0.20);
    else if (t < 0.30) sky = this.cD.clone().lerp(this.cDy, (t - 0.20) / 0.10);
    else if (t < 0.70) sky = this.cDy.clone();
    else if (t < 0.80) sky = this.cDy.clone().lerp(this.cDk, (t - 0.70) / 0.10);
    else if (t < 0.90) sky = this.cDk.clone().lerp(this.cN, (t - 0.80) / 0.10);
    else sky = this.cN.clone();

    this.scene.background = sky;
    if (this.scene.fog) {
      if (this.scene.fog instanceof THREE.Fog) this.scene.fog.color.copy(sky);
      else if (this.scene.fog instanceof THREE.FogExp2) this.scene.fog.color.copy(sky);
    }

    const ds = Math.max(0, Math.sin(t * Math.PI * 2 - Math.PI / 2));
    this.dir.intensity = ds * 1.2;
    this.dir.position.copy(this.sun.position);
    this.hemi.intensity = 0.18 + ds * 0.6;
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - ds * 2.5);

    // --- DRIFT CLOUDS & WRAP RELATIVE TO PLAYER ---
    if (this.clouds && this.clouds.length > 0) {
      const px = playerPos ? playerPos.x : 8;
      const pz = playerPos ? playerPos.z : 8;
      const bRad = 240; // Max view distance boundary from player

      this.clouds.forEach(c => {
        c.group.position.x += c.speedX * dt * 10;
        c.group.position.z += c.speedZ * dt * 10;

        // Wrap around player's X boundary to make infinite loop
        if (c.group.position.x - px > bRad) {
          c.group.position.x -= bRad * 2;
        } else if (c.group.position.x - px < -bRad) {
          c.group.position.x += bRad * 2;
        }

        // Wrap around player's Z boundary
        if (c.group.position.z - pz > bRad) {
          c.group.position.z -= bRad * 2;
        } else if (c.group.position.z - pz < -bRad) {
          c.group.position.z += bRad * 2;
        }
      });
    }

    // --- CINEMATIC ATMOSPHERIC CLOUD COLORING ---
    let cloudColor = new THREE.Color(0xffffff);
    if (this.isTreasure) {
      // Lava Biome: smoky dark ash with an ember core
      const ashColor = new THREE.Color(0x351a1a);
      const glowColor = new THREE.Color(0xff4411);
      const pulse = 0.45 + Math.sin(this.t * Math.PI * 5) * 0.2;
      cloudColor.copy(ashColor).lerp(glowColor, pulse);
    } else {
      if (t >= 0.30 && t <= 0.70) {
        cloudColor.setHex(0xffffff); // Midday sun: pristine white
      } else if (t > 0.70 && t < 0.90) {
        // Sunset transition
        const sunsetFactor = (t - 0.70) / 0.20;
        const midSunsetColor = new THREE.Color(0xff9e73); // Beautiful warm orange-pink sunset reflect
        const nightCloudColor = new THREE.Color(0x283855); // Quiet moonlit midnight
        if (sunsetFactor < 0.5) {
          cloudColor.setHex(0xffffff).lerp(midSunsetColor, sunsetFactor * 2);
        } else {
          cloudColor.copy(midSunsetColor).lerp(nightCloudColor, (sunsetFactor - 0.5) * 2);
        }
      } else if (t >= 0.90 || t < 0.10) {
        cloudColor.setHex(0x283855); // Night time: faint blue silhouette
      } else {
        // Sunrise transition
        const sunriseFactor = (t - 0.10) / 0.20;
        const midSunriseColor = new THREE.Color(0xffebd2); // Peachy dawn light
        const nightCloudColor = new THREE.Color(0x283855);
        if (sunriseFactor < 0.5) {
          cloudColor.copy(nightCloudColor).lerp(midSunriseColor, sunriseFactor * 2);
        } else {
          cloudColor.copy(midSunriseColor).lerp(new THREE.Color(0xffffff), (sunriseFactor - 0.5) * 2);
        }
      }
    }

    if (this.cloudMaterial) {
      this.cloudMaterial.color.copy(cloudColor);
      this.cloudMaterial.opacity = this.isTreasure ? 0.72 : (t >= 0.30 && t <= 0.70 ? 0.62 : 0.42);
    }
  }

  lbl(): string {
    const h = ~~(this.t * 24);
    const m = ~~(this.t * 24 % 1 * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  night(): boolean {
    return this.t < 0.25 || this.t > 0.75;
  }
}

/* ─── Voxel Raycasting Handler ─── */
export interface RCResult {
  x: number;
  y: number;
  z: number;
  face: number[] | null;
  block: number;
}

export function rc(world: CM, ori: THREE.Vector3, dir: THREE.Vector3, maxD = 6): RCResult | null {
  let x = ~~ori.x, y = ~~ori.y, z = ~~ori.z;
  const sx = Math.sign(dir.x);
  const sy = Math.sign(dir.y);
  const sz = Math.sign(dir.z);
  const tx0 = Math.abs(1 / dir.x);
  const ty0 = Math.abs(1 / dir.y);
  const tz0 = Math.abs(1 / dir.z);

  let tx = tx0 * (dir.x > 0 ? x + 1 - ori.x : ori.x - x);
  let ty = ty0 * (dir.y > 0 ? y + 1 - ori.y : ori.y - y);
  let tz = tz0 * (dir.z > 0 ? z + 1 - ori.z : ori.z - z);
  let face: number[] | null = null;
  let dist = 0;

  while (dist < maxD) {
    const b = world.wGet(x, y, z);
    if (b && BLK[b] && BLK[b].s) return { x, y, z, face, block: b };
    if (tx < ty) {
      if (tx < tz) {
        x += sx; dist = tx; tx += tx0; face = [-sx, 0, 0];
      } else {
        z += sz; dist = tz; tz += tz0; face = [0, 0, -sz];
      }
    } else {
      if (ty < tz) {
        y += sy; dist = ty; ty += ty0; face = [0, -sy, 0];
      } else {
        z += sz; dist = tz; tz += tz0; face = [0, 0, -sz];
      }
    }
  }
  return null;
}

/* ─── Web Audio SFX Synthesizer Class ─── */
export class SimpleSynthesizer {
  ctx: AudioContext | null = null;
  isMuted: boolean = false;

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  init(): void {
    if (this.isMuted) return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  }

  playBreak(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPlace(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playCollect(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playRadarBeep(freq = 880): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
}

export const synth = new SimpleSynthesizer();
