import { create } from 'zustand';
import { ItemStack, PlayerStats, Quest, BLOCK_IDS } from '../types';

interface InventoryState {
  inventory: (ItemStack | null)[];
  backpackLevel: number; // 0: None, 1: Small, 2: Medium, 3: Large, 4: Epic, 5: Legendary
  hotbarIndex: number;
  stats: PlayerStats;
  quests: Quest[];
  creativeMode: boolean;
  gameStarted: boolean;
  playerName: string;
  seed: string;
  currentRoom: string;

  // Actions
  setGameStarted: (val: boolean, name: string, seed: string, creative: boolean) => void;
  setRoom: (room: string) => void;
  addItem: (item: Omit<ItemStack, 'count'> & { count: number }) => boolean;
  removeItem: (itemId: string, qty: number) => boolean;
  moveItem: (fromIdx: number, toIdx: number) => void;
  splitStack: (fromIdx: number, toIdx: number) => void;
  setHotbarIndex: (idx: number) => void;
  upgradeBackpack: (level: number, cost: number) => boolean;
  useFood: (idx: number) => void;

  // Player Stats actions
  damagePlayer: (amt: number) => void;
  healPlayer: (amt: number) => void;
  changeHunger: (amt: number) => void;
  gainXp: (amt: number) => void;
  spendGold: (amt: number) => boolean;
  earnGold: (amt: number) => void;
  earnGems: (amt: number) => void;
  spendGems: (amt: number) => boolean;

  // Quests actions
  triggerQuestProgress: (actionType: 'break' | 'place' | 'craft' | 'kill', id: string, amount?: number) => void;
  claimQuestReward: (id: string) => void;
  resetQuests: () => void;
  
  // Entire Sync (Loading)
  loadSavedState: (saved: any) => void;
}

export const BACKPACK_SIZES = [0, 18, 36, 54, 72, 108]; // added slots based on levels
export const BACKPACK_NAMES = ['None', 'Small Bag', 'Medium Pack', 'Large Satchel', 'Epic Satchel', 'Legendary Vault'];
export const BACKPACK_COSTS = [0, 200, 500, 1200, 3000, 7500];

const INITIAL_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  hunger: 100,
  maxHunger: 100,
  stamina: 100,
  maxStamina: 100,
  xp: 0,
  level: 1,
  gold: 250, // Starting money for testing shop
  gems: 10,
};

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'mine_stone',
    title: 'Stone Miner',
    description: 'Break 10 Stone blocks to build sturdy tools.',
    category: 'daily',
    targetType: 'break',
    targetId: 'stone',
    targetCount: 10,
    progress: 0,
    completed: false,
    rewardXp: 50,
    rewardGold: 100,
    rewardGems: 2,
  },
  {
    id: 'place_wood',
    title: 'Shelter Builder',
    description: 'Place 5 Wood blocks to structure your camp.',
    category: 'daily',
    targetType: 'place',
    targetId: 'wood',
    targetCount: 5,
    progress: 0,
    completed: false,
    rewardXp: 30,
    rewardGold: 50,
    rewardGems: 0,
  },
  {
    id: 'craft_pickaxe',
    title: 'Heavy Industry',
    description: 'Craft a Stone Pickaxe or Stone Sword.',
    category: 'weekly',
    targetType: 'craft',
    targetId: 'stone_pickaxe',
    targetCount: 1,
    progress: 0,
    completed: false,
    rewardXp: 150,
    rewardGold: 300,
    rewardGems: 5,
  },
  {
    id: 'slay_monsters',
    title: 'Monster Slayer',
    description: 'Defeat 5 Zombies or Spiders lurking in the dark.',
    category: 'weekly',
    targetType: 'kill',
    targetId: 'zombie',
    targetCount: 5,
    progress: 0,
    completed: false,
    rewardXp: 200,
    rewardGold: 400,
    rewardGems: 10,
  },
  {
    id: 'diamond_collector',
    title: 'Grave Digging for Crystals',
    description: 'Mine 1 Diamond Ore.',
    category: 'achievement',
    targetType: 'break',
    targetId: 'diamond_ore',
    targetCount: 1,
    progress: 0,
    completed: false,
    rewardXp: 500,
    rewardGold: 1000,
    rewardGems: 30,
  }
];

