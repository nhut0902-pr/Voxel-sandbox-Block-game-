export type ItemType = 'block' | 'tool' | 'weapon' | 'armor' | 'food' | 'cosmetic' | 'backpack';

export interface ItemStack {
  id: string;
  name: string;
  count: number;
  maxStack: number;
  type: ItemType;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
  // Specific stats
  val?: number; // block ID, healing mount, armor defense, or attack damage
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  level: number;
  gold: number;
  gems: number;
}

export type MobType = 'cow' | 'sheep' | 'chicken' | 'zombie' | 'skeleton' | 'spider';

export interface MobState {
  id: string;
  type: MobType;
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  maxHealth: number;
  action: 'wander' | 'chase' | 'attack' | 'dead';
  targetPlayerId?: string;
  hurtCooldown: number;
}

export type QuestCategory = 'daily' | 'weekly' | 'achievement';
export type QuestTarget = 'break' | 'place' | 'craft' | 'kill' | 'mine';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  targetType: QuestTarget;
  targetId: string; // e.g., "diamond_ore", "zombie"
  targetCount: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  rewardGold: number;
  rewardGems: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  result: ItemStack;
  // Dynamic 2x2 or 3x3 pattern mapping
  // e.g. [["wood", "wood"], ["wood", "wood"]] representing a crafting table
  grid: (string | null)[][]; 
  is3x3: boolean;
  description: string;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  currency: 'gold' | 'gems';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'blocks' | 'tools' | 'weapons' | 'armor' | 'food' | 'cosmetics' | 'backpacks';
  itemTemplate: ItemStack;
  discountPercent?: number;
}

export interface BlockConfig {
  id: number;
  name: string;
  itemId: string;
  color: string; // Used for fallbacks
  durability: number; // breaks with N hits 
  isTransparent?: boolean;
  isSolid?: boolean;
  textureOffset?: [number, number]; // index coordinate for texture mapping if atlas is used
}

// Block IDs mapping
export const BLOCK_IDS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WOOD: 5,
  LEAVES: 6,
  WATER: 7,
  GLASS: 8,
  BRICK: 9,
  OBSIDIAN: 10,
  IRON_ORE: 11,
  GOLD_ORE: 12,
  DIAMOND_ORE: 13,
} as const;

export const BLOCK_CONFIGS: Record<number, BlockConfig> = {
  [BLOCK_IDS.AIR]: { id: 0, name: 'Air', itemId: 'air', color: 'transparent', durability: 0, isSolid: false },
  [BLOCK_IDS.GRASS]: { id: 1, name: 'Grass Block', itemId: 'grass', color: '#557a2b', durability: 3, isSolid: true },
  [BLOCK_IDS.DIRT]: { id: 2, name: 'Dirt', itemId: 'dirt', color: '#866043', durability: 3, isSolid: true },
  [BLOCK_IDS.STONE]: { id: 3, name: 'Stone', itemId: 'stone', color: '#7a7a7a', durability: 8, isSolid: true },
  [BLOCK_IDS.SAND]: { id: 4, name: 'Sand', itemId: 'sand', color: '#dbcc90', durability: 2, isSolid: true },
  [BLOCK_IDS.WOOD]: { id: 5, name: 'Wood Log', itemId: 'wood', color: '#a0522d', durability: 5, isSolid: true },
  [BLOCK_IDS.LEAVES]: { id: 6, name: 'Leaves', itemId: 'leaves', color: '#2e8b57', durability: 1, isTransparent: true, isSolid: true },
  [BLOCK_IDS.WATER]: { id: 7, name: 'Water', itemId: 'water', color: '#4169e1', durability: 1, isTransparent: true, isSolid: false },
  [BLOCK_IDS.GLASS]: { id: 8, name: 'Glass', itemId: 'glass', color: '#e0f7fa', durability: 1, isTransparent: true, isSolid: true },
  [BLOCK_IDS.BRICK]: { id: 9, name: 'Brick', itemId: 'brick', color: '#b22222', durability: 7, isSolid: true },
  [BLOCK_IDS.OBSIDIAN]: { id: 10, name: 'Obsidian', itemId: 'obsidian', color: '#1c1c24', durability: 30, isSolid: true },
  [BLOCK_IDS.IRON_ORE]: { id: 11, name: 'Iron Ore', itemId: 'iron_ore', color: '#d2b48c', durability: 10, isSolid: true },
  [BLOCK_IDS.GOLD_ORE]: { id: 12, name: 'Gold Ore', itemId: 'gold_ore', color: '#ffd700', durability: 12, isSolid: true },
  [BLOCK_IDS.DIAMOND_ORE]: { id: 13, name: 'Diamond Ore', itemId: 'diamond_ore', color: '#00ffff', durability: 20, isSolid: true },
};

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  system?: boolean;
}
