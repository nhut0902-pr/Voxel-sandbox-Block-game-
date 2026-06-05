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
  14: { n: 'gold ore', s: 1, c: 0xd9b441, e: '🥇' },
  15: { n: 'diamond', s: 1, c: 0x5be0d2, e: '💎' },
  16: { n: 'brick', s: 1, c: 0xb34a3c, e: '🧱' },
  17: { n: 'planks', s: 1, c: 0xc4903d, e: '🪟' },
};

export const BL = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17];

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
  t: 'weapon' | 'tool' | 'armor' | 'food' | 'potion' | 'special';
}

export const ITM: Record<string, ItemDef> = {
  sw1: { id: 'sw1', n: 'Kiếm Gỗ', e: '🗡️', dmg: 3, t: 'weapon' },
  sw2: { id: 'sw2', n: 'Kiếm Đá', e: '⚔️', dmg: 5, t: 'weapon' },
  sw3: { id: 'sw3', n: 'Kiếm Vàng', e: '🔱', dmg: 7, t: 'weapon' },
  sw4: { id: 'sw4', n: 'Kiếm KCương', e: '💎⚔️', dmg: 10, t: 'weapon' },
  axe: { id: 'axe', n: 'Rìu', e: '🪓', dmg: 4, t: 'tool' },
  pick: { id: 'pick', n: 'Cuốc', e: '⛏️', dmg: 2, t: 'tool' },
  shield: { id: 'shield', n: 'Khiên', e: '🛡️', def: 3, t: 'armor' },
  helm: { id: 'helm', n: 'Nón', e: '⛑️', def: 2, t: 'armor' },
  boots: { id: 'boots', n: 'Bốt', e: '👟', spd: 2, t: 'armor' },
  bread: { id: 'bread', n: 'Bánh Mì', e: '🍞', hg: 4, t: 'food' },
  apple: { id: 'apple', n: 'Táo', e: '🍎', hg: 3, hl: 2, t: 'food' },
  meat: { id: 'meat', n: 'Thịt', e: '🍖', hg: 6, hl: 3, t: 'food' },
  pot_hp: { id: 'pot_hp', n: 'Thuốc HP', e: '🧪', hl: 10, t: 'potion' },
  pot_spd: { id: 'pot_spd', n: 'Thuốc Tốc', e: '⚗️', spd: 5, t: 'potion' },
  wings: { id: 'wings', n: 'Cánh', e: '🪽', fly: true, t: 'special' },
};

export interface ShopItem {
  id: string;
  p: number;
}