// Let's create an array of size 144 (which is 36 core slots + 108 legendary backpack potential size)
const createEmptyPack = () => Array(144).fill(null);

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: (() => {
    const pack = createEmptyPack();
    // Prepopulate starting gear
    pack[0] = { id: 'wood_pickaxe', name: 'Wooden Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 1 };
    pack[1] = { id: 'apple', name: 'Delicious Apple', count: 5, maxStack: 64, type: 'food', val: 20 };
    pack[2] = { id: 'grass', name: 'Grass Block', count: 32, maxStack: 64, type: 'block', val: BLOCK_IDS.GRASS };
    pack[3] = { id: 'wood', name: 'Wood Log', count: 8, maxStack: 64, type: 'block', val: BLOCK_IDS.WOOD };
    return pack;
  })(),
  backpackLevel: 0,
  hotbarIndex: 0,
  stats: INITIAL_STATS,
  quests: INITIAL_QUESTS,
  creativeMode: false,
  gameStarted: false,
  playerName: 'Player' + Math.floor(Math.random() * 900 + 100),
  seed: 'minecraft',
  currentRoom: 'lobby',

  setGameStarted: (val, name, seed, creative) => set((state) => {
    // If creativeMode is enabled, grant stacks of rare items
    const inventory = [...state.inventory];
    if (creative) {
      inventory[0] = { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 5 };
      inventory[1] = { id: 'diamond_sword', name: 'Diamond Sword', count: 1, maxStack: 1, type: 'weapon', val: 12 };
      inventory[2] = { id: 'grass', name: 'Grass Block', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.GRASS };
      inventory[3] = { id: 'stone', name: 'Stone Block', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.STONE };
      inventory[4] = { id: 'wood', name: 'Wood Log', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.WOOD };
      inventory[5] = { id: 'leaves', name: 'Leaves', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.LEAVES };
      inventory[6] = { id: 'glass', name: 'Glass', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.GLASS };
      inventory[7] = { id: 'water', name: 'Water', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.WATER };
      inventory[8] = { id: 'brick', name: 'Brick', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.BRICK };
      inventory[9] = { id: 'obsidian', name: 'Obsidian', count: 64, maxStack: 64, type: 'block', val: BLOCK_IDS.OBSIDIAN };
    }
    return { 
      gameStarted: val, 
      playerName: name || state.playerName, 
      seed: seed || state.seed, 
      creativeMode: creative,
      inventory 
    };
  }),

  setRoom: (room) => set({ currentRoom: room }),

  addItem: (item) => {
    let success = false;
    set((state) => {
      const activeSize = 36 + BACKPACK_SIZES[state.backpackLevel];
      const inv = [...state.inventory];
      let remaining = item.count;

      // 1. Try to merge into existing stacks
      for (let i = 0; i < activeSize; i++) {
        const current = inv[i];
        if (current && current.id === item.id && current.count < current.maxStack) {
          const space = current.maxStack - current.count;
          const transfer = Math.min(space, remaining);
          current.count += transfer;
          remaining -= transfer;
          if (remaining <= 0) {
            success = true;
            break;
          }
        }
      }

      // 2. Add as new stacks in free cells
      if (remaining > 0) {
        for (let i = 0; i < activeSize; i++) {
          if (inv[i] === null) {
            inv[i] = {
              id: item.id,
              name: item.name,
              maxStack: item.maxStack,
              type: item.type,
              rarity: item.rarity,
              val: item.val,
              count: Math.min(item.maxStack, remaining),
            };
            remaining -= inv[i]!.count;
            if (remaining <= 0) {
              success = true;
              break;
            }
          }
        }
      }

      if (remaining < item.count) {
        success = true;
        return { inventory: inv };
      }
      return {};
    });
    return success;
  },

  removeItem: (itemId, qty) => {
    let success = false;
    set((state) => {
      const inv = [...state.inventory];
      
      // Check total quantity
      let available = 0;
      for (let i = 0; i < inv.length; i++) {
        if (inv[i]?.id === itemId) {
          available += inv[i]!.count;
        }
      }

      if (available >= qty) {
        let leftToRemove = qty;
        // Remove backwards to prefer depleting normal backpack before hotbar
        for (let i = inv.length - 1; i >= 0; i--) {
          if (inv[i]?.id === itemId) {
            if (inv[i]!.count <= leftToRemove) {
              leftToRemove -= inv[i]!.count;
              inv[i] = null;
            } else {
              inv[i]!.count -= leftToRemove;
              leftToRemove = 0;
              break;
            }
          }
        }
        success = true;
        return { inventory: inv };
      }
      return {};
    });
    return success;
  },

  moveItem: (from, to) => set((state) => {
    const inv = [...state.inventory];
    const fromVal = inv[from];
    const toVal = inv[to];

    // If merging same items
    if (fromVal && toVal && fromVal.id === toVal.id) {
      const total = fromVal.count + toVal.count;
      if (total <= toVal.maxStack) {
        inv[to] = { ...toVal, count: total };
        inv[from] = null;
      } else {
        inv[to] = { ...toVal, count: toVal.maxStack };
        inv[from] = { ...fromVal, count: total - toVal.maxStack };
      }
    } else {
      // Swapping slots
      inv[from] = toVal;
      inv[to] = fromVal;
    }
    return { inventory: inv };
  }),

  splitStack: (from, to) => set((state) => {
    const inv = [...state.inventory];
    const source = inv[from];
    if (source && source.count > 1) {
      const splitAmount = Math.floor(source.count / 2);
      const remainingAmount = source.count - splitAmount;

      const target = inv[to];
      if (!target) {
        inv[from] = { ...source, count: remainingAmount };
        inv[to] = { ...source, count: splitAmount };
      }
    }
    return { inventory: inv };
  }),

  setHotbarIndex: (idx) => set({ hotbarIndex: idx }),

  upgradeBackpack: (level, cost) => {
    let success = false;
    set((state) => {
      if (state.stats.gold >= cost && level > state.backpackLevel) {
        success = true;
        return {
          backpackLevel: level,
          stats: { ...state.stats, gold: state.stats.gold - cost },
        };
      }
      return {};
    });
    return success;
  },

  useFood: (idx) => set((state) => {
    const inv = [...state.inventory];
    const item = inv[idx];
    if (item && item.type === 'food') {
      const nourishment = item.val || 25;
      const updatedStats = { ...state.stats };
      
      // Heal health and fill hunger
      updatedStats.hunger = Math.min(updatedStats.maxHunger, updatedStats.hunger + nourishment);
      updatedStats.health = Math.min(updatedStats.maxHealth, updatedStats.health + 10);
      
      if (item.count > 1) {
        inv[idx] = { ...item, count: item.count - 1 };
      } else {
        inv[idx] = null;
      }
      return { inventory: inv, stats: updatedStats };
    }
    return {};
  }),

  damagePlayer: (amt) => set((state) => {
    if (state.creativeMode) return {};
    const newHealth = Math.max(0, state.stats.health - amt);
    // Auto-revive or handle death with minor item/gold penalty
    const resultStats = { ...state.stats, health: newHealth };
    if (newHealth <= 0) {
      resultStats.health = 100;
      resultStats.hunger = 100;
      resultStats.gold = Math.max(0, Math.floor(state.stats.gold * 0.8)); // 20% death fine
      alert("☠️ You died! You lost some gold and respawned back at base safe.");
    }
    return { stats: resultStats };
  }),

  healPlayer: (amt) => set((state) => {
    return {
      stats: {
        ...state.stats,
        health: Math.min(state.stats.maxHealth, state.stats.health + amt),
      }
    };
  }),

  changeHunger: (amt) => set((state) => {
    if (state.creativeMode) return {};
    const newHunger = Math.min(100, Math.max(0, state.stats.hunger + amt));
    let newHealth = state.stats.health;
    if (newHunger <= 0) {
      // Starvation damages real health
      newHealth = Math.max(10, state.stats.health - 2);
    }
    return {
      stats: {
        ...state.stats,
        hunger: newHunger,
        health: newHealth
      }
    };
  }),

  gainXp: (amt) => set((state) => {
    let newXp = state.stats.xp + amt;
    let newLevel = state.stats.level;
    const nextLevelReq = newLevel * 100;
    if (newXp >= nextLevelReq) {
      newXp -= nextLevelReq;
      newLevel += 1;
      alert(`🎉 Level Up! You reached Level ${newLevel}!`);
    }
    return {
      stats: {
        ...state.stats,
        xp: newXp,
        level: newLevel
      }
    };
  }),

  spendGold: (amt) => {
    let success = false;
    set((state) => {
      if (state.stats.gold >= amt) {
        success = true;
        return {
          stats: {
            ...state.stats,
            gold: state.stats.gold - amt
          }
        };
      }
      return {};
    });
    return success;
  },

  earnGold: (amt) => set((state) => ({
    stats: {
      ...state.stats,
      gold: state.stats.gold + amt
    }
  })),

  earnGems: (amt) => set((state) => ({
    stats: {
      ...state.stats,
      gems: state.stats.gems + amt
    }
  })),

  spendGems: (amt) => {
    let success = false;
    set((state) => {
      if (state.stats.gems >= amt) {
        success = true;
        return {
          stats: {
            ...state.stats,
            gems: state.stats.gems - amt
          }
        };
      }
      return {};
    });
    return success;
  },

  triggerQuestProgress: (actionType, id, amount = 1) => set((state) => {
    const updatedQuests = state.quests.map((q) => {
      if (!q.completed && q.targetType === actionType && (q.targetId === id || q.id.includes(id))) {
        const nextProg = Math.min(q.targetCount, q.progress + amount);
        const completed = nextProg >= q.targetCount;
        return { ...q, progress: nextProg, completed };
      }
      return q;
    });

    // Check if any quest newly finished to notify
    const newlyCompleted = updatedQuests.filter(
      (q, idx) => q.completed && !state.quests[idx].completed
    );

    newlyCompleted.forEach((q) => {
      alert(`🏆 Quest Completed: ${q.title}! Reward: +${q.rewardGold} Gold | +${q.rewardGems} Gems!`);
    });

    // Automatically yield rewards
    let goldGain = 0;
    let gemsGain = 0;
    let xpGain = 0;
    newlyCompleted.forEach((q) => {
      goldGain += q.rewardGold;
      gemsGain += q.rewardGems;
      xpGain += q.rewardXp;
    });

    return {
      quests: updatedQuests,
      stats: {
        ...state.stats,
        gold: state.stats.gold + goldGain,
        gems: state.stats.gems + gemsGain,
        xp: state.stats.xp + xpGain
      }
    };
  }),

  claimQuestReward: (id) => {
    // Already instantly claimed automatically in previous trigger but we can double safeguard
  },

  resetQuests: () => set({ quests: INITIAL_QUESTS }),

  loadSavedState: (saved) => set((state) => ({
    inventory: saved.inventory || state.inventory,
    backpackLevel: saved.backpackLevel ?? state.backpackLevel,
    stats: saved.stats || state.stats,
    quests: saved.quests || state.quests,
    creativeMode: saved.creativeMode ?? state.creativeMode,
    playerName: saved.playerName || state.playerName,
    seed: saved.seed || state.seed,
  })),
}));
