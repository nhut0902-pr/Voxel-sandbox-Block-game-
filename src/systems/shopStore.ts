import { create } from 'zustand';
import { ShopItem, ItemStack } from '../types';

interface ShopState {
  items: ShopItem[];
  dailyDealsIds: string[];
  refreshDailyDeals: () => void;
}

const BASE_SHOP_ITEMS: ShopItem[] = [
  // Blocks
  {
    id: 'shop_grass',
    name: 'Grass Block',
    price: 5,
    currency: 'gold',
    rarity: 'common',
    category: 'blocks',
    itemTemplate: { id: 'grass', name: 'Grass Block', count: 16, maxStack: 64, type: 'block', val: 1 },
  },
  {
    id: 'shop_stone',
    name: 'Cobblestone',
    price: 15,
    currency: 'gold',
    rarity: 'common',
    category: 'blocks',
    itemTemplate: { id: 'stone', name: 'Stone Block', count: 16, maxStack: 64, type: 'block', val: 3 },
  },
  {
    id: 'shop_glass',
    name: 'Glass Block',
    price: 30,
    currency: 'gold',
    rarity: 'rare',
    category: 'blocks',
    itemTemplate: { id: 'glass', name: 'Glass', count: 16, maxStack: 64, type: 'block', val: 8 },
  },
  {
    id: 'shop_brick',
    name: 'Decorative Bricks',
    price: 50,
    currency: 'gold',
    rarity: 'rare',
    category: 'blocks',
    itemTemplate: { id: 'brick', name: 'Brick', count: 16, maxStack: 64, type: 'block', val: 9 },
  },
  {
    id: 'shop_obsidian',
    name: 'Obsidian Block',
    price: 150,
    currency: 'gold',
    rarity: 'epic',
    category: 'blocks',
    itemTemplate: { id: 'obsidian', name: 'Obsidian', count: 8, maxStack: 64, type: 'block', val: 10 },
  },
  // Tools
  {
    id: 'shop_iron_pick',
    name: 'Iron Pickaxe',
    price: 250,
    currency: 'gold',
    rarity: 'rare',
    category: 'tools',
    itemTemplate: { id: 'iron_pickaxe', name: 'Iron Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 3 },
  },
  {
    id: 'shop_diamond_pick',
    name: 'Diamond Pickaxe',
    price: 800,
    currency: 'gold',
    rarity: 'epic',
    category: 'tools',
    itemTemplate: { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 5 },
  },
  // Weapons
  {
    id: 'shop_iron_sword',
    name: 'Iron Sword',
    price: 200,
    currency: 'gold',
    rarity: 'rare',
    category: 'weapons',
    itemTemplate: { id: 'iron_sword', name: 'Iron Sword', count: 1, maxStack: 1, type: 'weapon', val: 8 },
  },
  {
    id: 'shop_diamond_sword',
    name: 'Diamond Sword',
    price: 750,
    currency: 'gold',
    rarity: 'epic',
    category: 'weapons',
    itemTemplate: { id: 'diamond_sword', name: 'Diamond Sword', count: 1, maxStack: 1, type: 'weapon', val: 12 },
  },
  // Food
  {
    id: 'shop_apple',
    name: 'Crispy Apple',
    price: 10,
    currency: 'gold',
    rarity: 'common',
    category: 'food',
    itemTemplate: { id: 'apple', name: 'Delicious Apple', count: 5, maxStack: 64, type: 'food', val: 20 },
  },
  {
    id: 'shop_bread',
    name: 'Crusty Bread',
    price: 18,
    currency: 'gold',
    rarity: 'common',
    category: 'food',
    itemTemplate: { id: 'bread', name: 'Bread', count: 5, maxStack: 64, type: 'food', val: 30 },
  },
  // Rare Crystals / Gems items
  {
    id: 'shop_gem_lucky',
    name: 'Lucky Charm Shield',
    price: 5,
    currency: 'gems',
    rarity: 'legendary',
    category: 'cosmetics',
    itemTemplate: { id: 'crystal_charm', name: 'Lucky Gem Charm', count: 1, maxStack: 1, type: 'cosmetic', val: 5 },
  },
  {
    id: 'shop_raw_diamond',
    name: 'Raw Diamond Gem',
    price: 5,
    currency: 'gems',
    rarity: 'legendary',
    category: 'blocks',
    itemTemplate: { id: 'diamond', name: 'Precious Diamond', count: 10, maxStack: 64, type: 'material' as any, val: 0 },
  }
];

export const useShopStore = create<ShopState>((set) => ({
  items: BASE_SHOP_ITEMS,
  dailyDealsIds: ['shop_glass', 'shop_iron_pick', 'shop_bread'],
  refreshDailyDeals: () => {
    // Select 3 random ids from BASE_SHOP_ITEMS
    const shuffled = [...BASE_SHOP_ITEMS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((item) => item.id);
    set({ dailyDealsIds: selected });
  },
}));