export const SHOP: Record<string, ShopItem[]> = {
  weapons: [{ id: 'sw1', p: 10 }, { id: 'sw2', p: 30 }, { id: 'sw3', p: 80 }, { id: 'sw4', p: 200 }],
  tools: [{ id: 'axe', p: 20 }, { id: 'pick', p: 25 }],
  food: [{ id: 'bread', p: 8 }, { id: 'apple', p: 6 }, { id: 'meat', p: 15 }, { id: 'pot_hp', p: 25 }, { id: 'pot_spd', p: 35 }],
  special: [{ id: 'shield', p: 60 }, { id: 'helm', p: 70 }, { id: 'boots', p: 55 }, { id: 'wings', p: 300 }],
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
    const b = this.n1.fbm(wx * 0.012, wz * 0.012, 5, 2, 0.5);
    const m = Math.max(0, this.n1.fbm(wx * 0.003, wz * 0.003, 3) - 0.2) * 60;
    let h = 32 + b * 14 + m;
    if (this.biome === 'desert') h = 30 + b * 6;
    if (this.biome === 'snow') h = 40 + b * 20 + m;
    if (this.biome === 'volcano') h = 36 + b * 22 + m * 1.5;
    return Math.max(8, Math.min(120, ~~h));
  }

  blk(wx: number, wy: number, wz: number): number {
    const h = this.h(wx, wz);
    if (wy < h - 2) {
      const cv = this.n2.fbm(wx * 0.05, wz * 0.05 + wy * 0.08, 3);
      if (cv > 0.55 && wy > 4 && wy < h - 3) return 0; // Cave
    }
    if (wy > h) return wy <= this.SEA ? 5 : 0; // Sea water
    if (wy === h) {
      if (this.biome === 'desert') return 4;
      if (this.biome === 'snow') return 8;
      if (this.biome === 'volcano') return wy > 50 ? 11 : 3;
      return wy <= this.SEA + 1 ? 4 : 1;
    }
    if (wy > h - 4) return this.biome === 'desert' ? 4 : 2;
    if (wy < 12 && this.n2.n2(wx * 0.3, wz * 0.3 + wy * 0.2) > 0.55) return 15; // Diamond Ore
    if (wy < 24 && this.n2.n2(wx * 0.25 + wy * 0.1, wz * 0.25) > 0.5) return 14; // Gold Ore
    if (wy < 3) return 11; // Obsidian core floor
    return 3; // Stone
  }

  isTree(wx: number, wz: number): boolean {
    if (['desert', 'snow', 'volcano'].includes(this.biome)) return false;
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

  constructor(scene: THREE.Scene, wg: WGen) {
    this.scene = scene;
    this.wg = wg;
    this.map = new Map();
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
    const c = this.map.get(this.key(~~(wx / CW), ~~(wz / CW)));
    return c ? c.get(((wx % CW) + CW) % CW, wy, ((wz % CW) + CW) % CW) : 0;
  }

  wSet(wx: number, wy: number, wz: number, v: number): void {
    const cx = ~~(wx / CW);
    const cz = ~~(wz / CW);
    const c = this.gc(cx, cz);
    const lx = ((wx % CW) + CW) % CW;
    const lz2 = ((wz % CW) + CW) % CW;
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
  wpn: ItemDef | null;
  lastH: number;

  constructor(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    this.pos = new THREE.Vector3(8, 80, 8);
    this.vel = new THREE.Vector3();
    this.onG = false;
    this.fly = true;
    this.spd = 6;
    this.fspd = 14;
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
  }

  look(): void {
    this.cam.rotation.order = 'YXZ';
    this.cam.rotation.y = this.yaw;
    this.cam.rotation.x = this.pitch;
    this.cam.position.set(this.pos.x, this.pos.y + this.eyeH, this.pos.z);
  }

  upd(dt: number, inp: any, world: CM, mode: string, onDie: (src: string) => void): void {
    if (this.dead) return;
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

    if (mode === 'survival') {
      this.hunger = Math.max(0, this.hunger - dt * 0.005);
      if (this.hunger < 5) this.hp = Math.max(0, this.hp - dt * 0.35);
      if (this.hp <= 0 && !this.dead) {
        this.hp = 0;
        this.dead = true;
        onDie('đói');
      }
    }
  }

  dmg(amt: number, src: string, onDie: (src: string) => void): boolean {
    if (this.dead) return false;
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
    for (let bx = ~~(x - this.r); bx <= ~~(x + this.r); bx++) {
      for (let bz = ~~(z - this.r); bz <= ~~(z + this.r); bz++) {
        for (let by = ~~y; by <= ~~(y + this.h); by++) {
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
  sheep: { hp: 8, spd: 1.6, dmg: 0, c: 0xe8e8e8, hc: 0xd4d4d4, hos: 0, gold: 2, xp: 2, w: 1.0, h: 1.2, e: '🐑' }
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
    const c = this.cfg;
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
    this.scene = scene;
  }

  hit(amt: number): boolean {
    this.hp = Math.max(0, this.hp - amt);
    const mat = this.mesh.material as THREE.MeshLambertMaterial;
    if (mat) {
      mat.emissive = new THREE.Color(0x660000);
      setTimeout(() => {
        try { mat.emissive.set(0, 0, 0); } catch (e) { }
      }, 120);
    }
    return this.hp <= 0;
  }

  upd(dt: number, player: Player, world: CM, onHitPlayer: (dmg: number, src: string) => void, onBoom: () => void): void {
    if (this.dead) return;
    this.stT -= dt;
    this.aCD = Math.max(0, this.aCD - dt);
    const c = this.cfg;
    const dp = this.pos.distanceTo(player.pos);

    if (c.hos) {
      if (dp < c.agr) this.st = 'chase';
      else if (this.st === 'chase') this.st = 'idle';

      if (this.st === 'chase') {
        const d = new THREE.Vector3().subVectors(player.pos, this.pos);
        d.y = 0;
        if (d.length() > 0.1) {
          d.normalize();
          this.pos.x += d.x * c.spd * dt;
          this.pos.z += d.z * c.spd * dt;
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

    if (!world.wGet(~~this.pos.x, ~~this.pos.y - 1, ~~this.pos.z)) {
      this.pos.y = Math.max(1, this.pos.y - 4 * dt);
    }
    this._ph += dt * 5;
    this.mesh.position.set(this.pos.x, this.pos.y + c.h / 2 + Math.abs(Math.sin(this._ph)) * 0.04, this.pos.z);
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

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.t = 0.35;
    this.spd = 0.00015;
    this.cN = new THREE.Color(0x040a18);
    this.cD = new THREE.Color(0xff6b35);
    this.cDy = new THREE.Color(0x87ceeb);
    this.cDk = new THREE.Color(0xff4500);

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
  }

  upd(dt: number): void {
    this.t = (this.t + this.spd * dt * 60) % 1;
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

  init(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  }

  playBreak(): void {
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
}

export const synth = new SimpleSynthesizer();
