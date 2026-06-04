import { CraftingRecipe } from '../types';

export const RECIPES: CraftingRecipe[] = [
  {
    id: 'planks',
    name: 'Wooden Planks',
    description: 'Basic building block and material.',
    is3x3: false,
    grid: [
      ['wood', null],
      [null, null]
    ],
    result: { id: 'planks', name: 'Planks', count: 4, maxStack: 64, type: 'block', val: 5 }
  },
  {
    id: 'stick',
    name: 'Stick',
    description: 'Used for crafting tools.',
    is3x3: false,
    grid: [
      ['planks', null],
      ['planks', null]
    ],
    result: { id: 'stick', name: 'Stick', count: 4, maxStack: 64, type: 'tool' }
  },
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    description: 'Enables 3x3 advanced crafting grids.',
    is3x3: false,
    grid: [
      ['planks', 'planks'],
      ['planks', 'planks']
    ],
    result: { id: 'crafting_table', name: 'Crafting Table', count: 1, maxStack: 64, type: 'block' }
  },
  {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A weak wooden weapon. Attack: +3',
    is3x3: true,
    grid: [
      ['planks', null, null],
      ['planks', null, null],
      ['stick', null, null]
    ],
    result: { id: 'wood_sword', name: 'Wooden Sword', count: 1, maxStack: 1, type: 'weapon', val: 3 }
  },
  {
    id: 'stone_sword',
    name: 'Stone Sword',
    description: 'A classic rock weapon. Attack: +5',
    is3x3: true,
    grid: [
      ['stone', null, null],
      ['stone', null, null],
      ['stick', null, null]
    ],
    result: { id: 'stone_sword', name: 'Stone Sword', count: 1, maxStack: 1, type: 'weapon', val: 5 }
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A shiny steel blade. Attack: +8',
    is3x3: true,
    grid: [
      ['iron_ingot', null, null],
      ['iron_ingot', null, null],
      ['stick', null, null]
    ],
    result: { id: 'iron_sword', name: 'Iron Sword', count: 1, maxStack: 1, type: 'weapon', val: 8, rarity: 'rare' }
  },
  {
    id: 'diamond_sword',
    name: 'Ultimate Diamond Sword',
    description: 'Unbelievably sharp. Attack: +12',
    is3x3: true,
    grid: [
      ['diamond', null, null],
      ['diamond', null, null],
      ['stick', null, null]
    ],
    result: { id: 'diamond_sword', name: 'Diamond Sword', count: 1, maxStack: 1, type: 'weapon', val: 12, rarity: 'epic' }
  },
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    description: 'Extracts stone-based materials slowly.',
    is3x3: true,
    grid: [
      ['planks', 'planks', 'planks'],
      [null, 'stick', null],
      [null, 'stick', null]
    ],
    result: { id: 'wood_pickaxe', name: 'Wooden Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 1 }
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    description: 'Can mine iron ores.',
    is3x3: true,
    grid: [
      ['stone', 'stone', 'stone'],
      [null, 'stick', null],
      [null, 'stick', null]
    ],
    result: { id: 'stone_pickaxe', name: 'Stone Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 2 }
  },
  {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    description: 'Can mine gold and diamond ores.',
    is3x3: true,
    grid: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      [null, 'stick', null],
      [null, 'stick', null]
    ],
    result: { id: 'iron_pickaxe', name: 'Iron Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 3, rarity: 'rare' }
  },
  {
    id: 'diamond_pickaxe',
    name: 'Diamond Pickaxe',
    description: 'Extremely fast. Can mine anything including obsidian.',
    is3x3: true,
    grid: [
      ['diamond', 'diamond', 'diamond'],
      [null, 'stick', null],
      [null, 'stick', null]
    ],
    result: { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', count: 1, maxStack: 1, type: 'tool', val: 5, rarity: 'epic' }
  },
  {
    id: 'bread',
    name: 'Bread',
    description: 'Restores +30 Hunger.',
    is3x3: false,
    grid: [
      ['wheat', 'wheat'],
      [null, null]
    ],
    result: { id: 'bread', name: 'Bread', count: 1, maxStack: 64, type: 'food', val: 30 }
  },
  {
    id: 'apple_pie',
    name: 'Apple Pie',
    description: 'Restores +50 Hunger and +20 Health.',
    is3x3: true,
    grid: [
      ['apple', 'sweet_berries', 'apple'],
      ['wheat', 'sugar', 'wheat'],
      [null, null, null]
    ],
    result: { id: 'apple_pie', name: 'Apple Pie', count: 1, maxStack: 16, type: 'food', val: 50 }
  },
  {
    id: 'diamond_chestplate',
    name: 'Diamond Chestplate',
    description: 'Dense blue armor. Block damage resistance.',
    is3x3: true,
    grid: [
      ['diamond', null, 'diamond'],
      ['diamond', 'diamond', 'diamond'],
      ['diamond', 'diamond', 'diamond']
    ],
    result: { id: 'diamond_chestplate', name: 'Diamond Chestplate', count: 1, maxStack: 1, type: 'armor', val: 8, rarity: 'epic' }
  }
];
