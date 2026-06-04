import React, { useState, useEffect, useRef } from 'react';
import { useInventoryStore, BACKPACK_SIZES, BACKPACK_NAMES, BACKPACK_COSTS } from '../systems/inventoryStore';
import { useShopStore } from '../systems/shopStore';
import { RECIPES } from '../systems/recipeDatabase';
import { BLOCK_CONFIGS, BLOCK_IDS, ItemStack, ShopItem, CraftingRecipe } from '../types';
import { socketService } from '../systems/socketService';
import { audioSystem } from '../systems/audioSystem';
import { 
  Heart, Apple, Zap, Trophy, ShoppingBag, Pickaxe, Backpack, BookOpen, 
  Settings, LogOut, ChevronRight, X, Sparkles, Send, RefreshCw, Feather,
  MessageSquare
} from 'lucide-react';
import { SaveSystem } from '../systems/saveSystem';

interface GameUIProps {
  gpsCoords: string;
  fps: number;
  mobileControls: boolean;
  onExit: () => void;
  onMobileToggle: () => void;
}

export default function GameUI({ gpsCoords, fps, mobileControls, onExit, onMobileToggle }: GameUIProps) {
  const [activeTab, setActiveTab] = useState<null | 'inventory' | 'backpack' | 'shop' | 'crafting' | 'quests' | 'settings'>(null);
  
  // Game state
  const stats = useInventoryStore((state) => state.stats);
  const inventory = useInventoryStore((state) => state.inventory);
  const hotbarIndex = useInventoryStore((state) => state.hotbarIndex);
  const setHotbarIndex = useInventoryStore((state) => state.setHotbarIndex);
  const quests = useInventoryStore((state) => state.quests);
  const backpackLevel = useInventoryStore((state) => state.backpackLevel);
  const upgradeBackpack = useInventoryStore((state) => state.upgradeBackpack);
  const moveItem = useInventoryStore((state) => state.moveItem);
  const splitStack = useInventoryStore((state) => state.splitStack);
  const useFood = useInventoryStore((state) => state.useFood);
  const seed = useInventoryStore((state) => state.seed);
  const roomName = useInventoryStore((state) => state.currentRoom);
  const playerName = useInventoryStore((state) => state.playerName);
  const addItem = useInventoryStore((state) => state.addItem);

  // Shop state
  const shopItems = useShopStore((state) => state.items);
  const dailyDealsIds = useShopStore((state) => state.dailyDealsIds);
  const refreshDailyDeals = useShopStore((state) => state.refreshDailyDeals);
  const [shopCategory, setShopCategory] = useState<'all' | 'blocks' | 'tools' | 'weapons' | 'food' | 'backpacks'>('all');

  // Drag State
  const [dragSlot, setDragSlot] = useState<number | null>(null);

  // Crafting Grid State (3x3 matching)
  const [craftGrid, setCraftGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [craftedOutput, setCraftedOutput] = useState<ItemStack | null>(null);
  const [matchedRecipe, setMatchedRecipe] = useState<CraftingRecipe | null>(null);

  // Chat System State
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string }[]>([
    { sender: 'System', text: 'Welcome to the voxel sandbox chat lobby!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Hook up Sockets chat events
  useEffect(() => {
    socketService.on('chat:received', (msg) => {
      setChatLogs((prev) => [...prev, { sender: msg.sender, text: msg.text }]);
    });
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs]);

  // Handle automatic autosaves every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      SaveSystem.saveGame();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate crafting recipe output dynamically
  useEffect(() => {
    // 1. Identify 2x2 or 3x3 size formula mapping
    // Check if the recipe matches
    let found: CraftingRecipe | null = null;
    
    for (const recipe of RECIPES) {
      let isMatch = true;
      if (recipe.is3x3) {
        // match direct 9 cells
        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const formulaId = recipe.grid[row]?.[col] || null;
          if (craftGrid[i] !== formulaId) {
            isMatch = false;
            break;
          }
        }
      } else {
        // 2x2 local top left quadrant math checking
        const localGrid = [
          craftGrid[0], craftGrid[1],
          craftGrid[3], craftGrid[4]
        ];
        // checking cells 2, 5, 6, 7, 8 must be null for 2x2 formulas
        const otherCellsEmptied = [2, 5, 6, 7, 8].every(idx => craftGrid[idx] === null);

        if (!otherCellsEmptied) {
          isMatch = false;
        } else {
          for (let i = 0; i < 4; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const formulaId = recipe.grid[row]?.[col] || null;
            if (localGrid[i] !== formulaId) {
              isMatch = false;
              break;
            }
          }
        }
      }

      if (isMatch) {
        found = recipe;
        break;
      }
    }

    if (found) {
      setMatchedRecipe(found);
      setCraftedOutput(found.result);
    } else {
      setMatchedRecipe(null);
      setCraftedOutput(null);
    }
  }, [craftGrid]);

  const handleCraft = () => {
    if (!matchedRecipe || !craftedOutput) return;

    // Verify inventory slot availability
    const success = addItem(craftedOutput);
    if (!success) {
      alert('⚠️ Your inventory is too packed! Clear space first.');
      return;
    }

    // Deduct exact 1 unit of each craft items in inventory
    const updatedGrid = [...craftGrid];
    for (let i = 0; i < 9; i++) {
      const neededId = updatedGrid[i];
      if (neededId) {
        // Deduct 1 unit from inventory
        useInventoryStore.getState().removeItem(neededId, 1);
      }
    }

    // Refresh layout grid items count checks if still loaded (basic client representation clear-out)
    // Simply clear the visual grid coordinates
    setCraftGrid(Array(9).fill(null));
    useInventoryStore.getState().triggerQuestProgress('craft', craftedOutput.id);
    audioSystem.playPlaceBlock();
  };

  // Drag & drop logic slots handlers
  const handleSlotDragStart = (idx: number) => {
    setDragSlot(idx);
  };

  const handleSlotDrop = (targetIdx: number) => {
    if (dragSlot !== null && dragSlot !== targetIdx) {
      moveItem(dragSlot, targetIdx);
    }
    setDragSlot(null);
  };

  const handleSlotRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    // Split Stack triggers
    const sourceItem = inventory[idx];
    if (sourceItem && sourceItem.count > 1) {
      // Find nearest empty cell to split into
      let freeIdx = -1;
      const totalSize = 36 + BACKPACK_SIZES[backpackLevel];
      for (let i = 0; i < totalSize; i++) {
        if (inventory[i] === null) {
          freeIdx = i;
          break;
        }
      }
      if (freeIdx !== -1) {
        splitStack(idx, freeIdx);
        audioSystem.playPlaceBlock();
      }
    }
  };

  // Buy Shop selection
  const buyItem = (shopItem: ShopItem) => {
    const isGems = shopItem.currency === 'gems';
    const store = useInventoryStore.getState();
    const finalPrice = shopItem.discountPercent 
      ? Math.floor(shopItem.price * (1 - shopItem.discountPercent / 100)) 
      : shopItem.price;

    if (isGems) {
      if (store.stats.gems >= finalPrice) {
        const added = store.addItem(shopItem.itemTemplate);
        if (added) {
          store.spendGems(finalPrice);
          audioSystem.playPlaceBlock();
        } else {
          alert('🚫 No inventory space left.');
        }
      } else {
        alert('❌ Need more Gems!');
      }
    } else {
      if (store.stats.gold >= finalPrice) {
        const added = store.addItem(shopItem.itemTemplate);
        if (added) {
          store.spendGold(finalPrice);
          audioSystem.playPlaceBlock();
        } else {
          alert('🚫 No inventory space left.');
        }
      } else {
        alert('❌ Need more Gold!');
      }
    }
  };

  // Sell block item to make money
  const sellItemFromSlot = (idx: number) => {
    const item = inventory[idx];
    if (!item) return;

    // Define mock baseline recycle prices
    let value = 2; // general blocks
    if (item.id === 'diamond' || item.id === 'diamond_pickaxe') value = 180;
    else if (item.id === 'gold_ore') value = 25;
    else if (item.id === 'iron_ore') value = 10;
    else if (item.id === 'stone') value = 4;

    const payout = value * item.count;
    useInventoryStore.getState().earnGold(payout);
    useInventoryStore.getState().removeItem(item.id, item.count);
    audioSystem.playPlaceBlock();
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    socketService.emit('chat:send', chatInput.trim());
    setChatInput('');
  };

  // Render visual dynamic block inventory color maps
  const getBlockColorHex = (id: string) => {
    const matches = Object.values(BLOCK_CONFIGS).find((c) => c.itemId === id);
    return matches?.color ?? '#8e8e93';
  };

  const getRarityClass = (rarity?: string) => {
    switch (rarity) {
      case 'rare': return 'border-blue-500/60 bg-blue-950/20 text-blue-300';
      case 'epic': return 'border-purple-500/60 bg-purple-950/20 text-purple-300';
      case 'legendary': return 'border-yellow-500/65 bg-yellow-950/20 text-yellow-300 animate-pulse';
      default: return 'border-white/10 bg-neutral-800/40 text-neutral-300';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-sans select-none z-35">
      
      {/* TOP HEADER: HUD stats bar, position tracking metrics, active players, and Chat logs toggle button */}
      <div className="w-full h-1/6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-900/65 border border-white/5 shadow-xl text-neutral-200 pointer-events-auto">
          
          {/* Health point meter row */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <div className="w-28 bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${stats.health}%` }} />
            </div>
            <span className="text-xs font-mono font-bold leading-none">{stats.health.toFixed(0)}</span>
          </div>

          {/* Hunger meter row */}
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-amber-500 fill-amber-500" />
            <div className="w-28 bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${stats.hunger}%` }} />
            </div>
            <span className="text-xs font-mono font-bold leading-none">{stats.hunger.toFixed(0)}</span>
          </div>

          {/* Gold Balance bar */}
          <div className="flex items-center gap-3 text-xs pt-1.5 border-t border-white/5">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-bold font-sans">💰</span>
              <span className="font-mono font-bold text-yellow-100">{stats.gold}g</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-indigo-400 font-bold font-sans">💎</span>
              <span className="font-mono font-bold text-indigo-100">{stats.gems}g</span>
            </div>
          </div>
        </div>

        {/* Global info overlay badge */}
        <div className="flex flex-col items-end gap-1 p-2 rounded-xl bg-neutral-900/65 border border-white/5 text-right font-mono text-xs text-neutral-300 shadow-md pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans text-neutral-400">FPS:</span>
            <span className="text-emerald-300 font-bold">{fps}</span>
          </div>
          <div>{gpsCoords}</div>
          <div className="text-[10px] text-neutral-400 font-sans">Seed: <span className="font-mono text-neutral-200">{seed}</span> | Room: <span className="font-mono text-neutral-200">{roomName}</span></div>
          <div className="text-[10px] text-neutral-400 font-sans">Username: <span className="text-yellow-300 font-mono font-bold">{playerName}</span></div>
        </div>
      </div>

      {/* CORE INNER ACTIVE GRID CONTAINER: INVENTORY, SHOP, CRAFTERS AND MORE */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center p-2 pointer-events-none">
        {activeTab && (
          <div className="w-full max-h-[85%] bg-neutral-900/95 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative pointer-events-auto">
            
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                {activeTab === 'inventory' && <Pickaxe className="w-5 h-5 text-yellow-400" />}
                {activeTab === 'backpack' && <Backpack className="w-5 h-5 text-amber-500" />}
                {activeTab === 'shop' && <ShoppingBag className="w-5 h-5 text-emerald-400" />}
                {activeTab === 'crafting' && <BookOpen className="w-5 h-5 text-blue-400" />}
                {activeTab === 'quests' && <Trophy className="w-5 h-5 text-pink-400" />}
                {activeTab === 'settings' && <Settings className="w-5 h-5 text-neutral-400" />}
                <h3 className="text-white font-bold capitalize font-sans">{activeTab} Details</h3>
              </div>
              <button 
                id="btn-close-tab"
                onClick={() => setActiveTab(null)} 
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content areas routing switcher */}
            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
              
              {/* 1. INVENTORY SYSTEM PANEL */}
              {activeTab === 'inventory' && (
                <div className="flex flex-col gap-4">
                  <span className="text-neutral-400 text-xs">
                    Drag items to rearrange slots. Double-click or select "Eat" on food items to regain health. Right-click stack to split.
                  </span>
                  
                  {/* Standard Grid of 36 basic backpack slots */}
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                    {inventory.slice(0, 36).map((item, idx) => (
                      <div 
                        key={idx}
                        id={`inv-slot-${idx}`}
                        draggable={!!item}
                        onDragStart={() => handleSlotDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleSlotDrop(idx)}
                        onContextMenu={(e) => handleSlotRightClick(e, idx)}
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-all ${
                          getRarityClass(item?.rarity)
                        } hover:border-white/30 relative select-none cursor-grab active:cursor-grabbing`}
                      >
                        {item ? (
                          <>
                            {/* Visual representation color dot indicating block/item type */}
                            <div 
                              className="w-7 h-7 rounded-sm shadow-xs border border-black/20 flex items-center justify-center font-mono font-black text-[10px]"
                              style={{ backgroundColor: item.type === 'block' ? getBlockColorHex(item.id) : '#3a3a44' }}
                            >
                              {item.type !== 'block' && '🛠️'}
                            </div>
                            <span className="text-[10px] text-white font-bold truncate mt-1 max-w-full text-center leading-none">{item.name}</span>
                            <span className="absolute bottom-1 right-1 text-white text-xs font-mono bg-neutral-900/60 px-0.5 rounded-sm scale-90 font-bold">{item.count}</span>
                            
                            {/* Actions block label */}
                            <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-neutral-950/90 rounded-lg flex flex-col p-1 justify-between transition-all">
                              <span className="text-[8px] text-neutral-300 truncate font-semibold">{item.name}</span>
                              {item.type === 'food' ? (
                                <button 
                                  onTouchStart={() => useFood(idx)}
                                  onClick={() => useFood(idx)}
                                  className="w-full text-[8px] bg-amber-500 hover:bg-amber-400 text-black rounded-xs font-bold font-sans py-0.5 cursor-pointer leading-none"
                                >
                                  Eat
                                </button>
                              ) : (
                                <button 
                                  onClick={() => sellItemFromSlot(idx)}
                                  className="w-full text-[8px] bg-yellow-400 hover:bg-yellow-300 text-black rounded-xs font-bold font-sans py-0.5 cursor-pointer leading-none"
                                >
                                  Recycle
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-[9px] text-neutral-600 font-mono scale-90">({idx+1})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. BACKPACK UPGRADE CONTAINER */}
              {activeTab === 'backpack' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-neutral-850 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Active Backpack: {BACKPACK_NAMES[backpackLevel]}</h4>
                      <p className="text-neutral-400 text-xs mt-1">Allows {BACKPACK_SIZES[backpackLevel]} additional items on grid space slots.</p>
                    </div>
                    {backpackLevel < 5 ? (
                      <button 
                        id="btn-upgrade-backpack"
                        onClick={() => {
                          const cost = BACKPACK_COSTS[backpackLevel + 1];
                          const ok = upgradeBackpack(backpackLevel + 1, cost);
                          if (ok) {
                            alert(`🎒 Backpack upgraded successfully to ${BACKPACK_NAMES[backpackLevel + 1]}!`);
                          } else {
                            alert('❌ Insufficient coins gold for this upgrade!');
                          }
                        }}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 font-bold text-neutral-900 rounded-lg cursor-pointer transition-all border shadow-xs text-xs"
                      >
                        Upgrade: {BACKPACK_COSTS[backpackLevel + 1]}g
                      </button>
                    ) : (
                      <span className="text-amber-400 font-bold text-xs bg-amber-950/30 px-3 py-1 rounded-full border border-amber-500/20">Max Vault level reached!</span>
                    )}
                  </div>

                  {/* Backpack accessory slots */}
                  <h4 className="text-white fill-white font-bold text-xs mt-2 flex items-center gap-1.5"><Backpack className="w-4 h-4" /> Additional Backpack Slots</h4>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mt-1 bg-neutral-850 p-2.5 rounded-xl border border-white/5">
                    {BACKPACK_SIZES[backpackLevel] > 0 ? (
                      inventory.slice(36, 36 + BACKPACK_SIZES[backpackLevel]).map((item, idx) => (
                        <div 
                          key={idx}
                          id={`bp-slot-${idx}`}
                          draggable={!!item}
                          onDragStart={() => handleSlotDragStart(36 + idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleSlotDrop(36 + idx)}
                          onContextMenu={(e) => handleSlotRightClick(e, 36 + idx)}
                          className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-all ${
                            getRarityClass(item?.rarity)
                          } hover:border-white/30 relative select-none cursor-grab active:cursor-grabbing bg-neutral-800/20`}
                        >
                          {item ? (
                            <>
                              <div 
                                className="w-7 h-7 rounded-sm border border-black/20"
                                style={{ backgroundColor: item.type === 'block' ? getBlockColorHex(item.id) : '#3a3a44' }}
                              />
                              <span className="text-[10px] text-white truncate max-w-full text-center mt-1 leading-none">{item.name}</span>
                              <span className="absolute bottom-1 right-1 text-white text-xs font-mono bg-neutral-900/60 px-0.5 rounded-sm scale-90 font-bold">{item.count}</span>
                            </>
                          ) : (
                            <span className="text-[8px] text-neutral-700 font-mono">+{idx+1}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-neutral-500 text-xs">
                        Buy a Backpack upgrade above to unlock extra carry-capacities.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. CRAFTING 2x2 and 3x3 SYSTEM */}
              {activeTab === 'crafting' && (
                <div className="flex flex-col sm:flex-row gap-6">
                  
                  {/* Core 3x3 grid simulator */}
                  <div className="flex flex-col items-center bg-neutral-850 p-4 border border-white/5 rounded-2xl w-full sm:w-1/2">
                    <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-1"><BookOpen className="w-4 h-4 text-blue-400" /> Interactive Formula Matrix</h4>
                    
                    <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-3 rounded-xl border border-white/5">
                      {craftGrid.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            // Cylindrical selection: click item on active hotbar in inventory to place inside crafting grid
                            const selectedHotbarBlock = inventory[hotbarIndex];
                            if (selectedHotbarBlock) {
                              const nextGrid = [...craftGrid];
                              nextGrid[idx] = selectedHotbarBlock.id;
                              setCraftGrid(nextGrid);
                              audioSystem.playPlaceBlock();
                            } else {
                              const nextGrid = [...craftGrid];
                              nextGrid[idx] = null;
                              setCraftGrid(nextGrid);
                            }
                          }}
                          className="w-16 h-16 rounded-xl border border-white/5 hover:border-blue-400 bg-neutral-800/40 hover:bg-neutral-800/80 cursor-pointer flex flex-col items-center justify-center relative transition-all"
                        >
                          {item ? (
                            <>
                              <div 
                                className="w-7 h-7 rounded-md"
                                style={{ backgroundColor: getBlockColorHex(item) }}
                              />
                              <span className="text-[10px] text-white font-bold text-center mt-1 scale-90 truncate max-w-full leading-none">{item}</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-neutral-700 font-bold">Grid</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCraftGrid(Array(9).fill(null))}
                      className="mt-3 text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-md cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Clear Formula
                    </button>
                  </div>

                  {/* Product Output Panel */}
                  <div className="flex-1 bg-neutral-850 p-4 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-white font-bold text-xs mb-3">Craft Product Output</h4>
                      {craftedOutput ? (
                        <div className="flex items-center gap-4 bg-neutral-900 p-3 rounded-xl border border-blue-500/20">
                          <div 
                            className="w-14 h-14 rounded-xl shadow-md flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: craftedOutput.type === 'block' ? getBlockColorHex(craftedOutput.id) : '#3a3a44' }}
                          >
                            {craftedOutput.type !== 'block' && '🛠️'}
                          </div>
                          <div>
                            <span className="text-white font-bold block">{craftedOutput.name} <span className="text-blue-400 text-xs">x{craftedOutput.count}</span></span>
                            <span className="text-neutral-400 text-xs mt-1 block">{matchedRecipe?.description}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-white/10 p-6 rounded-xl text-center text-neutral-500 text-xs">
                          Place items from active hotbar onto Left matrix to uncover recipes.
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleCraft}
                      disabled={!craftedOutput}
                      className={`w-full py-2.5 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-1 cursor-pointer select-none border border-neutral-900 shadow-sm transition-all ${
                        craftedOutput 
                          ? 'bg-blue-400 hover:bg-blue-300 text-black active:scale-95' 
                          : 'bg-neutral-800 text-neutral-500 pointer-events-none'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> CRAFT WEAPON / TOOL
                    </button>
                  </div>
                </div>
              )}

              {/* 4. IN-GAME SHOP SYSTEM */}
              {activeTab === 'shop' && (
                <div className="flex flex-col gap-4">
                  {/* Category switcher */}
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['all', 'blocks', 'tools', 'weapons', 'food'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setShopCategory(cat)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          shopCategory === cat 
                            ? 'bg-emerald-500 text-black font-sans' 
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Deals info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopItems
                      .filter((item) => shopCategory === 'all' || item.category === shopCategory)
                      .map((item) => {
                        const isDailyDeal = dailyDealsIds.includes(item.id);
                        const finalPrice = isDailyDeal ? Math.floor(item.price * 0.75) : item.price; // 25% discount deal
                        
                        return (
                          <div 
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-xl border bg-neutral-850 transition-all ${
                              isDailyDeal ? 'border-yellow-400/40 bg-yellow-950/5' : 'border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-11 h-11 rounded-lg flex items-center justify-center border border-black/20"
                                style={{ backgroundColor: item.itemTemplate.type === 'block' ? getBlockColorHex(item.itemTemplate.id) : '#3a3a44' }}
                              >
                                {item.itemTemplate.type !== 'block' && '🛠️'}
                              </div>
                              <div>
                                <span className="text-white font-bold font-sans text-xs mr-1">{item.name}</span>
                                {isDailyDeal && <span className="text-[9px] bg-yellow-400 text-black font-extrabold px-1.5 py-0.5 rounded-full scale-90 mb-1 leading-none">25% OFF</span>}
                                <span className="text-neutral-400 text-[10px] block mt-0.5">Quantity: {item.itemTemplate.count} units</span>
                              </div>
                            </div>

                            <button 
                              onClick={() => buyItem({ ...item, discountPercent: isDailyDeal ? 25 : undefined })}
                              className="px-3 py-1.5 bg-neutral-900 border border-white/10 hover:border-emerald-400 text-emerald-300 active:scale-95 transition-all text-xs rounded-lg cursor-pointer font-bold font-sans flex items-center gap-1"
                            >
                              <span>{finalPrice}</span>
                              <span className="scale-90">{item.currency === 'gems' ? '💎' : '🪙'}</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 5. QUESTS & ACHIEVEMENT TRACKER */}
              {activeTab === 'quests' && (
                <div className="flex flex-col gap-3">
                  {quests.map((q) => (
                    <div 
                      key={q.id}
                      className={`p-3.5 rounded-xl border bg-neutral-850/60 flex flex-col gap-2 ${
                        q.completed ? 'border-pink-500/20 bg-pink-950/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-bold text-xs">{q.title}</span>
                          <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono scale-90 ml-2 font-bold">{q.category}</span>
                          <p className="text-neutral-400 text-[10.5px] mt-1 pr-4">{q.description}</p>
                        </div>
                        <div className="text-right">
                          {q.completed ? (
                            <span className="text-xs text-pink-400 font-extrabold flex items-center gap-1">🏆 Done</span>
                          ) : (
                            <span className="text-neutral-400 text-xs font-mono font-bold">{q.progress} / {q.targetCount}</span>
                          )}
                        </div>
                      </div>

                      {/* Progress slider bar representation */}
                      <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-pink-500 h-full transition-all duration-300" style={{ width: `${(q.progress / q.targetCount) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-neutral-400 pt-1 border-t border-white/5">
                        <span className="font-mono">Reward: +{q.rewardXp}xp</span>
                        <span className="text-yellow-400 font-bold">🪙 +{q.rewardGold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. SETTINGS PANEL */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-neutral-850 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Responsive Mobile Joysticks</h4>
                      <p className="text-neutral-400 text-xs mt-1">Displays virtual walking joysticks on screen margins.</p>
                    </div>
                    <button 
                      onClick={onMobileToggle}
                      className={`px-4 py-1.5 text-xs font-bold cursor-pointer rounded-lg border shadow-xs transition-all ${
                        mobileControls 
                          ? 'bg-blue-400 border-blue-700 text-neutral-900' 
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mobileControls ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="bg-neutral-850 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Wavelength Sound Engine</h4>
                      <p className="text-neutral-400 text-xs mt-1">Triggers procedural synthesiser wave frequencies on actions.</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-500/10">Active (WebAudio)</span>
                  </div>

                  <div className="bg-neutral-850 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">Save & Overwrites</h4>
                      <p className="text-neutral-400 text-xs mt-1">Resets your voxel world blocks data and backpack levels permanently.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('🚨 Reset all saved blocks and progress levels? This action cannot be undone!')) {
                          SaveSystem.resetGame();
                        }
                      }}
                      className="px-4 py-1.5 bg-red-500/80 hover:bg-red-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Wipe Data
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* CHAT LOG SCREEN OVERLAY BAR */}
      <div className="absolute left-4 bottom-22 w-72 max-h-52 bg-neutral-950/60 backdrop-blur-xs rounded-xl flex flex-col p-2.5 border border-white/5 pointer-events-auto shadow-lg text-xs font-sans">
        <div 
          onClick={() => setShowChat(!showChat)}
          className="flex items-center justify-between cursor-pointer border-b border-white/5 pb-1 mb-1 text-neutral-400 hover:text-white"
        >
          <span className="font-bold flex items-center gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Room Chat Rooms</span>
          <span className="text-[9px] underline text-neutral-400">{showChat ? 'Hide' : 'Show Log'}</span>
        </div>

        {showChat && (
          <>
            <div className="flex-1 overflow-y-auto max-h-32 mb-2 flex flex-col gap-1 pr-1">
              {chatLogs.map((log, idx) => (
                <div key={idx} className="leading-snug">
                  <span className={`font-mono font-bold mr-1 ${log.sender === 'System' ? 'text-amber-400' : 'text-blue-300'}`}>
                    {log.sender}:
                  </span>
                  <span className="text-neutral-200">{log.text}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={sendChatMessage} className="flex gap-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type messages..."
                className="flex-1 bg-neutral-900 border border-white/10 rounded-md py-1 px-2 text-white font-sans text-[11px] outline-none focus:border-blue-400"
              />
              <button 
                id="btn-send-chat"
                type="submit" 
                className="p-1 px-2 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* BOTTOM CONTROL SYSTEM PANEL: HOTBAR HUD */}
      <div className="w-full flex flex-col gap-1.5 items-center pb-2 pointer-events-none">
        
        {/* Navigation panel selectors */}
        <div className="flex gap-1.5 bg-neutral-950/70 border border-white/10 rounded-full px-3 py-1 text-xs select-none pointer-events-auto">
          <button 
            id="tab-inventory"
            onClick={() => setActiveTab(activeTab === 'inventory' ? null : 'inventory')}
            className={`flex items-center gap-1 p-1 px-2 rounded-full cursor-pointer transition-all ${
              activeTab === 'inventory' ? 'bg-yellow-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inv</span>
          </button>
          
          <button 
            id="tab-backpack"
            onClick={() => setActiveTab(activeTab === 'backpack' ? null : 'backpack')}
            className={`flex items-center gap-1 p-1 px-2 rounded-full cursor-pointer transition-all ${
              activeTab === 'backpack' ? 'bg-amber-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Backpack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bag ({backpackLevel})</span>
          </button>

          <button 
            id="tab-crafting"
            onClick={() => setActiveTab(activeTab === 'crafting' ? null : 'crafting')}
            className={`flex items-center gap-1 p-1 px-2 rounded-full cursor-pointer transition-all ${
              activeTab === 'crafting' ? 'bg-blue-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Craft</span>
          </button>

          <button 
            id="tab-shop"
            onClick={() => setActiveTab(activeTab === 'shop' ? null : 'shop')}
            className={`flex items-center gap-1 p-1 px-2 rounded-full cursor-pointer transition-all ${
              activeTab === 'shop' ? 'bg-emerald-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shop</span>
          </button>

          <button 
            id="tab-quests"
            onClick={() => setActiveTab(activeTab === 'quests' ? null : 'quests')}
            className={`flex items-center gap-1 p-1 px-2 rounded-full cursor-pointer transition-all ${
              activeTab === 'quests' ? 'bg-pink-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quests</span>
          </button>

          <button 
            id="tab-settings"
            onClick={() => setActiveTab(activeTab === 'settings' ? null : 'settings')}
            className={`flex items-center p-1 px-1.5 rounded-full cursor-pointer transition-all ${
              activeTab === 'settings' ? 'bg-neutral-400 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button 
            id="tab-exit"
            onClick={onExit}
            className="flex items-center p-1 px-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded-full cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hotbar Slots indicator */}
        <div className="flex gap-1.5 bg-neutral-900/80 border border-white/10 rounded-2xl p-2 shadow-xl pointer-events-auto">
          {inventory.slice(0, 9).map((item, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setHotbarIndex(idx);
                audioSystem.playPlaceBlock();
              }}
              className={`w-11 sm:w-12 aspect-square rounded-xl border flex flex-col items-center justify-center relative cursor-key-select hover:border-white/30 transition-all ${
                idx === hotbarIndex 
                  ? 'border-yellow-400 bg-yellow-950/30 scale-105 shadow-md shadow-yellow-500/10' 
                  : getRarityClass(item?.rarity)
              }`}
            >
              {item ? (
                <>
                  <div 
                    className="w-4 sm:w-5 aspect-square rounded-xs"
                    style={{ backgroundColor: item.type === 'block' ? getBlockColorHex(item.id) : '#3a3a44' }}
                  />
                  <span className="absolute bottom-0.5 right-1 text-[9px] text-white font-mono bg-neutral-950/40 px-0.5 rounded-xs font-black">{item.count}</span>
                </>
              ) : (
                <span className="text-[10px] text-neutral-700 font-black">{idx + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
