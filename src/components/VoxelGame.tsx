import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CW,
  CH,
  BLK,
  BL,
  ITM,
  SHOP,
  Noise,
  WGen,
  Chunk,
  CM,
  Player,
  Entity,
  DN,
  rc,
  synth,
  Dev,
  sh
} from '../systems/voxelCore';
import { socketService } from '../systems/socketService';
import { voiceManager } from '../systems/VoiceChat';
import { audioSystem } from '../systems/audioSystem';

/* ─── Types & Interfaces ─── */
export interface GameOptions {
  name: string;
  seed: string;
  mode: 'creative' | 'survival' | 'adventure' | 'treasure';
  difficulty?: 'easy' | 'normal' | 'hard' | 'extreme';
  biome: string;
  botCount: string;
  room: string;
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  avatarSkin: 'robot_soldier' | 'castle_char' | 'zombie_shambler';
  companionPet: 'none' | 'labrador' | 'poodle' | 'robot_drone';
}

interface CraftingRecipe {
  resultId: string;
  resultType: 'block' | 'item';
  resultName: string;
  resultEmoji: string;
  count: number;
  ingredients: { id: string; type: 'block' | 'item'; name: string; req: number }[];
}

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    resultId: 'sw1',
    resultType: 'item',
    resultName: 'Kiếm Gỗ',
    resultEmoji: '🗡️',
    count: 1,
    ingredients: [{ id: '6', type: 'block', name: 'Gỗ Tròn', req: 3 }]
  },
  {
    resultId: 'sw2',
    resultType: 'item',
    resultName: 'Kiếm Đá',
    resultEmoji: '⚔️',
    count: 1,
    ingredients: [
      { id: '6', type: 'block', name: 'Gỗ Tròn', req: 1 },
      { id: '3', type: 'block', name: 'Đá Cuội', req: 3 }
    ]
  },
  {
    resultId: 'knife',
    resultType: 'item',
    resultName: 'Dao Thép',
    resultEmoji: '🔪',
    count: 1,
    ingredients: [
      { id: '6', type: 'block', name: 'Gỗ Tròn', req: 1 },
      { id: '3', type: 'block', name: 'Đá Cuội', req: 2 },
      { id: '11', type: 'block', name: 'Hắc Diện Thạch', req: 1 }
    ]
  },
  {
    resultId: 'sw4',
    resultType: 'item',
    resultName: 'Kiếm Kim Cương',
    resultEmoji: '💎⚔️',
    count: 1,
    ingredients: [
      { id: '15', type: 'block', name: 'Kim Cương', req: 2 },
      { id: '6', type: 'block', name: 'Gỗ Tròn', req: 1 }
    ]
  },
  {
    resultId: 'pistol',
    resultType: 'item',
    resultName: 'Súng Lục Sát Thương Cao',
    resultEmoji: '🔫',
    count: 1,
    ingredients: [
      { id: '11', type: 'block', name: 'Hắc Diện Thạch', req: 2 },
      { id: '3', type: 'block', name: 'Đá Cuội', req: 4 }
    ]
  },
  {
    resultId: 'rifle',
    resultType: 'item',
    resultName: 'Súng Trường Liên Thanh',
    resultEmoji: '🔫︻╦╤─',
    count: 1,
    ingredients: [
      { id: 'pistol', type: 'item', name: 'Súng Lục', req: 1 },
      { id: '11', type: 'block', name: 'Hắc Diện Thạch', req: 3 },
      { id: '14', type: 'block', name: 'Quặng Vàng', req: 4 }
    ]
  },
  {
    resultId: 'bread',
    resultType: 'item',
    resultName: 'Bánh Mì Thơm Ngon',
    resultEmoji: '🍞',
    count: 2,
    ingredients: [{ id: '1', type: 'block', name: 'Cỏ Xanh', req: 4 }]
  },
  {
    resultId: 'wings',
    resultType: 'item',
    resultName: 'Cánh Phượng Hoàng',
    resultEmoji: '🪽',
    count: 1,
    ingredients: [
      { id: '12', type: 'block', name: 'Hoa Anh Đào', req: 6 },
      { id: '10', type: 'block', name: 'Mảnh Kính', req: 3 }
    ]
  },
  {
    resultId: 'pot_hp',
    resultType: 'item',
    resultName: 'Quả Cầu Hồi Máu',
    resultEmoji: '🧪',
    count: 1,
    ingredients: [
      { id: '7', type: 'block', name: 'Lá Cây', req: 5 }
    ]
  },
  {
    resultId: 'pot_spd',
    resultType: 'item',
    resultName: 'Băng Dược Tăng Tốc',
    resultEmoji: '⚗️',
    count: 1,
    ingredients: [
      { id: '8', type: 'block', name: 'Tuyết', req: 4 }
    ]
  },
  {
    resultId: 'tesla',
    resultType: 'item',
    resultName: 'Súng Tesla Sấm Sét',
    resultEmoji: '⚡🔫',
    count: 1,
    ingredients: [
      { id: '14', type: 'block', name: 'Quặng Vàng', req: 5 },
      { id: '11', type: 'block', name: 'Hắc Diện Thạch', req: 3 },
      { id: '15', type: 'block', name: 'Kim Cương', req: 2 }
    ]
  },
  {
    resultId: 'doom',
    resultType: 'item',
    resultName: 'Rìu Diệt Vong Thần Thoại',
    resultEmoji: '🪓🔥',
    count: 1,
    ingredients: [
      { id: '11', type: 'block', name: 'Hắc Diện Thạch', req: 5 },
      { id: '15', type: 'block', name: 'Kim Cương', req: 4 }
    ]
  },
  {
    resultId: 'plat_shield',
    resultType: 'item',
    resultName: 'Khiên Vệ Thần Thượng Cổ',
    resultEmoji: '🛡️✨',
    count: 1,
    ingredients: [
      { id: '14', type: 'block', name: 'Quặng Vàng', req: 6 },
      { id: '10', type: 'block', name: 'Mảnh Kính', req: 4 }
    ]
  }
];

interface VoxelGameProps {
  options: GameOptions;
  onBackToLanding?: () => void;
}

export default function VoxelGame({ options, onBackToLanding }: VoxelGameProps) {
  /* ─── UI Router states ─── */
  const [isPlaying, setIsPlaying] = useState(false);
  const [opts, setOpts] = useState<GameOptions>(options);

  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
    (window as any).gameOpts = opts;
  }, [opts]);

  /* ─── Chat system states ─── */
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string }[]>([
    { sender: 'Hệ thống', text: 'Chào mừng đến với sảnh game VOXELVERSE!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  /* ─── Position tracking for multiplayer sync ─── */
  const lastEmitPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastEmitYaw = useRef<number>(0);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ─── HUD Sync React states ─── */
  const [fps, setFps] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [coordsText, setCoordsText] = useState('0, 0, 0');
  const [timeLabel, setTimeLabel] = useState('12:00');
  const [timePercent, setTimePercent] = useState(35);
  const [survivalDay, setSurvivalDay] = useState(1);
  const [isNight, setIsNight] = useState(false);
  const [goldCount, setGoldCount] = useState(0);
  const [hp, setHp] = useState(20);
  const [mhp, setMhp] = useState(20);
  const [hunger, setHunger] = useState(20);
  const [xpPercent, setXpPercent] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [equippedWpn, setEquippedWpn] = useState<any>(null);
  const [currentBadge, setCurrentBadge] = useState('🎨 CREATIVE');

  /* ─── Inventory / Shop states ─── */
  const [inventoryActive, setInventoryActive] = useState(false);
  const [shopActive, setShopActive] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deadMsg, setDeadMsg] = useState('');
  const [isVictory, setIsVictory] = useState(false);
  const [victoryMsg, setVictoryMsg] = useState('');
  const [oxygen, setOxygen] = useState(100);
  const [equippedArmorList, setEquippedArmorList] = useState<string[]>([]);
  const [showTreasureGuide, setShowTreasureGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [flashlightActive, setFlashlightActive] = useState(false);
  const [proximityWarning, setProximityWarning] = useState<{ name: string; dist: number; type: 'key' | 'chest' } | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosFreeCount, setSosFreeCount] = useState(2);
  const [droneFreeCount, setDroneFreeCount] = useState(2);
  const [droneActive, setDroneActive] = useState(false);
  const [invincibleSeconds, setInvincibleSeconds] = useState(0);
  const [teammates, setTeammates] = useState<{ id: string; name: string; dist: number; screenX?: number; screenY?: number; onScreen: boolean; angle: number }[]>([]);
  const [speakingPeers, setSpeakingPeers] = useState<string[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [roomAction, setRoomAction] = useState<'create' | 'join'>('create');

  /* ─── Premium Features states ─── */
  const [weather, setWeather] = useState<'clear' | 'rain' | 'fog' | 'eclipse'>('clear');
  const [weatherTimer, setWeatherTimer] = useState(120);
  const weatherRef = useRef<'clear' | 'rain' | 'fog' | 'eclipse'>('clear');

  const [stnMinedProgress, setStnMinedProgress] = useState(0);
  const [zmbKilledProgress, setZmbKilledProgress] = useState(0);
  const [blkPlacedProgress, setBlkPlacedProgress] = useState(0);
  const [itemCraftedProgress, setItemCraftedProgress] = useState(0);

  const [questStnMinedClaimed, setQuestStnMinedClaimed] = useState(false);
  const [questZmbKilledClaimed, setQuestZmbKilledClaimed] = useState(false);
  const [questBlkPlacedClaimed, setQuestBlkPlacedClaimed] = useState(false);
  const [questItemCraftedClaimed, setQuestItemCraftedClaimed] = useState(false);

  const [showQuestsPanel, setShowQuestsPanel] = useState(true);

  /* ─── Responsive & Performance Mobile Optimizations ─── */
  const [pixelScaleMode, setPixelScaleMode] = useState<'high' | 'low'>('high');
  const [minimapVisibleStyle, setMinimapVisibleStyle] = useState<'compact' | 'expanded' | 'hidden'>('compact');

  const pixelScaleModeRef = useRef(pixelScaleMode);
  const minimapStyleRef = useRef(minimapVisibleStyle);

  useEffect(() => {
    pixelScaleModeRef.current = pixelScaleMode;
  }, [pixelScaleMode]);

  useEffect(() => {
    minimapStyleRef.current = minimapVisibleStyle;
  }, [minimapVisibleStyle]);

  // Dynamic pixel scale updater (for instant performance boosts on cheap/old devices)
  useEffect(() => {
    if (rendererRef.current && isPlaying) {
      if (pixelScaleMode === 'low') {
        rendererRef.current.setPixelRatio(0.6); // Fast 3D rendering scale
        triggerToast('⚡ Đã chuyển sang chế độ Hiệu năng Cao (Mượt)!');
      } else {
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        triggerToast('✨ Đã bật Chế độ Sắc nét!');
      }
    }
  }, [pixelScaleMode, isPlaying]);

  /* ─── Fullscreen toggle utility ─── */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        triggerToast('❌ Không thể chơi Toàn màn hình: ' + err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  /* ─── Copy friend invite link utility ─── */
  const copyInviteLink = (roomName?: string) => {
    const r = roomName || opts.room || 'lobby';
    const s = opts.seed;
    const b = opts.biome;
    const m = opts.mode;
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(r)}&seed=${encodeURIComponent(s)}&biome=${encodeURIComponent(b)}&mode=${encodeURIComponent(m)}`;
    
    // Attempt standard copy
    navigator.clipboard.writeText(url)
      .then(() => {
        triggerToast('📋 Đã sao chép liên kết mời! Hãy gửi cho bạn bè để cùng chơi.');
      })
      .catch(() => {
        // Fallback for iframe sandboxes
        try {
          const el = document.createElement('textarea');
          el.value = url;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          triggerToast('📋 Đã sao chép liên kết mời!');
        } catch (e) {
          triggerToast('❌ Không thể sao chép khôi phục!');
        }
      });
  };
  
  const [activeTab, setActiveTab] = useState<'blocks' | 'items' | 'food' | 'clothing' | 'crafting'>('blocks');
  const [activeShopTab, setActiveShopTab] = useState('weapons');
  
  const [hotbar, setHotbar] = useState<Array<{ id: number; n: number }>>([
    { id: 1, n: 64 },
    { id: 2, n: 64 },
    { id: 3, n: 64 },
    { id: 4, n: 64 },
    { id: 6, n: 64 },
    { id: 7, n: 64 },
    { id: 8, n: 64 },
    { id: 10, n: 64 },
    { id: 11, n: 64 }
  ]);
  const [selIndex, setSelIndex] = useState(0);
  const [bagItems, setBagItems] = useState<Record<string, number>>({});
  
  const hotbarRef = useRef(hotbar);
  const selIndexRef = useRef(selIndex);

  useEffect(() => {
    hotbarRef.current = hotbar;
  }, [hotbar]);

  useEffect(() => {
    selIndexRef.current = selIndex;
  }, [selIndex]);

  // Notification Toast state
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  /* ─── Gameplay System Refs ─── */
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Instance engines
  const prevWasNight = useRef<boolean>(false);
  const prevWasNightForFlashlight = useRef<boolean>(false);
  const nightsSurvivedRef = useRef<number>(1);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const chunkMgrRef = useRef<CM | null>(null);
  const playerRef = useRef<Player | null>(null);
  const dnRef = useRef<DN | null>(null);
  const entsRef = useRef<Entity[]>([]);
  const hlRef = useRef<THREE.LineSegments | null>(null);
  const flashlightRef = useRef<THREE.SpotLight | null>(null);
  const flashlightActiveRef = useRef<boolean>(false);
  const radarBeepTimer = useRef<number>(0);
  const petMeshRef = useRef<THREE.Group | null>(null);
  
  // Dynamic parameters
  const lastTimeRef = useRef<number>(0);
  const fpsAcc = useRef<number>(0);
  const fpsCnt = useRef<number>(0);
  const nightSpawnAccumulator = useRef<number>(0);
  const keyboardRef = useRef<Record<string, boolean>>({});
  const mouseDelta = useRef({ x: 0, y: 0 });
  const isPointerLocked = useRef(false);

  // Touch controls tracker engine
  const touchSysRef = useRef({
    jx: 0, jy: 0,
    _jid: -1, _jcx: 0, _jcy: 0,
    ldx: 0, ldy: 0,
    _lid: -1, _llx: 0, _lly: 0,
    jumpHeld: false,
    breakOnce: false,
    placeOnce: false,
    breakHeld: false,
    placeHeld: false,
    pickTimer: 0,
    _jR: 38
  });

  /* ─── Helper: Trigger Toast notification ─── */
  const triggerToast = (msg: string) => {
    setToastText(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 1900);
  };

  /* ─── Bag Add / Rem helpers ─── */
  const addBagItem = (id: string, count = 1) => {
    setBagItems(prev => {
      const next = { ...prev };
      next[id] = (next[id] || 0) + count;
      return next;
    });
  };

  const remBagItem = (id: string, count = 1) => {
    setBagItems(prev => {
      const next = { ...prev };
      if (next[id]) {
        next[id] = Math.max(0, next[id] - count);
      }
      return next;
    });
  };

  const craftItem = (recipe: typeof CRAFTING_RECIPES[0]) => {
    const missing = recipe.ingredients.find((ing) => {
      const owned = bagItems[ing.id] || 0;
      return owned < ing.req;
    });

    if (missing) {
      triggerToast(`❌ Thiếu nguyên liệu! Cần thêm ${missing.req - (bagItems[missing.id] || 0)} ${missing.name}`);
      return;
    }

    // Deduct materials
    recipe.ingredients.forEach((ing) => {
      remBagItem(ing.id, ing.req);
    });

    // Credit output item
    addBagItem(recipe.resultId, recipe.count);
    synth.playPlace();
    triggerToast(`🎉 Chế tạo thành công ${recipe.count}x ${recipe.resultEmoji} ${recipe.resultName}!`);
    setItemCraftedProgress(prev => Math.min(1, prev + 1));
  };

  /* ─── Auto-Saver ─── */
  const saveGameData = () => {
    if (!playerRef.current) return;
    try {
      localStorage.setItem('vv5_react', JSON.stringify({
        pos: [playerRef.current.pos.x, playerRef.current.pos.y, playerRef.current.pos.z],
        yaw: playerRef.current.yaw,
        gold: playerRef.current.gold,
        lv: playerRef.current.lv,
        xp: playerRef.current.xp,
        hp: playerRef.current.hp,
        seed: optsRef.current.seed,
        biome: optsRef.current.biome,
        bagItems: bagItems,
        hotbar: hotbar,
        equippedWpnId: playerRef.current.wpn ? playerRef.current.wpn.id : null,
        worldMods: chunkMgrRef.current?.mods || {}
      }));
    } catch (e) {
      console.warn('Could not save game data:', e);
    }
  };

  /* ─── Read Url Invite Parameters ─── */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      const urlSeed = params.get('seed');
      const urlBiome = params.get('biome');
      const urlMode = params.get('mode');
      
      if (urlRoom || urlSeed || urlBiome || urlMode) {
        setRoomAction('join');
        setOpts((prev) => ({
          ...prev,
          room: urlRoom || prev.room,
          seed: urlSeed || prev.seed,
          biome: urlBiome || prev.biome,
          mode: (urlMode as any) || prev.mode,
        }));
        setTimeout(() => {
          triggerToast('🎁 Đã tải phòng chơi từ liên kết mời!');
        }, 800);
      }
    } catch (err) { }
  }, []);

  useEffect(() => {
    flashlightActiveRef.current = flashlightActive;
  }, [flashlightActive]);

  /* ─── Initialize Core Canvas & Game loop ─── */
  useEffect(() => {
    if (!isPlaying) return;
    if (!containerRef.current || !canvasRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = window.innerWidth / window.innerHeight;
    const cam = new THREE.PerspectiveCamera(75, aspect, 0.1, 600);
    camRef.current = cam;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(pixelScaleMode === 'low' ? 0.6 : Math.min(window.devicePixelRatio, Dev.tier() === 'low' ? 1 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    const isTreasure = optsRef.current.mode === 'treasure';
    // Remove forced treasure_lava biome. Let the user choose the biome, but if they had treasure_lava saved, swap to 'plains'
    const activeBiome = (optsRef.current.biome === 'treasure_lava' || optsRef.current.biome === 'treasure_ocean') ? 'plains' : optsRef.current.biome;
    const initialFogColor = isTreasure ? 0x87ceeb : 0x87ceeb; // Make it bright sky blue!
    scene.fog = new THREE.Fog(initialFogColor, 30, Dev.rd() * CW * 0.95);

    // 2. Instantiate procedural engine components
    const dn = new DN(scene, false); // Make it use bright daytime logic (false instead of isTreasure)
    dnRef.current = dn;

    // Flashlight SpotLight instance
    const fLight = new THREE.SpotLight(0xfff9e6, 5.0, 50, Math.PI / 4.5, 0.4, 0.8);
    fLight.visible = false;
    scene.add(fLight);
    scene.add(fLight.target);
    flashlightRef.current = fLight;

    const wgen = new WGen(optsRef.current.seed, activeBiome);
    const cmgr = new CM(scene, wgen);
    chunkMgrRef.current = cmgr;

    // 3. Initiate Player & spawn safety height
    const player = new Player(cam);
    player.fly = optsRef.current.mode === 'creative';
    const initH = wgen.h(8, 8);
    player.pos.set(8, initH + 3, 8);
    playerRef.current = player;

    // Load saves if available, restricting position to matching seed/biome
    let hasLoadedSave = false;
    try {
      const saved = localStorage.getItem('vv5_react');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.seed === optsRef.current.seed && (d.biome === optsRef.current.biome || optsRef.current.mode === 'treasure')) {
          if (d.pos) player.pos.set(d.pos[0], d.pos[1], d.pos[2]);
          if (d.yaw != null) player.yaw = d.yaw;
          hasLoadedSave = true;
        } else {
          // Reset starting position to safe biome height as seed or biome has changed
          const safeH = wgen.h(8, 8);
          player.pos.set(8, safeH + 3, 8);
        }
        if (d.gold != null) player.gold = d.gold;
        if (d.lv != null) {
          player.lv = d.lv;
          player.mhp = 20 + (d.lv - 1) * 2;
          player.hp = d.hp ?? player.mhp;
          player.xp = d.xp ?? 0;
        }
        if (d.bagItems) setBagItems(d.bagItems);
        if (d.hotbar) setHotbar(d.hotbar);
        if (d.equippedWpnId && ITM[d.equippedWpnId]) {
          player.wpn = ITM[d.equippedWpnId];
          setEquippedWpn(player.wpn);
        }
        if (d.worldMods && d.seed === optsRef.current.seed && d.biome === optsRef.current.biome) {
          cmgr.mods = d.worldMods;
        }
      }
    } catch (err) { }

    if (!hasLoadedSave && optsRef.current.mode === 'treasure') {
      setBagItems({
        sw2: 1,
        pick: 1,
        bread: 8,
        key: 1,
      });
      player.wpn = ITM['sw2'];
      setEquippedWpn(ITM['sw2']);
    }

    setGoldCount(player.gold);
    setHp(player.hp);
    setMhp(player.mhp);
    setHunger(player.hunger);
    setPlayerLevel(player.lv);

    // --- Connect to Socket.IO Multiplayer Servers ---
    socketService.connect(
      optsRef.current.name,
      player.pos.x,
      player.pos.y,
      player.pos.z,
      player.yaw,
      optsRef.current.room || 'lobby',
      optsRef.current.skinColor,
      optsRef.current.shirtColor,
      optsRef.current.pantsColor,
      optsRef.current
    );
    
    // Bind Voice Chat System
    if (socketService.socket) {
      voiceManager.setSocket(socketService.socket);
      voiceManager.onSpeakingChange = (speakers: string[]) => {
        setSpeakingPeers(speakers);
      };
    }

    const remotePlayers = new Map<string, THREE.Group>();

    const createPetMesh = (type: string): THREE.Group | undefined => {
      if (type === 'none') return undefined;
      const group = new THREE.Group();
      
      const textureLoader = new THREE.TextureLoader();
      let textureUrl = '';
      
      if (type === 'labrador' || type === 'loyal_dog') {
        textureUrl = '/dog-labrador.webp.png';
      } else if (type === 'poodle' || type === 'cute_poodle') {
        textureUrl = '/dog-poodle.webp.png';
      } else if (type === 'robot_drone' || type === 'rescue_drone' || type === 'steel_robot') {
        textureUrl = '/robot-drone-voxel.webp';
      }

      if (textureUrl) {
         const map = textureLoader.load(textureUrl);
         map.colorSpace = THREE.SRGBColorSpace;
         const mat = new THREE.SpriteMaterial({ map: map, transparent: true });
         const sprite = new THREE.Sprite(mat);
         sprite.scale.set(1.5, 1.5, 1.5);
         sprite.position.y = 0.75;
         group.add(sprite);
      }
      
      return group;
    };

    const createPlayerMesh = (name: string, skinColor = '#dbcca0', shirtColor = '#3b82f6', pantsColor = '#1d4ed8', avatarSkin?: string): THREE.Group => {
      const group = new THREE.Group();
      group.name = name;

      const textureLoader = new THREE.TextureLoader();
      let textureUrl = '';
      
      if (avatarSkin === 'castle_char') {
        textureUrl = '/voxel-castle-character-a.webp';
      } else {
        textureUrl = '/robot-soldier-voxel.webp'; // Default to robot_soldier
      }

      if (textureUrl) {
         const map = textureLoader.load(textureUrl);
         map.colorSpace = THREE.SRGBColorSpace;
         const mat = new THREE.SpriteMaterial({ map: map, transparent: true });
         const sprite = new THREE.Sprite(mat);
         sprite.scale.set(1.8, 1.8, 1.8);
         sprite.position.y = 0.9;
         group.add(sprite);
      }

      // Floaty name tag sprite
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        const rWidth = 256, rHeight = 64, rRadius = 12;
        ctx.moveTo(rRadius, 0);
        ctx.lineTo(rWidth - rRadius, 0);
        ctx.quadraticCurveTo(rWidth, 0, rWidth, rRadius);
        ctx.lineTo(rWidth, rHeight - rRadius);
        ctx.quadraticCurveTo(rWidth, rHeight, rWidth - rRadius, rHeight);
        ctx.lineTo(rRadius, rHeight);
        ctx.quadraticCurveTo(0, rHeight, 0, rHeight - rRadius);
        ctx.lineTo(0, rRadius);
        ctx.quadraticCurveTo(0, 0, rRadius, 0);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 24px -apple-system, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 128, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const label = new THREE.Sprite(labelMat);
      label.position.y = 1.95;
      label.scale.set(1.5, 0.375, 1);
      group.add(label);

      return group;
    };

    // Listen to existing player list
    socketService.on('players:list', (list) => {
      remotePlayers.forEach((mesh) => {
        scene.remove(mesh);
      });
      remotePlayers.clear();

      list.forEach((p: any) => {
        if (p.id !== socketService.socket?.id) {
          const m = createPlayerMesh(p.name, p.skinColor, p.shirtColor, p.pantsColor, p.avatarSkin);
          m.position.set(p.x, p.y, p.z);
          m.rotation.y = p.rotY || 0;
          scene.add(m);
          remotePlayers.set(p.id, m);
        }
      });
    });

    // Listen to players joiner
    socketService.on('player:joined', (p) => {
      if (p.id !== socketService.socket?.id && !remotePlayers.has(p.id)) {
        const m = createPlayerMesh(p.name, p.skinColor, p.shirtColor, p.pantsColor, p.avatarSkin);
        m.position.set(p.x, p.y, p.z);
        m.rotation.y = p.rotY || 0;
        scene.add(m);
        remotePlayers.set(p.id, m);
        triggerToast(`👋 Bạn ${p.name} đã vào phòng!`);
      }
    });

    // Listen to players movement syncing
    socketService.on('player:moved', (p) => {
      const m = remotePlayers.get(p.id);
      if (m) {
        m.position.set(p.x, p.y, p.z);
        m.rotation.y = p.rotY || 0;

        // Dynamic clothing update!
        if (p.skinColor || p.shirtColor || p.pantsColor) {
          m.children.forEach((child, idx) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              const mat = child.material;
              if (idx === 0 || idx === 4 || idx === 5) { // Head, Left arm, Right arm
                if (p.skinColor) mat.color.set(p.skinColor);
              } else if (idx === 1) { // Body
                if (p.shirtColor) mat.color.set(p.shirtColor);
              } else if (idx === 2 || idx === 3) { // Legs
                if (p.pantsColor) mat.color.set(p.pantsColor);
              }
            }
          });
        }
      }
    });

    // Listen to player exits
    socketService.on('player:left', (pid) => {
      const m = remotePlayers.get(pid);
      if (m) {
        scene.remove(m);
        remotePlayers.delete(pid);
      }
    });

    // Listen to block changed from other players
    socketService.on('block:changed', (data) => {
      if (cmgr) {
        cmgr.wSet(data.x, data.y, data.z, data.blockId);
        cmgr.upd(player.pos.x, player.pos.z, Dev.rd());
        synth.playPlace();
      }
    });

    // Listen to chat message arriving
    socketService.on('chat:received', (msg) => {
      setChatLogs((prev) => [...prev, { sender: msg.sender, text: msg.text }]);
      triggerToast(`💬 ${msg.sender}: ${msg.text}`);
    });

    // Measure network latency
    socketService.on('latency:pong', (timestamp: number) => {
      const rtt = Math.round(performance.now() - timestamp);
      setPing(rtt);
    });

    // Listen to initial room sync immediately upon connection
    socketService.on('room:initial_sync', ({ keys, t, dayCount, victory }) => {
      setSurvivalDay(dayCount || 1);
      if (keys != null) {
        setBagItems(prev => ({ ...prev, key: keys }));
      }
      if (t != null && dnRef.current) {
        dnRef.current.t = t;
      }
      if (victory) {
        setIsVictory(true);
        setVictoryMsg('🏆 THẾ GIỚI CŨNG ĐÃ CHIẾN THẮNG: Phòng chơi này đã hoàn thành khai mở cổ báu rương!');
      }
    });

    // Sync room time tick precisely from server heartbeat
    socketService.on('room:time_sync', ({ t }) => {
      if (dnRef.current && t != null) {
        const dInst = dnRef.current;
        dInst.t = t;
        setTimeLabel(dInst.lbl());
        setTimePercent(dInst.t * 100);
        setIsNight(dInst.night());
      }
    });

    // Listen to next survival day transition
    socketService.on('room:new_day', ({ dayCount }) => {
      setSurvivalDay(dayCount || 1);
      triggerToast(`🌅 BẮT ĐẦU NGÀY THỨ ${dayCount}! Kỳ tích sinh tồn tiếp diễn.`);
      synth.playCollect();
    });

    // Listen to coop keys gathered or spent
    socketService.on('room:keys_sync', ({ keysCollected, collector, opener }) => {
      setBagItems(prev => ({ ...prev, key: keysCollected }));
      if (collector) {
        triggerToast(`🔑 ĐỒNG ĐỘI ${collector.toUpperCase()} ĐÃ THU THẬP ĐƯỢC 1 CHÌA KHÓA VÀNG!`);
        synth.playCollect();
      } else if (opener) {
        triggerToast(`🎁 ĐỒNG ĐỘI ${opener.toUpperCase()} ĐÃ DÙNG CHÌA KHÓA MỞ RƯƠNG THÀNH CÔNG!`);
        synth.playCollect();
      }
    });

    // Listen to shared victory trigger
    socketService.on('room:victory_sync', ({ opener }) => {
      setBagItems(prev => ({ ...prev, key: 0 }));
      setIsVictory(true);
      setVictoryMsg(`🏆 ĐỒNG ĐỘI CHIẾN THẮNG! Chiến binh vĩ đại ${opener.toUpperCase()} đã giải mã và chinh phục thành công Rương Cổ Báu Thủy Tổ!`);
      synth.playCollect();
    });

    const pingTimer = setInterval(() => {
      if (socketService.socket && socketService.socket.connected) {
        socketService.emit('latency:ping', performance.now());
      } else {
        setPing(null);
      }

      // Premium Weather countdown ticker & dynamic cyclic updates (runs every 2s)
      setWeatherTimer((prev) => {
        const nextVal = prev - 2;
        if (nextVal <= 0) {
          const nextWeatherMap: Record<string, 'clear' | 'rain' | 'fog' | 'eclipse'> = {
            clear: 'rain',
            rain: 'fog',
            fog: 'eclipse',
            eclipse: 'clear'
          };
          const nextWeather = nextWeatherMap[weatherRef.current] || 'clear';
          weatherRef.current = nextWeather;
          setWeather(nextWeather);
          triggerToast(`🌦️ Thời tiết bỗng đổi: ${
            nextWeather === 'clear' ? 'Trời Quang Đãng ☀️' :
            nextWeather === 'rain' ? 'Mưa Giông Bão 🌧️' :
            nextWeather === 'fog' ? 'Sương Mù Ẩm Ướt 🌫️' : 'Mặt Trăng Máu 🌑 (Yêu ma trỗi dậy!)'
          }`);
          synth.playPlace();
          return 120; // 2 minutes next weather
        }
        return nextVal;
      });
    }, 2000);

    // 4. Cursor wireframe indicator
    const hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    hl.visible = false;
    scene.add(hl);
    hlRef.current = hl;

    // 5. Spawn bots & mobs
    const botNum = parseInt(optsRef.current.botCount || '3', 10);
    const ents: Entity[] = [];
    const hostiles = ['zombie', 'skeleton', 'spider'];
    const animals = ['cow', 'pig', 'chicken', 'sheep'];

    for (let i = 0; i < botNum; i++) {
      const tp = hostiles[i % hostiles.length];
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 20;
      const x = 8 + Math.cos(a) * r;
      const z = 8 + Math.sin(a) * r;
      ents.push(new Entity(tp, x, wgen.h(~~x, ~~z) + 2, z, scene));
    }

    for (let i = 0; i < 5; i++) {
      const tp = animals[i % animals.length];
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 14;
      const x = 8 + Math.cos(a) * r;
      const z = 8 + Math.sin(a) * r;
      ents.push(new Entity(tp, x, wgen.h(~~x, ~~z) + 1, z, scene));
    }

    const isCollectibleMode = optsRef.current.mode === 'treasure' || optsRef.current.mode === 'survival' || optsRef.current.mode === 'adventure';
    if (isCollectibleMode) {
      const difficulty = optsRef.current.difficulty || 'normal';
      let keysLocations = [
        { x: -150, z: 150 },
        { x: 150, z: -150 },
        { x: -200, z: -200 }
      ];
      let px = 300;
      let pz = 300;

      if (difficulty === 'easy') {
        keysLocations = [{ x: -50, z: 50 }, { x: 50, z: -50 }];
        px = 100; pz = 100;
      } else if (difficulty === 'hard') {
        keysLocations = [{ x: -200, z: 200 }, { x: 200, z: -200 }, { x: -300, z: -300 }, { x: 300, z: 150 }, { x: -150, z: -300 }];
        px = 500; pz = 500;
      } else if (difficulty === 'extreme') {
        keysLocations = [{ x: -300, z: 300 }, { x: 300, z: -300 }, { x: -400, z: -400 }, { x: 400, z: 250 }, { x: -250, z: -400 }, { x: 450, z: 450 }, { x: -450, z: 150 }];
        px = 800; pz = 800;
      }

      (window as any).gameKeysLoc = keysLocations;
      (window as any).gamePalaceLoc = {x: px, z: pz};

      keysLocations.forEach(loc => {
        const gh = Math.max(wgen.h(loc.x, loc.z) + 10, 35);
        ents.push(new Entity('key_collectible', loc.x, gh + 2, loc.z, scene));
      });

      // Spawn a visible Chest Collectible floating at the palace!
      ents.push(new Entity('chest_collectible', px, 20, pz, scene));

      // Spawn 6 tough Zombie Palace Guardians inside the massive Palace
      for (let k = 0; k < 6; k++) {
        const theta = (k / 6) * Math.PI * 2;
        const gX = px + Math.cos(theta) * 6;
        const gZ = pz + Math.sin(theta) * 6;
        const guardian = new Entity('zombie', gX, 16, gZ, scene);
        guardian.hp = 60; // Extra health!
        guardian.cfg = {
          ...guardian.cfg,
          hp: 60,
          spd: 2.8, // extremely fast
          dmg: 8,   // hits harder
          gold: 35, // great reward!
          xp: 40,
          e: '🧟🛡️' // Royal guard badge!
        };
        ents.push(guardian);
      }
      
      // Spawn Sky Zombies (Ghosts) walking on the roof of the Palace at Y=50
      for (let k = 0; k < 6; k++) {
        const theta = (k / 6) * Math.PI * 2;
        const gX = px + Math.cos(theta) * 12;
        const gZ = pz + Math.sin(theta) * 12;
        const skyZombie = new Entity('zombie', gX, 52, gZ, scene);
        skyZombie.hp = 80;
        skyZombie.cfg = { 
          ...skyZombie.cfg, 
          hp: 80, 
          spd: 3.5, 
          dmg: 10,
          gold: 50,
          fly: true,
          e: '🦇' 
        };
        ents.push(skyZombie);
      }
    }

    entsRef.current = ents;

    // 6. Bind keyboard & mouse standard inputs
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardRef.current[e.code] = true;
      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.slice(5), 10);
        if (num >= 1 && num <= 9) {
          setSelIndex(num - 1);
        }
      }
      if (e.code === 'KeyE') {
        setInventoryActive(prev => !prev);
        setShopActive(false);
      }
      if (e.code === 'KeyG') {
        setShopActive(prev => !prev);
        setInventoryActive(false);
      }
      if (e.code === 'KeyF') {
        player.fly = !player.fly;
        triggerToast('Bay: ' + (player.fly ? 'BẬT 🦅' : 'TẮT'));
      }
      if (e.code === 'KeyP') {
        saveGameData();
        triggerToast('💾 Đã lưu dữ liệu thế giới!');
      }
      if (e.code === 'KeyL') {
        setFlashlightActive(prev => {
          const next = !prev;
          triggerToast('Đèn Pin: ' + (next ? 'BẬT 🔦 (L)' : 'TẮT 🔇'));
          return next;
        });
      }
      if (e.code === 'Escape') {
        setInventoryActive(false);
        setShopActive(false);
        setShowSettings(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardRef.current[e.code] = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isPointerLocked.current) return;
      setSelIndex(prev => (prev + (e.deltaY > 0 ? 1 : -1) + 9) % 9);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPointerLocked.current) {
        mouseDelta.current.x += e.movementX;
        mouseDelta.current.y += e.movementY;
      }
    };

    const handleCanvasClick = () => {
      if (!isPointerLocked.current && !Dev.mob) {
        canvasRef.current?.requestPointerLock?.();
      }
    };

    const handleLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvasRef.current;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      if (e.button === 0) { touchSysRef.current.breakOnce = true; touchSysRef.current.breakHeld = true; }
      if (e.button === 2) { touchSysRef.current.placeOnce = true; touchSysRef.current.placeHeld = true; }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      if (e.button === 0) touchSysRef.current.breakHeld = false;
      if (e.button === 2) touchSysRef.current.placeHeld = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handleLockChange);
    canvasRef.current.addEventListener('click', handleCanvasClick);
    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    canvasRef.current.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    // 7. Bind window resize
    const handleResize = () => {
      if (!camRef.current || !rendererRef.current) return;
      camRef.current.aspect = window.innerWidth / window.innerHeight;
      camRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    const handleOrientation = () => {
      setTimeout(handleResize, 100);
      setTimeout(handleResize, 350);
      setTimeout(handleResize, 700);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientation);

    // Initial render setup
    cmgr.upd(player.pos.x, player.pos.z, Dev.rd());
    triggerToast('Chào mừng ' + opts.name + '! 👋');

    // Make sure background overlay for HUD is updated
    const hudEl = document.getElementById('hud');
    if (hudEl) hudEl.classList.add('on');

    // 8. MASTER RENDERING LOOP
    let activeFrameId: number;
    lastTimeRef.current = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const pInst = playerRef.current;
      const cInst = chunkMgrRef.current;
      const dInst = dnRef.current;
      const tInst = touchSysRef.current;

      if (pInst && cInst && dInst) {
        // Look update (mouse / virtual touch looking slide)
        const sens = 0.0025;
        pInst.yaw -= (mouseDelta.current.x + tInst.ldx) * sens;
        pInst.pitch -= (mouseDelta.current.y + tInst.ldy) * sens;
        pInst.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pInst.pitch));
        
        mouseDelta.current.x = 0;
        mouseDelta.current.y = 0;
        tInst.ldx = 0;
        tInst.ldy = 0;

        // Collect aggregate breaks & placements
        const doBreak = tInst.breakOnce;
        const doPlace = tInst.placeOnce;
        tInst.breakOnce = false;
        tInst.placeOnce = false;

        // Update player physics state
        if (!pInst.dead) {
          const activeKeys = keyboardRef.current;
          const instInputs = {
            fwd: activeKeys['KeyW'],
            bk: activeKeys['KeyS'],
            lt: activeKeys['KeyA'],
            rt: activeKeys['KeyD'],
            jump: activeKeys['Space'] || tInst.jumpHeld,
            crouch: activeKeys['ShiftLeft'] || activeKeys['ShiftRight'],
            jx: tInst.jx,
            jy: tInst.jy
          };

          pInst.upd(dt, instInputs, cInst, optsRef.current.mode, (src) => {
            setIsDead(true);
            setDeadMsg(src);
            synth.playHit();
          });

          // Block clipping resolver & falling into the void safety recovery
          if (!pInst.dead) {
            // 1. Recover from void falling (below Y = 2)
            if (pInst.pos.y < 2) {
              const safeH = wgen.h(pInst.pos.x, pInst.pos.z);
              pInst.pos.y = Math.max(safeH + 3, 35);
              pInst.vel.set(0, 0, 0);
              triggerToast('⚠️ Đã đặt lại vị trí an toàn trên mặt đất!');
            }

            // 2. Resolve solid block clipping (push player upward if stuck inside terrain chunks)
            let limit = 0;
            while (pInst.col(cInst, pInst.pos.x, pInst.pos.y, pInst.pos.z) && limit < 80) {
              pInst.pos.y += 0.5;
              limit++;
            }
            if (limit > 0) {
              pInst.vel.y = 0;
              pInst.onG = true; // Mark on ground once elevated above solid obstruction
            }
          }

          // Sync movement to other players via Socket
          if (socketService.socket?.connected) {
            const curP = pInst.pos;
            const lastX = lastEmitPos.current.x;
            const lastY = lastEmitPos.current.y;
            const lastZ = lastEmitPos.current.z;
            const lastYaw = lastEmitYaw.current;
            
            const dist = Math.hypot(curP.x - lastX, curP.y - lastY, curP.z - lastZ);
            if (dist > 0.05 || Math.abs(pInst.yaw - lastYaw) > 0.05) {
              socketService.emit('player:move', {
                x: curP.x,
                y: curP.y,
                z: curP.z,
                rotY: pInst.yaw,
                skinColor: opts.skinColor,
                shirtColor: opts.shirtColor,
                pantsColor: opts.pantsColor
              });
              lastEmitPos.current.copy(curP);
              lastEmitYaw.current = pInst.yaw;
            }
          }

          // Block highlight selection, Raycasting & Mobs combat checks
          const ori = new THREE.Vector3(pInst.pos.x, pInst.pos.y + pInst.eyeH, pInst.pos.z);
          const pDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(pInst.pitch, pInst.yaw, 0, 'YXZ')).normalize();

          let targetMob: Entity | null = null;
          let minMobDist = 5;
          for (const ent of entsRef.current) {
            if (ent.dead) continue;
            const distToPlayer = ent.pos.distanceTo(ori);
            if (distToPlayer < minMobDist) {
              const vectorToMob = new THREE.Vector3().subVectors(ent.pos, ori).normalize();
              if (vectorToMob.dot(pDir) > 0.88) {
                minMobDist = distToPlayer;
                targetMob = ent;
              }
            }
          }

          const hoverBlock = rc(cInst, ori, pDir, 6);
          if (hoverBlock && hlRef.current) {
            hlRef.current.visible = true;
            hlRef.current.position.set(hoverBlock.x + 0.5, hoverBlock.y + 0.5, hoverBlock.z + 0.5);
          } else if (hlRef.current) {
            hlRef.current.visible = false;
          }

          // Break blocks or hit mobs
          if (doBreak) {
            if (targetMob) {
              synth.playHit();

              if (targetMob.type === 'chest_collectible') {
                const isTreasureMode = optsRef.current.mode === 'treasure';
                const requiredKeys = (window as any).gameKeysLoc ? (window as any).gameKeysLoc.length : 3;
                let opened = false;
                
                setBagItems(prev => {
                  const ownedKeys = prev['key'] || 0;
                  
                  if (isTreasureMode) {
                    if (ownedKeys >= requiredKeys) {
                      opened = true;
                      if (socketService.socket?.connected) {
                        socketService.emit('room:victory', { name: optsRef.current.name });
                      }
                      const next = { ...prev };
                      next['key'] = Math.max(0, ownedKeys - requiredKeys);
                      
                      setTimeout(() => {
                        setIsVictory(true);
                        triggerToast('🎉 VINH QUANG: Thu Phục Rương Tối Thượng Thành Công!');
                      }, 500);
                      
                      return next;
                    } else {
                      triggerToast(`❌ KHÓA TRANH CHẤP: Cần thu thập đủ ${requiredKeys} chìa vàng (Hiện có: ${ownedKeys}/${requiredKeys})`);
                      return prev;
                    }
                  } else {
                    opened = true; 
                    triggerToast('🎁 QUẢ NGỌT: Bạn mở được Rương Cổ! (+1000 🪙)');
                    setGoldCount(g => g + 1000);
                    return prev;
                  }
                });

                if (opened) {
                  targetMob.dead = true;
                  targetMob.remove();
                }
                return;
              }

              const baseDmg = (pInst.wpn?.dmg || 3) + (pInst.dmgB || 0);
              if (targetMob.hit(baseDmg)) {
                // Kill reward!
                targetMob.remove();
                pInst.kills++;
                pInst.gold += targetMob.cfg.gold;
                setGoldCount(pInst.gold);

                if (targetMob.cfg.hos) {
                  setZmbKilledProgress(prev => Math.min(3, prev + 1));
                }

                if (targetMob.type === 'mutant_zombie') {
                  triggerToast('🏆 BOSS HUỶ DIỆT BẠI TRẬN! Nhận thêm 1 Chìa Khóa Vàng (🔑) Thượng Cổ!');
                  setBagItems(prev => ({
                    ...prev,
                    key: (prev['key'] || 0) + 1
                  }));
                }

                if (pInst.addXP(targetMob.cfg.xp)) {
                  setPlayerLevel(pInst.lv);
                  setMhp(pInst.mhp);
                  setHp(pInst.mhp);
                  triggerToast(`⭐ Lên cấp ${pInst.lv}!`);
                }
                triggerToast(`${targetMob.cfg.e} +${targetMob.cfg.gold}🪙 +${targetMob.cfg.xp}XP`);
                
                // Add kill-feed log
                const logCont = document.getElementById('klog');
                if (logCont) {
                  const logEl = document.createElement('div');
                  logEl.className = 'ke';
                  logEl.textContent = `Giết ${targetMob.type} ${targetMob.cfg.e}`;
                  logCont.appendChild(logEl);
                  setTimeout(() => logEl.remove(), 3000);
                }

                // If peaceful livestock, drop meat
                if (!targetMob.cfg.hos) {
                  addBagItem('meat', 1);
                }
              } else {
                triggerToast(`Binh ${targetMob.cfg.e} HP:${Math.ceil(targetMob.hp)}`);
              }
            } else if (hoverBlock) {
              synth.playBreak();
              cInst.wSet(hoverBlock.x, hoverBlock.y, hoverBlock.z, 0);
              cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());

              // Sync block remove to other players
              socketService.emit('block:change', { x: hoverBlock.x, y: hoverBlock.y, z: hoverBlock.z, blockId: 0 });
              
              const bId = hoverBlock.block;
              if (bId === 18) {
                // Treasure Chest 🎁
                const isTreasureMode = optsRef.current.mode === 'treasure';
                let opened = false;
                
                setBagItems(prev => {
                  const ownedKeys = prev['key'] || 0;
                  
                  if (isTreasureMode) {
                    if (ownedKeys >= 3) {
                      opened = true;
                      if (socketService.socket?.connected) {
                        socketService.emit('room:victory', { name: optsRef.current.name });
                      }
                      const next = { ...prev };
                      next['key'] = Math.max(0, ownedKeys - 3);
                      
                      setTimeout(() => {
                        setIsVictory(true);
                        setVictoryMsg('🏆 CHÚC MỪNG CHIẾN THẮNG! Bạn đã kiên cường vượt qua hàng loạt thử thách vô song, định vị chính xác và khai mở đại vương rương cổ báu thành công!');
                        synth.playCollect();
                      }, 50);
                      return next;
                    }
                  } else {
                    if (ownedKeys > 0) {
                      opened = true;
                      if (socketService.socket?.connected) {
                        socketService.emit('room:deduct_key', { name: optsRef.current.name });
                      }
                      const next = { ...prev };
                      next['key'] = Math.max(0, ownedKeys - 1);
                      
                      const choices = [
                        { id: 'pot_hp', n: 'Thuốc HP 🧪', count: 3 },
                        { id: 'pot_spd', n: 'Thuốc Tốc ⚗️', count: 2 },
                        { id: 'pistol', n: 'Súng Lục 🔫', count: 1 },
                        { id: 'rifle', n: 'Súng Trường ︻╦╤─', count: 1 },
                        { id: 'wings', n: 'Cánh Thần 🪽', count: 1 },
                        { id: 'meat', n: 'Thịt Nướng 🍖', count: 5 },
                      ];
                      const chosen = choices[~~(Math.random() * choices.length)];
                      next[chosen.id] = (next[chosen.id] || 0) + chosen.count;
                      
                      setTimeout(() => {
                        pInst.gold += 120;
                        setGoldCount(pInst.gold);
                        triggerToast(`🎁 MỞ RƯƠNG THÀNH CÔNG! Nhận ${chosen.count}x ${chosen.n} & 120🪙!`);
                      }, 50);
                      
                      return next;
                    }
                  }
                  return prev;
                });
                
                setTimeout(() => {
                  if (!opened) {
                    if (isTreasureMode) {
                      triggerToast('🔒 BẤT THÀNH! Cổ Rương Báu rực sáng rào phong ấn, bạn cần trọn vẹn 3 Chìa Khóa Vàng (🔑) tại 3 đền thờ viễn phương mới mở khóa được!');
                    } else {
                      triggerToast('🔒 Cần 1 Chìa Khóa Vàng (🔑) để mở rương! Thu thập tại các khối chìa khóa vàng trên mặt đất!');
                    }
                    cInst.wSet(hoverBlock.x, hoverBlock.y, hoverBlock.z, 18);
                    cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());
                  }
                }, 80);
              } else if (bId === 19) {
                // Gold Key Block
                if (socketService.socket?.connected) {
                  socketService.emit('room:add_key', { name: optsRef.current.name });
                  pInst.gold += 15;
                  setGoldCount(pInst.gold);
                } else {
                  setBagItems(prev => {
                    const next = { ...prev };
                    next['key'] = (next['key'] || 0) + 1;
                    return next;
                  });
                  triggerToast('🔑 THU THẬP ĐƯỢC 1 CHÌA KHÓA VÀNG!');
                  pInst.gold += 15;
                  setGoldCount(pInst.gold);
                }
              } else {
                if (bId > 0) {
                  setBagItems(prev => {
                    const next = { ...prev };
                    next[String(bId)] = (next[String(bId)] || 0) + 1;
                    return next;
                  });
                  if (bId === 3) {
                    setStnMinedProgress(prev => Math.min(15, prev + 1));
                  }
                }
                
                if (bId === 14) {
                  pInst.gold += 3;
                  setGoldCount(pInst.gold);
                  triggerToast('⛏️ Vàng! +3🪙 (Khối quặng đã được thu thập)');
                } else if (bId === 15) {
                  pInst.gold += 8;
                  setGoldCount(pInst.gold);
                  triggerToast('💎 Kim cương! +8🪙 (Khối kim cương đã được thu thập)');
                } else {
                  triggerToast('Phá: ' + (BLK[bId]?.n || 'khối') + ' (+1 trong túi đồ)');
                }
              }
            }
          }

          // Place blocks
          if (doPlace && hoverBlock && hoverBlock.face) {
            const currentSelectedSlot = hotbarRef.current[selIndexRef.current];
            if (currentSelectedSlot && currentSelectedSlot.id > 0) {
              const nx = hoverBlock.x + hoverBlock.face[0];
              const ny = hoverBlock.y + hoverBlock.face[1];
              const nz = hoverBlock.z + hoverBlock.face[2];
              
              const isCollidingWithPlayerFeet = ~~pInst.pos.x === nx && ~~pInst.pos.z === nz && (ny === ~~pInst.pos.y || ny === ~~(pInst.pos.y + 1));
              if (!isCollidingWithPlayerFeet) {
                synth.playPlace();
                cInst.wSet(nx, ny, nz, currentSelectedSlot.id);
                cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());
                triggerToast('Đặt khối: ' + (BLK[currentSelectedSlot.id]?.n || 'khối') + ' ✅');
                setBlkPlacedProgress(prev => Math.min(10, prev + 1));

                // Sync block placement to other players
                socketService.emit('block:change', { x: nx, y: ny, z: nz, blockId: currentSelectedSlot.id });
              }
            }
          }
        }

        // Atmosphere update (passing player position to drift/wrap clouds)
        dInst.upd(dt, pInst.pos, !!socketService.socket?.connected);

        // --- WEATHER ENVIRONMENT OVERRIDES ---
        const activeWeather = weatherRef.current;
        if (activeWeather === 'rain') {
          const rainSkyColor = new THREE.Color(0x353942);
          scene.background = rainSkyColor;
          if (scene.fog && scene.fog instanceof THREE.Fog) {
            scene.fog.color.copy(rainSkyColor);
            scene.fog.far = Math.min(scene.fog.far, 65);
          }
        } else if (activeWeather === 'fog') {
          const fogSkyColor = new THREE.Color(0xcbcbcb);
          scene.background = fogSkyColor;
          if (scene.fog && scene.fog instanceof THREE.Fog) {
            scene.fog.color.copy(fogSkyColor);
            scene.fog.near = 4;
            scene.fog.far = Math.min(scene.fog.far, 40);
          }
        } else if (activeWeather === 'eclipse') {
          const eclipseSkyColor = new THREE.Color(0x380505);
          scene.background = eclipseSkyColor;
          if (scene.fog && scene.fog instanceof THREE.Fog) {
            scene.fog.color.copy(eclipseSkyColor);
            scene.fog.far = Math.min(scene.fog.far, 80);
          }
        }

        setTimeLabel(dInst.lbl());
        setTimePercent(dInst.t * 100);
        
        const currentNightStatus = dInst.night();
        setIsNight(currentNightStatus);

        // Flashlight automatic night turn-on & direction tracking
        if (currentNightStatus && !prevWasNightForFlashlight.current) {
          prevWasNightForFlashlight.current = true;
          setFlashlightActive(true);
          triggerToast('🌙 Trời đã tối! Đèn Pin đã tự động kích hoạt giúp soi sáng (Phím L để tắt/bật)');
        } else if (!currentNightStatus && prevWasNightForFlashlight.current) {
          prevWasNightForFlashlight.current = false;
        }

        // Update flashlight position
        const fLightObj = flashlightRef.current;
        if (fLightObj && camRef.current) {
          if (flashlightActiveRef.current) {
            fLightObj.visible = true;
            fLightObj.position.copy(camRef.current.position);
            
            // Point Spotlight forward along look direction
            const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(pInst.pitch, pInst.yaw, 0, 'YXZ')).normalize();
            fLightObj.target.position.copy(camRef.current.position).add(dir);
            fLightObj.target.updateMatrixWorld();
          } else {
            fLightObj.visible = false;
          }
        }

        // Companion Pet logic
        if (opts.companionPet && opts.companionPet !== 'none' && !petMeshRef.current) {
            const petMesh = createPetMesh(opts.companionPet);
            if (petMesh) {
                petMeshRef.current = petMesh;
                scene.add(petMesh);
            }
        }
        if (petMeshRef.current && pInst) {
            // Simple follow logic: move mesh towards player position with smoothing
            const targetPos = pInst.pos.clone().add(new THREE.Vector3(1, 0, 1));
            petMeshRef.current.position.lerp(targetPos, 0.1);
        }

        // Radar proximity warning alerts for Key Shrines / ancient chest (mode: treasure, survival, adventure)
        const isRadarMode = optsRef.current.mode === 'treasure' || optsRef.current.mode === 'survival' || optsRef.current.mode === 'adventure';
        if (isRadarMode && pInst) {
          const radarTargets = [
            { name: 'Đền Thờ Phía Tây Bắc 🔑 (Hiểm Địa)', x: -150, y: 40, z: 150, type: 'key' as const },
            { name: 'Đền Thờ Phía Đông Nam 🔑 (Hiểm Địa)', x: 150, y: 40, z: -150, type: 'key' as const },
            { name: 'Đền Thờ Vực Thẳm 🔑 (Ngoại Vi Khỏi Bản Đồ)', x: -200, y: 40, z: -200, type: 'key' as const },
            { name: 'Đế Đô Thủy Tổ 🎁 (Bảo Vệ Kín Mít! Y=20)', x: 300, y: 20, z: 300, type: 'chest' as const }
          ];

          let nearestWarn: { name: string; dist: number; type: 'key' | 'chest' } | null = null;
          let minD = Infinity;

          for (const tgt of radarTargets) {
            const tgtPos = new THREE.Vector3(tgt.x, tgt.y, tgt.z);
            const distance = pInst.pos.distanceTo(tgtPos);
            
            if (distance < 35 && distance < minD) {
              minD = distance;
              nearestWarn = { name: tgt.name, dist: Math.round(distance), type: tgt.type };
            }
          }

          if (nearestWarn) {
            let beepInterval = 1.2;
            let pitch = 880; 
            if (nearestWarn.type === 'chest') {
              pitch = 1100;
            }
            if (nearestWarn.dist < 8) {
              beepInterval = 0.25; 
            } else if (nearestWarn.dist < 18) {
              beepInterval = 0.6;
            }

            radarBeepTimer.current += dt;
            if (radarBeepTimer.current >= beepInterval) {
              radarBeepTimer.current = 0;
              synth.playRadarBeep(pitch);
            }
          } else {
            radarBeepTimer.current = 0;
          }

          setProximityWarning(prev => {
            if (!prev && !nearestWarn) return null;
            if (prev && nearestWarn && prev.name === nearestWarn.name && prev.dist === nearestWarn.dist) {
              return prev;
            }
            return nearestWarn;
          });
        } else {
          setProximityWarning(null);
        }

        if (prevWasNight.current !== currentNightStatus) {
          prevWasNight.current = currentNightStatus;
          if (currentNightStatus) {
            nightsSurvivedRef.current += 1;
            triggerToast(`🌙 Đêm thứ ${nightsSurvivedRef.current} đã xuống! Quái vật xuất hiện dồn dập, độ khó tăng tiến!`);
          } else {
            triggerToast('☀️ Bình minh đã lên! Quái vật bùng cháy dưới ánh mặt trời.');
          }
        }

        // Spawn extra bad mobs at night (or continuous waves in Treasure hunt mode)
        const isTreasureMode = optsRef.current.mode === 'treasure';
        if ((currentNightStatus || isTreasureMode) && optsRef.current.mode !== 'creative') {
          nightSpawnAccumulator.current += dt;
          
          const wave = nightsSurvivedRef.current || 1;
          const isLavaLandMultiplier = isTreasureMode ? 1.5 : 1.0;
          const spawnInterval = Math.max(3.0, (18 - wave * 1.5) / isLavaLandMultiplier);
          
          if (nightSpawnAccumulator.current > spawnInterval) {
            nightSpawnAccumulator.current = 0;
            
            // Spawn count can scale with nights survived
            const spawnBatchCount = Math.min(4, Math.ceil(wave / 2));
            const hostilesList = ['zombie', 'skeleton', 'creeper', 'wolf'];
            
            for (let b = 0; b < spawnBatchCount; b++) {
              const isEclipse = weatherRef.current === 'eclipse';
              const bossChance = isEclipse ? 0.25 : 0.08;
              let chosenType = hostilesList[~~(Math.random() * hostilesList.length)];
              if (Math.random() < bossChance) {
                chosenType = 'mutant_zombie';
              }
              
              // 15% chance to surprise spawn right near the player
              const isSurprise = Math.random() < 0.15;
              const a = Math.random() * Math.PI * 2;
              const r = isSurprise ? (6 + Math.random() * 4) : (18 + Math.random() * 12);
              
              const x = pInst.pos.x + Math.cos(a) * r;
              const z = pInst.pos.z + Math.sin(a) * r;
              
              const newMob = new Entity(chosenType, x, wgen.h(~~x, ~~z) + 2, z, scene);
              
              if (chosenType === 'mutant_zombie') {
                triggerToast('🚨 CẢNH BÁO: BOSS ZOMBIE ĐỘT BIẾN HUỶ DIỆT ĐANG TIẾP CẬN BẠN!');
              }
              
              // Infinite progressive scaling of HP, Speed & gold reward stats
              if (wave > 1) {
                const diffFactor = 1.0 + (wave - 1) * 0.20; // +20% HP & damage multiplier per night survived
                newMob.hp = newMob.cfg.hp * diffFactor;
                newMob.cfg = {
                  ...newMob.cfg,
                  spd: newMob.cfg.spd * Math.min(1.8, 1.0 + (wave - 1) * 0.05),
                  gold: Math.ceil(newMob.cfg.gold * diffFactor),
                  xp: Math.ceil(newMob.cfg.xp * diffFactor),
                };
              }
              
              entsRef.current.push(newMob);
              
              if (isSurprise && b === 0) {
                triggerToast('⚠️ BẤT NGỜ: Quái vật đột kích vừa áp sát ngay sau lưng bạn!');
                synth.playHit();
              }
            }
          }
        } else {
          nightSpawnAccumulator.current = 0;
        }

        // Mob behavior cycle
        for (let i = entsRef.current.length - 1; i >= 0; i--) {
          const mob = entsRef.current[i];
          if (mob.dead) {
            entsRef.current.splice(i, 1);
            continue;
          }

          if (mob.type === 'key_collectible' || mob.type === 'chest_collectible') {
            // Spin, wave vertically, check player proximity
            if (mob.mesh) {
              mob.mesh.rotation.y += dt * 1.5;
              if ((mob as any)._ph === undefined) (mob as any)._ph = Math.random() * 10;
              (mob as any)._ph += dt * 2.5;
              mob.mesh.position.y = mob.pos.y + Math.sin((mob as any)._ph) * 0.15;
            }

            if (mob.type === 'key_collectible') {
              const dp = mob.pos.distanceTo(pInst.pos);
              
              if (dp < 3.0) {
                if (tInst.breakHeld) {
                  tInst.pickTimer += dt;
                  const el = document.getElementById('pickProgressOuter');
                  if (el) el.style.display = 'block';
                  const bar = document.getElementById('pickProgressBar');
                  if (bar) bar.style.width = Math.min(100, (tInst.pickTimer / 3.0) * 100) + '%';
                  
                  if (tInst.pickTimer >= 3.0) {
                    // Harvested!
                    mob.dead = true;
                    mob.remove();
                    entsRef.current.splice(i, 1);
  
                    if (socketService.socket?.connected) {
                      socketService.emit('room:add_key', { name: optsRef.current.name });
                      pInst.gold += 150;
                      setGoldCount(pInst.gold);
                    } else {
                      setBagItems(prev => {
                        const updated = { ...prev };
                        updated['key'] = (updated['key'] || 0) + 1;
                        return updated;
                      });
                      triggerToast('🔑 THU THẬP THÀNH CÔNG CHÌA KHÓA VÀNG HUYỀN THOẠI! (+150🪙)');
                    }
                    synth.playCollect();
                    tInst.pickTimer = 0;
                    if (el) el.style.display = 'none';
                  }
                } else {
                  tInst.pickTimer = 0;
                  const el = document.getElementById('pickProgressOuter');
                  if (el) el.style.display = 'none';
                }
              } else {
                // Not near
                // Note: since this loops over all keys, setting pickTimer to 0 here could reset it if another key was being picked.
                // But only one key is nearby at a time.
                const el = document.getElementById('pickProgressOuter');
                if (el && tInst.pickTimer > 0) {
                  // Only reset if we were actually picking 
                  // But wait, the player could be far from ALL keys. We will handle hiding elsewhere if needed, but it's safe to just hide if far from the target key they were picking.
                }
              }
            }
            continue; // Bypass standard monster chasing mechanics
          }

          mob.upd(dt, pInst, cInst, (dmg, src) => {
            pInst.dmg(dmg, src, (dieSrc) => {
              setIsDead(true);
              setDeadMsg(dieSrc);
              synth.playHit();
            });
            setHp(pInst.hp);
          }, () => {
            // Creeper exploded!
            pInst.dmg(15, '💣 Creeper nổ', (dieSrc) => {
              setIsDead(true);
              setDeadMsg(dieSrc);
              synth.playHit();
            });
            setHp(pInst.hp);
            synth.playBreak();
          }, currentNightStatus);
        }

        // Keep local indices loaded
        cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());

        // Sync visual stats tags
        setHp(pInst.hp);
        setHunger(pInst.hunger);
        setXpPercent((pInst.xp / (pInst.lv * 100)) * 100);
        setOxygen(pInst.oxygen);
        setEquippedArmorList(pInst.equippedArmor || []);
        setInvincibleSeconds(Math.ceil(pInst.invincibleShieldT || 0));

        // Update FPS HUD diagnostic label
        fpsAcc.current += dt;
        fpsCnt.current++;
        if (fpsAcc.current >= 0.5) {
          setFps(~~(fpsCnt.current / fpsAcc.current));
          setChunkCount(cInst.cnt());
          setCoordsText(`${Math.floor(pInst.pos.x)}, ${Math.floor(pInst.pos.y)}, ${Math.floor(pInst.pos.z)}`);
          fpsAcc.current = 0;
          fpsCnt.current = 0;
        }

        // Draw Minimap (every few frames for performance)
        const currentMiniStyle = minimapStyleRef.current;
        const currentPerfMode = pixelScaleModeRef.current;
        if (minimapCanvasRef.current && fpsCnt.current % 5 === 0 && currentMiniStyle !== 'hidden') {
          const ctx = minimapCanvasRef.current.getContext('2d', { alpha: false });
          if (ctx) {
            const size = 100;
            ctx.fillStyle = '#0f172a'; // modern deep slate background
            ctx.fillRect(0, 0, size, size);
            
            const px = pInst.pos.x;
            const pz = pInst.pos.z;
            const py = pInst.pos.y;
            
            // DYNAMIC RADIUS: If compact/normal map or low-spec performance mode, check smaller radius to run up to 300% faster
            const r = (currentMiniStyle === 'compact' || currentPerfMode === 'low') ? 14 : 25;
            const scale = size / (r * 2);

            ctx.save();
            ctx.translate(size / 2, size / 2);
            // Rotate minimap depending on player facing
            ctx.rotate(pInst.yaw);
            ctx.translate(-size / 2, -size / 2);

            // DYNAMIC SCANNING THRESHOLD:
            // High performance mode searches fewer vertical slices to eliminate micro-stuttering on old devices
            const scanDepth = currentPerfMode === 'low' ? 7 : 15;
            const scanHeightOffset = currentPerfMode === 'low' ? 1 : 2;

            for (let bx = Math.floor(px - r); bx <= Math.ceil(px + r); bx++) {
              for (let bz = Math.floor(pz - r); bz <= Math.ceil(pz + r); bz++) {
                const dy = Math.floor(py);
                let highest = 0;
                
                // Fast search for highest block near player Y level
                for (let yy = dy + scanHeightOffset; yy >= dy - scanDepth; yy--) {
                  const b = cInst.wGet(bx, yy, bz);
                  if (b !== 0) { highest = b; break; }
                }
                
                if (highest === 0) {
                  // Fallback to WGen height estimation
                  const genH = wgen.h(bx, bz);
                  if (genH < dy + scanHeightOffset) highest = 1; // default to grass
                }

                if (highest !== 0) {
                  // Determine block color purely for minimap visual
                  let c = '#10b981'; // vibrant neon green for grass
                  if (highest === 3 || highest === 4) c = '#64748b'; // stone slate
                  else if (highest === 2) c = '#78350f'; // rich dirt brown
                  else if (highest === 6 || highest === 7) c = '#047857'; // emerald forest
                  else if (highest === 8) c = '#f8fafc'; // beautiful snow white
                  else if (highest === 9) c = '#eab308'; // bright golden sand
                  else if (highest === 11 || highest === 14 || highest === 15) c = '#0ea5e9'; // glowing sky sapphire ore
                  else if (highest === 5) c = '#cbd5e1'; // premium light brick slate
                  
                  ctx.fillStyle = c;
                  const rx = (bx - px + r) * scale;
                  const ry = (bz - pz + r) * scale;
                  ctx.fillRect(rx, ry, scale + 0.5, scale + 0.5);
                }
              }
            }
            
            // Draw remote players on minimap
            ctx.fillStyle = '#ef4444'; // red dots for enemies/players
            entsRef.current.forEach(e => {
              const ex = (e.pos.x - px + r) * scale;
              const ez = (e.pos.z - pz + r) * scale;
              if (ex >= 0 && ez >= 0 && ex <= size && ez <= size) {
                ctx.fillRect(ex - 1.5, ez - 1.5, 3, 3);
              }
            });

            // Draw teammates/online friends on minimap
            remotePlayers.forEach((group) => {
              const ex = (group.position.x - px + r) * scale;
              const ez = (group.position.z - pz + r) * scale;
              if (ex >= 0 && ez >= 0 && ex <= size && ez <= size) {
                // Circular bright green indicator marker
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(ex, ez, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Small name label
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.fillStyle = '#34d399';
                ctx.fillText(group.name ? group.name.substring(0, 3) : 'PL', ex + 4.5, ez + 2.5);
              }
            });

            // --- DRAW SPECIAL TREASURE MARKERS FOR MINI-MAP ---
            const isMinimapTreasureMode = optsRef.current.mode === 'treasure' || optsRef.current.mode === 'survival' || optsRef.current.mode === 'adventure';
            if (isMinimapTreasureMode) {
              // 1. Draw Keys (from active key_collectible entities list)
              entsRef.current.forEach(e => {
                if (e.type === 'key_collectible' && !e.dead) {
                  const kx = e.pos.x;
                  const kz = e.pos.z;
                  const kex = (kx - px + r) * scale;
                  const kez = (kz - pz + r) * scale;
                  const kdx_px = kex - size / 2;
                  const kdz_px = kez - size / 2;
                  const klen = Math.hypot(kdx_px, kdz_px);
                  
                  ctx.fillStyle = '#fbbf24'; // beautiful gold key color
                  if (klen <= size / 2) {
                    ctx.beginPath();
                    ctx.arc(kex, kez, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.font = '11px -apple-system, sans-serif';
                    ctx.fillText('🔑', kex - 5.5, kez - 5);
                  } else {
                    const nx = kdx_px / klen;
                    const nz = kdz_px / klen;
                    const edgeDist = size / 2 - 5;
                    const bX = size / 2 + nx * edgeDist;
                    const bY = size / 2 + nz * edgeDist;
                    
                    ctx.beginPath();
                    ctx.arc(bX, bY, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.font = '9px -apple-system, sans-serif';
                    ctx.fillText('🔑', bX - 4.5, bY - 4.5);
                  }
                }
              });

              // 2. Draw Legendary Chest at X=300, Z=300
              const cx_coord = 300;
              const cz_coord = 300;
              const cex = (cx_coord - px + r) * scale;
              const cez = (cz_coord - pz + r) * scale;
              const cdx_px = cex - size / 2;
              const cdz_px = cez - size / 2;
              const clen = Math.hypot(cdx_px, cdz_px);

              ctx.fillStyle = '#f43f5e'; // beautiful chest rose color
              if (clen <= size / 2) {
                ctx.fillRect(cex - 3, cez - 3, 6, 6);
                ctx.font = '11px -apple-system, sans-serif';
                ctx.fillText('🎁', cex - 5.5, cez - 5);
              } else {
                const nx = cdx_px / clen;
                const nz = cdz_px / clen;
                const edgeDist = size / 2 - 5;
                const bX = size / 2 + nx * edgeDist;
                const bY = size / 2 + nz * edgeDist;
                
                ctx.beginPath();
                ctx.arc(bX, bY, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '9px -apple-system, sans-serif';
                ctx.fillText('🎁', bX - 4.5, bY - 4.5);
              }
            }

            ctx.restore();
          }
        }

        // --- COMPUTE ACTIVE TEAMMATE OVERLAYS & ARROWS ---
        if (remotePlayers && remotePlayers.size > 0) {
          const indicators: any[] = [];
          const frustum = new THREE.Frustum();
          const projScreenMatrix = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
          frustum.setFromProjectionMatrix(projScreenMatrix);

          remotePlayers.forEach((group, id) => {
            const tPos = new THREE.Vector3().copy(group.position);
            tPos.y += 1.8; // Target above teammate head

            const dist = pInst.pos.distanceTo(group.position);
            
            // Project the 3D position to 2D screen NDC [-1, 1] range
            const projected = new THREE.Vector3().copy(tPos).project(cam);
            
            // Calculate direction relative to camera local orientation
            const localV = new THREE.Vector3().copy(group.position).applyMatrix4(cam.matrixWorldInverse);
            const angle = Math.atan2(localV.x, -localV.z);

            // Is the teammate on-screen in front of the camera?
            const inFrustum = frustum.containsPoint(tPos);
            const onScreen = inFrustum && projected.z <= 1;

            if (onScreen) {
              const x = (projected.x * 0.5 + 0.5) * 100;
              const y = (-projected.y * 0.5 + 0.5) * 100;
              indicators.push({
                id,
                name: group.name || 'Đồng đội',
                dist: Math.round(dist),
                screenX: x,
                screenY: y,
                onScreen: true,
                angle
              });
            } else {
              indicators.push({
                id,
                name: group.name || 'Đồng đội',
                dist: Math.round(dist),
                onScreen: false,
                angle
              });
            }
          });

          if (fpsCnt.current % 3 === 0) {
            setTeammates(indicators);
          }
        } else {
          if (teammates.length > 0 && fpsCnt.current % 3 === 0) {
            setTeammates([]);
          }
        }

        renderer.render(scene, cam);
      }

      activeFrameId = requestAnimationFrame(renderLoop);
    };

    activeFrameId = requestAnimationFrame(renderLoop);

    // ─── Native Multi-touch Global Hook listeners ───
    const handleNativeTouchStart = (e: TouchEvent) => {
      let onInteractive = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elem && (
          elem.closest('#menu') ||
          elem.closest('#inventory') ||
          elem.closest('#shop') ||
          elem.closest('#chat-container') ||
          elem.closest('#actBtns') ||
          elem.closest('#bpRow') ||
          elem.closest('.hotbar') ||
          elem.closest('#goldPill') ||
          elem.closest('.pill') ||
          elem.closest('#invBtn2') ||
          elem.closest('.chat-box') ||
          elem.closest('#sos-modal') ||
          elem.closest('#treasure-guide') ||
          elem.closest('#settings-modal') ||
          elem.closest('#dead') ||
          elem.closest('#victory-screen') ||
          elem.tagName === 'BUTTON' ||
          elem.tagName === 'INPUT' ||
          elem.tagName === 'SELECT'
        )) {
          onInteractive = true;
          break;
        }
      }
      if (!onInteractive) {
        e.preventDefault();
      }

      const tInst = touchSysRef.current;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const cx = touch.clientX, cy = touch.clientY;
        const id = touch.identifier;

        // Skip buttons click zones
        const targetElement = document.elementFromPoint(cx, cy) as HTMLElement;
        if (
          targetElement &&
          (targetElement.classList.contains('ab') ||
            targetElement.classList.contains('bpb') ||
            targetElement.closest('#actBtns') ||
            targetElement.closest('#bpRow') ||
            targetElement.closest('.slot') ||
            targetElement.closest('#goldPill') ||
            targetElement.closest('#invBtn2') ||
            targetElement.closest('#chat-container') ||
            targetElement.closest('.chat-box'))
        ) {
          continue;
        }

        // If left half window, load joystick
        const scaleLimit = window.innerWidth * 0.45;
        const heightMinL = window.innerHeight * 0.4;
        if (cx < scaleLimit && cy > heightMinL && tInst._jid === -1) {
          tInst._jid = id;
          const joyWrapEl = document.getElementById('joyWrap');
          if (joyWrapEl) {
            const r = joyWrapEl.getBoundingClientRect();
            tInst._jcx = r.left + r.width / 2;
            tInst._jcy = r.top + r.height / 2;
            tInst._jR = (r.width / 2) * 0.7;
          } else {
            tInst._jcx = 64;
            tInst._jcy = window.innerHeight - 150;
            tInst._jR = 38;
          }
          updateJoystickCoords(cx, cy, tInst);
        } else if (cx > window.innerWidth * 0.38 && tInst._lid === -1) {
          // If right half, load looking swipe anchor
          tInst._lid = id;
          tInst._llx = cx;
          tInst._lly = cy;
        }
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      let onInteractive = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elem && (
          elem.closest('#menu') ||
          elem.closest('#inventory') ||
          elem.closest('#shop') ||
          elem.closest('#chat-container') ||
          elem.closest('#actBtns') ||
          elem.closest('#bpRow') ||
          elem.closest('.hotbar') ||
          elem.closest('#goldPill') ||
          elem.closest('.pill') ||
          elem.closest('#invBtn2') ||
          elem.closest('.chat-box') ||
          elem.closest('#sos-modal') ||
          elem.closest('#treasure-guide') ||
          elem.closest('#settings-modal') ||
          elem.closest('#dead') ||
          elem.closest('#victory-screen') ||
          elem.tagName === 'BUTTON' ||
          elem.tagName === 'INPUT' ||
          elem.tagName === 'SELECT'
        )) {
          onInteractive = true;
          break;
        }
      }
      if (!onInteractive) {
        e.preventDefault();
      }

      const tInst = touchSysRef.current;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === tInst._jid) {
          updateJoystickCoords(touch.clientX, touch.clientY, tInst);
        }
        if (touch.identifier === tInst._lid) {
          tInst.ldx += touch.clientX - tInst._llx;
          tInst.ldy += touch.clientY - tInst._lly;
          tInst._llx = touch.clientX;
          tInst._lly = touch.clientY;
        }
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      const tInst = touchSysRef.current;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === tInst._jid) {
          tInst._jid = -1;
          tInst.jx = 0;
          tInst.jy = 0;
          const knobEl = document.getElementById('joyKnob');
          if (knobEl) {
            knobEl.style.left = '50%';
            knobEl.style.top = '50%';
          }
        }
        if (touch.identifier === tInst._lid) {
          tInst._lid = -1;
        }
      }
    };

    window.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    window.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    window.addEventListener('touchend', handleNativeTouchEnd);
    window.addEventListener('touchcancel', handleNativeTouchEnd);

    // 9. CLEANUPS on unmount
    return () => {
      cancelAnimationFrame(activeFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handleLockChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
      window.removeEventListener('wheel', handleWheel);
      
      window.removeEventListener('touchstart', handleNativeTouchStart);
      window.removeEventListener('touchmove', handleNativeTouchMove);
      window.removeEventListener('touchend', handleNativeTouchEnd);
      window.removeEventListener('touchcancel', handleNativeTouchEnd);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      entsRef.current.forEach(e => e.remove());
      clearInterval(pingTimer);
      socketService.disconnect();
    };
  }, [isPlaying]);

  const updateJoystickCoords = (cx: number, cy: number, tracker: any) => {
    const R = tracker._jR || 38;
    let dx = cx - tracker._jcx;
    let dy = cy - tracker._jcy;
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx *= R / len;
      dy *= R / len;
    }
    tracker.jx = dx / R;
    tracker.jy = dy / R;
    
    const knob = document.getElementById('joyKnob');
    const wrap = document.getElementById('joyWrap');
    if (knob && wrap) {
      const r = wrap.getBoundingClientRect();
      knob.style.left = (tracker._jcx + dx - r.left) + 'px';
      knob.style.top = (tracker._jcy + dy - r.top) + 'px';
    }
  };

  /* ─── Touch Action Button Bindings ─── */
  const bindTactileAction = (
    type: 'jump' | 'break' | 'place',
    isStart: boolean,
    elId: string
  ) => {
    const el = document.getElementById(elId);
    if (el) {
      if (isStart) el.classList.add('pressed');
      else el.classList.remove('pressed');
    }

    const tInst = touchSysRef.current;
    if (type === 'jump') {
      tInst.jumpHeld = isStart;
    } else if (type === 'break') {
      tInst.breakHeld = isStart;
      if (isStart) tInst.breakOnce = true;
    } else if (type === 'place') {
      tInst.placeHeld = isStart;
      if (isStart) tInst.placeOnce = true;
    }
  };

  /* ─── Consume / Equip Bag Item ─── */
  const consumeItem = (id: string) => {
    const it = ITM[id];
    if (!it || !bagItems[id]) return;

    const p = playerRef.current;
    if (!p) return;

    if (it.t === 'food') {
      p.hunger = Math.min(20, p.hunger + (it.hg || 0));
      if (it.hl) p.heal(it.hl);
      remBagItem(id, 1);
      triggerToast(`🍖 Đã dùng ${it.e} ${it.n}`);
    } else if (it.t === 'potion') {
      if (it.hl) p.heal(it.hl);
      if (it.spd) {
        p.spdB = it.spd;
        triggerToast(`💊 Nhận hiệu ứng Tốc Độ +${it.spd} trong 15s!`);
        setTimeout(() => { if (playerRef.current) playerRef.current.spdB = 0; }, 15000);
      } else if (it.dmg) {
        p.dmgB = it.dmg;
        triggerToast(`💥 Nhận hiệu ứng Sức Mạnh Tấn Công +${it.dmg} trong 15s!`);
        setTimeout(() => { if (playerRef.current) playerRef.current.dmgB = 0; }, 15000);
      } else {
        triggerToast(`💊 Đã dùng ${it.e} ${it.n}`);
      }
      remBagItem(id, 1);
    } else if (it.t === 'weapon') {
      p.wpn = it;
      setEquippedWpn(it);
      triggerToast(`⚔️ Đã trang bị ${it.e} ${it.n}! (+Lực chiến)`);
      setInventoryActive(false);
    } else if (it.t === 'armor') {
      if (it.def) p.def = it.def;
      if (it.spd) p.spdB = it.spd;
      triggerToast(`🛡️ Đã mặc ${it.e} ${it.n} thành công!`);
    } else if (it.t === 'special' && it.fly) {
      p.fly = !p.fly;
      triggerToast(`👑 Cánh Phượng Hoàng: Bay ${p.fly ? 'BẬT 🦅' : 'TẮT'}!`);
      setInventoryActive(false);
    } else if (it.t === 'tool') {
      triggerToast(`🔧 Đã cầm ${it.e} ${it.n} trên tay!`);
      setInventoryActive(false);
    }
  };

  /* ─── Shop Checkouts buy actions ─── */
  const purchaseShopItem = (id: string, price: number) => {
    const p = playerRef.current;
    if (!p) return;

    if (p.gold < price) {
      triggerToast('❌ Thiếu vàng rồi bro!');
      return;
    }

    p.gold -= price;
    setGoldCount(p.gold);
    addBagItem(id, 1);
    triggerToast(`Mua thành công: ${ITM[id]?.e} ${ITM[id]?.n}`);
  };

  /* ─── Respawn Action ─── */
  const reloadRespawn = () => {
    const p = playerRef.current;
    if (p) {
      p.respawn(32);
      setHp(p.hp);
      setHunger(p.hunger);
      setIsDead(false);
      triggerToast('🔄 Hồi sinh thành công!');
    }
  };

  /* ─── Render components ─── */
  return (
    <div className="relative w-full h-full text-slate-100 select-none overflow-hidden bg-slate-950">
      
      {/* ─── 1. CORE CANVAS ─── */}
      <div
        id="voxel-viewport"
        ref={containerRef}
        className={`absolute inset-0 w-full h-full select-none touch-none ${
          isPlaying ? 'block' : 'hidden'
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full block outline-none" />

        {/* 🌦️ Weather Full-Screen Atmospheric Overlays */}
        {isPlaying && weather === 'rain' && (
          <div className="absolute inset-0 pointer-events-none z-[2] bg-blue-950/15 mix-blend-color-burn animate-pulse" style={{
            backgroundImage: `repeating-linear-gradient(170deg, rgba(255,255,255,0) 0px, rgba(230,240,255,0.06) 1px, rgba(100,100,150,0) 2px, rgba(0,0,0,0) 80px)`,
            backgroundSize: '300px 300px',
          }} />
        )}
        {isPlaying && weather === 'fog' && (
          <div className="absolute inset-0 pointer-events-none z-[2] bg-slate-200/10 backdrop-blur-[0.5px] transition-all duration-1000" />
        )}
        {isPlaying && weather === 'eclipse' && (
          <div className="absolute inset-0 pointer-events-none z-[2] bg-red-950/20 mix-blend-color-burn animate-pulse transition-all duration-1500" style={{
            boxShadow: 'inset 0 0 100px rgba(185, 28, 28, 0.25)'
          }} />
        )}

        {/* 📜 Survival Daily Quests Panel (Glassmorphic, collapsible) */}
        {isPlaying && (
          <div className="absolute right-4 top-24 pointer-events-auto z-[25] flex flex-col items-end select-none">
            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => {
                setShowQuestsPanel(!showQuestsPanel);
                synth.playCollect();
              }}
              className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-1.5 px-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer active:scale-95"
            >
              <span>📜</span>
              <span>Nhiệm vụ Sinh tồn Daily</span>
              <span className="font-mono text-[10px] text-slate-400">({showQuestsPanel ? 'Ẩn' : 'Hiện'})</span>
            </button>

            {showQuestsPanel && (
              <div className="mt-2 w-72 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-black text-[11px] tracking-wider uppercase text-emerald-400">🎯 HOẠT ĐỘNG THƯỜNG NHẬT</span>
                  <span className="font-mono text-[10px] text-slate-500">Reset sau 24h</span>
                </div>

                {/* Quest 1: Mine 15 Stones */}
                <div className="flex flex-col gap-1.5 p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${stnMinedProgress >= 15 ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      ⛏️ Khai thác 15 khối Đá Cuội
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{stnMinedProgress}/15</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (stnMinedProgress / 15) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Thưởng: <span className="text-amber-400 font-bold">120🪙</span></span>
                    {stnMinedProgress >= 15 ? (
                      questStnMinedClaimed ? (
                        <span className="text-emerald-500 font-black">✓ ĐÃ NHẬN</span>
                      ) : (
                        <button
                          onClick={() => {
                            setQuestStnMinedClaimed(true);
                            if (playerRef.current) {
                              playerRef.current.gold += 120;
                              setGoldCount(playerRef.current.gold);
                            }
                            triggerToast('🎁 QUÀ NHIỆM VỤ: +120🪙 đã được thêm vào túi!');
                            synth.playCollect();
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-0.5 rounded-md cursor-pointer active:scale-95"
                        >
                          NHẬN THƯỞNG
                        </button>
                      )
                    ) : (
                      <span className="text-slate-550">Chưa xong</span>
                    )}
                  </div>
                </div>

                {/* Quest 2: Slay 3 Hostiles */}
                <div className="flex flex-col gap-1.5 p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${zmbKilledProgress >= 3 ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      ⚔️ Tiêu diệt 3 quái thú dị chủng
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{zmbKilledProgress}/3</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (zmbKilledProgress / 3) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Thưởng: <span className="text-amber-400 font-bold">180🪙</span></span>
                    {zmbKilledProgress >= 3 ? (
                      questZmbKilledClaimed ? (
                        <span className="text-emerald-500 font-black">✓ ĐÃ NHẬN</span>
                      ) : (
                        <button
                          onClick={() => {
                            setQuestZmbKilledClaimed(true);
                            if (playerRef.current) {
                              playerRef.current.gold += 180;
                              setGoldCount(playerRef.current.gold);
                            }
                            triggerToast('🎁 QUÀ NHIỆM VỤ: +180🪙 đã được thêm vào túi!');
                            synth.playCollect();
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-0.5 rounded-md cursor-pointer active:scale-95"
                        >
                          NHẬN THƯỞNG
                        </button>
                      )
                    ) : (
                      <span className="text-slate-550">Chưa xong</span>
                    )}
                  </div>
                </div>

                {/* Quest 3: Place 10 Blocks */}
                <div className="flex flex-col gap-1.5 p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${blkPlacedProgress >= 10 ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      🧱 Đặt thành công 10 khối xây dựng
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{blkPlacedProgress}/10</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (blkPlacedProgress / 10) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Thưởng: <span className="text-amber-400 font-bold">100🪙</span></span>
                    {blkPlacedProgress >= 10 ? (
                      questBlkPlacedClaimed ? (
                        <span className="text-emerald-500 font-black">✓ ĐÃ NHẬN</span>
                      ) : (
                        <button
                          onClick={() => {
                            setQuestBlkPlacedClaimed(true);
                            if (playerRef.current) {
                              playerRef.current.gold += 100;
                              setGoldCount(playerRef.current.gold);
                            }
                            triggerToast('🎁 QUÀ NHIỆM VỤ: +100🪙 đã được thêm vào túi!');
                            synth.playCollect();
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-0.5 rounded-md cursor-pointer active:scale-95"
                        >
                          NHẬN THƯỞNG
                        </button>
                      )
                    ) : (
                      <span className="text-slate-550">Chưa xong</span>
                    )}
                  </div>
                </div>

                {/* Quest 4: Craft 1 Item */}
                <div className="flex flex-col gap-1.5 p-2 bg-slate-900/40 border border-slate-800/60 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${itemCraftedProgress >= 1 ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      🧪 Chế tạo thành công 1 thành phẩm
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{itemCraftedProgress}/1</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, (itemCraftedProgress / 1) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Thưởng: <span className="text-amber-400 font-bold">150🪙</span></span>
                    {itemCraftedProgress >= 1 ? (
                      questItemCraftedClaimed ? (
                        <span className="text-emerald-500 font-black">✓ ĐÃ NHẬN</span>
                      ) : (
                        <button
                          onClick={() => {
                            setQuestItemCraftedClaimed(true);
                            if (playerRef.current) {
                              playerRef.current.gold += 150;
                              setGoldCount(playerRef.current.gold);
                            }
                            triggerToast('🎁 QUÀ NHIỆM VỤ: +150🪙 đã được thêm vào túi!');
                            synth.playCollect();
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-0.5 rounded-md cursor-pointer active:scale-95"
                        >
                          NHẬN THƯỞNG
                        </button>
                      )
                    ) : (
                      <span className="text-slate-550">Chưa xong</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 2. MAIN MENU OVERLAY ─── */}
      {!isPlaying && (
        <div id="menu">
          <div className="mc shadow-2xl relative border-dashed">
            <h1 className="logo font-black tracking-tight select-none">VOXELVERSE 2.0</h1>
            <p className="tag text-slate-400 mb-3 text-center text-xs">Phiên bản Sandbox Cực Hạn  · 2026</p>

            {/* ─── ROOM HOST/JOIN SWITCHER ─── */}
            <div className="flex bg-slate-900 border border-slate-700/60 p-1 rounded-2xl mb-4 gap-1.5 justify-center select-none">
              <button
                type="button"
                className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  roomAction === 'create'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                onClick={() => {
                  setRoomAction('create');
                  synth.playPlace();
                  triggerToast('👑 CHỦ PHÒNG: Tự do tùy chọn Biome, Seed, Độ Khó & Quái!');
                }}
              >
                👑 TẠO PHÒNG MỚI (Host)
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                  roomAction === 'join'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                onClick={() => {
                  setRoomAction('join');
                  synth.playPlace();
                  triggerToast('📡 THAM GIA: Chờ đồng bộ thế giới từ ID phòng chơi!');
                }}
              >
                📡 THAM GIA PHÒNG (Join)
              </button>
            </div>

            <div className="row">
              <div className="f">
                <label>Tên Người Chơi</label>
                <input
                  type="text"
                  maxLength={16}
                  value={opts.name}
                  onChange={(e) => setOpts({ ...opts, name: e.target.value })}
                />
              </div>
              <div className="f">
                <label className="flex items-center gap-1">
                  Biomes Thế Giới 
                  {roomAction === 'join' && <span className="text-[9px] text-blue-400 font-bold font-mono">[KHÓA JOIN]</span>}
                </label>
                <select
                  value={opts.biome}
                  disabled={roomAction === 'join'}
                  style={roomAction === 'join' ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#0f172a' } : {}}
                  onChange={(e) => setOpts({ ...opts, biome: e.target.value })}
                >
                  {opts.mode === 'treasure' ? (
                    <>
                      <option value="plains">Thảo Nguyên (Mặc định)</option>
                      <option value="desert">Hoang Mạc Cát</option>
                      <option value="cherry">Rừng Hoa Anh Đào</option>
                    </>
                  ) : (
                    <>
                      <option value="plains">🌾 Plains (Đồng cỏ)</option>
                      <option value="forest">🌲 Forest (Trùng lâu)</option>
                      <option value="desert">🏜️ Desert (Sa mạc)</option>
                      <option value="snow">❄️ Snow (Băng thổ)</option>
                      <option value="cherry">🌸 Cherry (Anh đào)</option>
                      <option value="volcano">🌋 Volcano (Núi lửa)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="f">
                <label className="flex items-center gap-1">
                  Seed Kỹ Thuật Số
                  {roomAction === 'join' && <span className="text-[9px] text-blue-400 font-bold font-mono">[KHÓA]</span>}
                </label>
                <input
                  type="text"
                  value={opts.seed}
                  disabled={roomAction === 'join'}
                  style={roomAction === 'join' ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#0f172a' } : {}}
                  onChange={(e) => setOpts({ ...opts, seed: e.target.value })}
                />
              </div>
              <div className="f">
                <label className="flex items-center gap-1">
                  Số Lượng Bots Quái
                  {roomAction === 'join' && <span className="text-[9px] text-blue-400 font-bold font-mono">[KHÓA]</span>}
                </label>
                <select
                  value={opts.botCount}
                  disabled={roomAction === 'join'}
                  style={roomAction === 'join' ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#0f172a' } : {}}
                  onChange={(e) => setOpts({ ...opts, botCount: e.target.value })}
                >
                  <option value="0">Không có</option>
                  <option value="3">3 Bots quái</option>
                  <option value="6">6 Bots cực căng</option>
                  <option value="10">10 Thảm họa</option>
                </select>
              </div>
              {opts.mode === 'treasure' && (
                <div className="f">
                  <label className="flex items-center gap-1">
                    Độ Khó (Treasure)
                    {roomAction === 'join' && <span className="text-[9px] text-blue-400 font-bold font-mono">[KHÓA]</span>}
                  </label>
                  <select
                    value={opts.difficulty}
                    disabled={roomAction === 'join'}
                    style={roomAction === 'join' ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#0f172a' } : {}}
                    onChange={(e) => setOpts({ ...opts, difficulty: e.target.value as any })}
                  >
                    <option value="easy">Dễ (Map nhỏ, 2🔑)</option>
                    <option value="normal">Bình thường (3🔑)</option>
                    <option value="hard">Khó (Map to, 5🔑, Dơi độc)</option>
                    <option value="extreme">Cực Khó (Map rồng, 7🔑)</option>
                  </select>
                </div>
              )}
              <div className="f" style={{ minWidth: '180px' }}>
                <label className="flex items-center gap-1">
                  🌐 {roomAction === 'create' ? 'Tạo Mã Sảnh Phòng' : 'Mã Phòng Muốn Join'}
                </label>
                <div className="flex gap-1 w-full">
                  <input
                    type="text"
                    value={opts.room}
                    placeholder={roomAction === 'create' ? "lobby" : "Nhập Room ID..."}
                    className={`flex-1 min-w-[70px] ${roomAction === 'join' ? 'border-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.2)] bg-blue-950/20' : ''}`}
                    onChange={(e) => setOpts({ ...opts, room: e.target.value })}
                  />
                  {roomAction === 'create' ? (
                    <>
                      <button
                        type="button"
                        className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Tạo mã phòng ngẫu nhiên"
                        onClick={() => {
                          const randRoom = 'room-' + ~~(Math.random() * 9000 + 1000);
                          setOpts((prev) => ({ ...prev, room: randRoom }));
                          synth.playPlace();
                          triggerToast('✨ Đã tạo mã phòng ngẫu nhiên!');
                        }}
                      >
                        🎲 Ngẫu Nhiên
                      </button>
                      <button
                        type="button"
                        className="px-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Sao chép liên kết mời"
                        onClick={() => {
                          copyInviteLink();
                          synth.playPlace();
                        }}
                      >
                        🔗 Mời Bạn
                      </button>
                    </>
                  ) : (
                    <div className="px-3 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 tracking-widest select-none uppercase">
                      📡 Sẵn Sàng Join
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Online character dynamic creator panel */}
            <div className="mt-4 border border-slate-700/60 bg-slate-900/40 rounded-xl p-3">
              <label className="block mb-2 font-bold text-xs text-emerald-400 select-none uppercase tracking-wider">👤 Tạo nhân vật &amp; thay xiêm y (Sảnh Online)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Skin Color Picker */}
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1 select-none">Màu Da (Skin Color)</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { c: '#dbcca0', name: 'Sáng' },
                      { c: '#bf9e75', name: 'Rám nắng' },
                      { c: '#10b981', name: 'Alien' },
                      { c: '#ec4899', name: 'Hồng sen' },
                      { c: '#8b5cf6', name: 'Tử khí' }
                    ].map((item) => (
                      <button
                        key={item.c}
                        type="button"
                        className={`w-5 h-5 rounded border cursor-pointer transition-all ${opts.skinColor === item.c ? 'border-emerald-400 scale-110 shadow shadow-emerald-400/50' : 'border-slate-800 hover:scale-105'}`}
                        style={{ backgroundColor: item.c }}
                        title={item.name}
                        onClick={() => setOpts(prev => ({ ...prev, skinColor: item.c }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Shirt Color Picker */}
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1 select-none">Màu Áo (Shirt Color)</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { c: '#3b82f6', name: 'Xanh dương' },
                      { c: '#ef4444', name: 'Đỏ ruby' },
                      { c: '#10b981', name: 'Xanh ngọc' },
                      { c: '#f59e0b', name: 'Vàng cam' },
                      { c: '#1e293b', name: 'Bóng đêm' }
                    ].map((item) => (
                      <button
                        key={item.c}
                        type="button"
                        className={`w-5 h-5 rounded border cursor-pointer transition-all ${opts.shirtColor === item.c ? 'border-emerald-400 scale-110 shadow shadow-emerald-400/50' : 'border-slate-800 hover:scale-105'}`}
                        style={{ backgroundColor: item.c }}
                        title={item.name}
                        onClick={() => setOpts(prev => ({ ...prev, shirtColor: item.c }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Pants Color Picker */}
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1 select-none">Màu Quần (Pants Color)</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { c: '#1d4ed8', name: 'Xanh jean' },
                      { c: '#111827', name: 'Huyền bí' },
                      { c: '#7c2d12', name: 'Nâu đất' },
                      { c: '#0f766e', name: 'Nhung rêu' },
                      { c: '#ec4899', name: 'Phá cách' }
                    ].map((item) => (
                      <button
                        key={item.c}
                        type="button"
                        className={`w-5 h-5 rounded border cursor-pointer transition-all ${opts.pantsColor === item.c ? 'border-emerald-400 scale-110 shadow shadow-emerald-400/50' : 'border-slate-800 hover:scale-105'}`}
                        style={{ backgroundColor: item.c }}
                        title={item.name}
                        onClick={() => setOpts(prev => ({ ...prev, pantsColor: item.c }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Character CSS Preview and Avatar card */}
              <div className="flex justify-center items-center mt-3 p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-2 select-none">Xem Trước Nhân Vật (Avatar Preview)</span>
                  <div className="flex flex-col items-center justify-center space-y-0.5" style={{ height: '70px', width: '50px' }}>
                    {/* Head */}
                    <div className="w-5 h-5 rounded-sm transition-colors duration-200 border border-slate-800/10" style={{ backgroundColor: opts.skinColor }} />
                    {/* Body */}
                    <div className="w-7 h-7 rounded-sm transition-colors duration-200 flex justify-between px-0.5 select-none relative" style={{ backgroundColor: opts.shirtColor }}>
                      {/* Left and Right Arms */}
                      <div className="w-1.5 h-full rounded-sm absolute -left-2 top-0" style={{ backgroundColor: opts.skinColor }} />
                      <div className="w-1.5 h-full rounded-sm absolute -right-2 top-0" style={{ backgroundColor: opts.skinColor }} />
                    </div>
                    {/* Legs */}
                    <div className="flex gap-1 w-7 h-5 justify-between">
                      <div className="w-3 h-full rounded-sm transition-colors duration-200" style={{ backgroundColor: opts.pantsColor }} />
                      <div className="w-3 h-full rounded-sm transition-colors duration-200" style={{ backgroundColor: opts.pantsColor }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-bold block mt-1.5">{opts.name || 'Steve'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-1 font-bold flex items-center gap-1.5">
                Chế Độ Chơi Game
                {roomAction === 'join' && <span className="text-xs text-blue-400 font-black font-sans bg-blue-950/60 border border-blue-800/80 px-2 py-0.5 rounded-md uppercase">Đã đồng bộ từ Phòng</span>}
              </label>
              <div className="mg">
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'creative' ? 's' : ''} ${roomAction === 'join' ? 'opacity-65 cursor-not-allowed hover:bg-transparent' : ''}`}
                  onClick={() => {
                    if (roomAction === 'join') {
                      triggerToast('🔒 KHÔNG THỂ THAY ĐỔI: Chế độ chơi đã được đồng bộ với sảnh người khác!');
                      synth.playHit();
                      return;
                    }
                    setOpts(prev => ({ ...prev, mode: 'creative' }));
                    if (playerRef.current) playerRef.current.fly = true;
                    setCurrentBadge('🎨 CREATIVE');
                  }}
                >
                  <span className="i">🎨</span>
                  <div className="n">Creative</div>
                  <div className="d">Bay lượn tự do</div>
                </button>
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'survival' ? 's' : ''} ${roomAction === 'join' ? 'opacity-65 cursor-not-allowed hover:bg-transparent' : ''}`}
                  onClick={() => {
                    if (roomAction === 'join') {
                      triggerToast('🔒 KHÔNG THỂ THAY ĐỔI: Chế độ chơi đã được đồng bộ với sảnh người khác!');
                      synth.playHit();
                      return;
                    }
                    setOpts(prev => ({ ...prev, mode: 'survival' }));
                    if (playerRef.current) playerRef.current.fly = false;
                    setCurrentBadge('⚔️ SURVIVAL');
                  }}
                >
                  <span className="i">⚔️</span>
                  <div className="n">Survival</div>
                  <div className="d">Máu &amp; Quái vật</div>
                </button>
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'adventure' ? 's' : ''} ${roomAction === 'join' ? 'opacity-65 cursor-not-allowed hover:bg-transparent' : ''}`}
                  onClick={() => {
                    if (roomAction === 'join') {
                      triggerToast('🔒 KHÔNG THỂ THAY ĐỔI: Chế độ chơi đã được đồng bộ với sảnh người khác!');
                      synth.playHit();
                      return;
                    }
                    setOpts(prev => ({ ...prev, mode: 'adventure' }));
                    if (playerRef.current) playerRef.current.fly = false;
                    setCurrentBadge('🗺️ ADVENTURE');
                  }}
                >
                  <span className="i">🗺️</span>
                  <div className="n">Adventure</div>
                  <div className="d">Khám phá dã ngoại</div>
                </button>
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'treasure' ? 's' : ''} ${roomAction === 'join' ? 'opacity-65 cursor-not-allowed hover:bg-transparent' : ''}`}
                  onClick={() => {
                    if (roomAction === 'join') {
                      triggerToast('🔒 KHÔNG THỂ THAY ĐỔI: Chế độ chơi đã được đồng bộ với sảnh người khác!');
                      synth.playHit();
                      return;
                    }
                    setOpts(prev => ({ 
                      ...prev, 
                      mode: 'treasure',
                      biome: 'plains'
                    }));
                    if (playerRef.current) playerRef.current.fly = false;
                    setCurrentBadge('👑 TREASURE');
                    setShowTreasureGuide(true);
                  }}
                >
                  <span className="i">🔑</span>
                  <div className="n">Truy Tìm Kho Báu</div>
                  <div className="d">Săn rương báu & Lửa</div>
                </button>
              </div>
            </div>

            {onBackToLanding && (
              <button
                type="button"
                className="w-full mt-4 py-2.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                onClick={() => {
                  synth.playPlace();
                  onBackToLanding();
                }}
              >
                🏠 Trở về Trang Chủ Wiki
              </button>
            )}

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                className={`btn sec font-bold active:scale-95 m-0 transition-colors ${
                  isAudioMuted 
                    ? 'bg-rose-950/40 hover:bg-rose-900/40 border-rose-800 text-rose-300' 
                    : 'hover:bg-slate-800'
                }`}
                style={{ flex: 1, marginTop: 0 }}
                onClick={() => {
                  const newMuted = !isAudioMuted;
                  audioSystem.setMuted(newMuted);
                  synth.setMuted(newMuted);
                  setIsAudioMuted(newMuted);
                  if (!newMuted) {
                    synth.playPlace();
                  }
                }}
              >
                {isAudioMuted ? '🔇 TẮT ÂM SFX' : '🔊 BẬT ÂM SFX'}
              </button>
              <button
                type="button"
                className="btn sec font-bold active:scale-95 m-0 hover:bg-slate-800"
                style={{ flex: 1, marginTop: 0 }}
                onClick={toggleFullscreen}
              >
                🖥️ TOÀN MÀN HÌNH
              </button>
            </div>

            <div className="mt-2 text-center">
              <button
                className="btn font-black text-slate-900 leading-none shadow-emerald-400/20 active:scale-95 m-0 w-full"
                onClick={async () => {
                  synth.init();
                  
                  if (roomAction === 'join') {
                    const roomNameInput = (opts.room || '').trim();
                    if (!roomNameInput) {
                      triggerToast('⚠️ LỖI: Hãy nhập ID phòng muốn truy cập!');
                      return;
                    }
                    try {
                      // Fetch room state from server
                      const res = await fetch(`/api/room-config?room=${encodeURIComponent(roomNameInput)}`);
                      const data = await res.json();
                      if (data.exists && data.config) {
                        const config = data.config;
                        // Build full custom synchronized options
                        const updatedOpts = {
                          ...opts,
                          room: roomNameInput,
                          seed: config.seed,
                          biome: config.biome,
                          mode: config.mode,
                          difficulty: config.difficulty,
                          botCount: config.botCount
                        };
                        optsRef.current = updatedOpts;
                        setOpts(updatedOpts);
                        triggerToast(`✨ ĐỒNG BỘ THÀNH CÔNG: Đã kết nối với phòng ${roomNameInput.toUpperCase()}! Bản đồ: ${config.biome.toUpperCase()}`);
                      } else {
                        triggerToast(`ℹ️ Tạo phòng mới với ID: ${roomNameInput.toUpperCase()}`);
                      }
                    } catch (err) {
                      console.error('Error syncing room options:', err);
                      triggerToast('⚠️ CẢNH BÁO: Không kết nối được bộ điều khiển phòng, chơi chế độ ngoại tuyến.');
                    }
                  }
                  
                  setIsPlaying(true);
                }}
              >
                ▶ BẮT ĐẦU CHƠI GAME
              </button>
            </div>

            <div className="sg font-semibold font-mono">
              <div className="sp">
                <b>WebGL2</b>GPU Card
              </div>
              <div className="sp">
                <b>{Dev.tier().toUpperCase()}</b>Phần cứng
              </div>
              <div className="sp">
                <b>{Dev.rd()} chunks</b>Tầm nhìn
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. INTERACTIVE HUD OVERLAYS ─── */}
      {isPlaying && (
        <div id="hud" className="on font-sans">
          {/* Proximity Warning Alerts / Radar HUD Panel */}
          {proximityWarning && (
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4 animate-bounce select-none pointer-events-none">
              <div className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md ${
                proximityWarning.type === 'chest' 
                  ? 'bg-red-950/80 border-red-500 text-red-100' 
                  : 'bg-amber-950/85 border-amber-500 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <span className="text-lg animate-pulse">{proximityWarning.type === 'chest' ? '🚨🚨' : '📡📡'}</span>
                  <span className="font-black text-[11px] tracking-widest uppercase">
                    {proximityWarning.type === 'chest' ? 'BÁO ĐỘNG CẬN KỀ' : 'TÍN HIỆU RADAR'}
                  </span>
                </div>
                <p className="text-xs font-bold leading-normal mb-0.5">
                  Đang đến rất gần {proximityWarning.name}!
                </p>
                <div className="flex items-baseline gap-1 mt-0.5 justify-center">
                  <span className="text-[10px] opacity-75">Khoảng cách:</span>
                  <span className="text-sm font-black font-mono text-white animate-pulse">
                    {proximityWarning.dist}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top diagnostic panel bar */}
          <div className="tbar flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <div className="pill select-none">
                <span className="dot animate-pulse"></span>
                <span>FPS {fps}</span><span className="hidden sm:inline">· {chunkCount}c Chunks</span>
              </div>
              <div className="pill select-none font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  ping === null ? 'bg-slate-500' :
                  ping < 60 ? 'bg-emerald-400' :
                  ping < 150 ? 'bg-amber-400' : 'bg-rose-500'
                } animate-pulse`} />
                <span className="text-[10px] text-slate-400 font-sans">PING:</span>
                <span className={`font-semibold ${
                  ping === null ? 'text-slate-400' :
                  ping < 60 ? 'text-emerald-400' :
                  ping < 150 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {ping === null ? '...' : `${ping}ms`}
                </span>
              </div>
              <div className="pill select-none font-mono font-medium hidden sm:flex">
                📍 {coordsText}
              </div>
              <button
                onClick={() => {
                  setPixelScaleMode(prev => prev === 'high' ? 'low' : 'high');
                  synth.playPlace();
                }}
                className={`pill select-none font-bold active:scale-95 cursor-pointer pointer-events-auto transition-all ${
                  pixelScaleMode === 'low'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400 animate-pulse'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                title="Chuyển đổi Sắc nét vs Hiệu năng (Mượt cho máy cũ)"
              >
                {pixelScaleMode === 'low' ? '⚡ MỢT (OPTIMIZED)' : '✨ SẮC NÉT'}
              </button>
            </div>
            
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  setFlashlightActive(prev => {
                    const next = !prev;
                    triggerToast('Đèn Pin: ' + (next ? 'BẬT 🔦 (L)' : 'TẮT 🔇'));
                    return next;
                  });
                }}
                className={`pill cursor-pointer select-none font-bold active:scale-95 transition-all ${
                  flashlightActive
                    ? 'border-yellow-400 text-yellow-300 shadow-yellow-500/10'
                    : 'border-slate-700 text-slate-400 opacity-80 hover:opacity-100 hover:border-slate-500'
                }`}
                title="Bật/Tắt Đèn pin (Phím L)"
              >
                <span>🔦 {flashlightActive ? 'Đèn: BẬT' : 'Đèn: TẮT'}</span>
                <span className="opacity-50 text-[9px] font-mono px-1 bg-slate-950/80 rounded hidden sm:inline">[L]</span>
              </button>

              {opts.mode === 'treasure' && (
                <>
                  <button
                    onClick={() => {
                      synth.playPlace();
                      setShowTreasureGuide(true);
                    }}
                    className="pill bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 hover:shadow-yellow-500/20 border-yellow-400 font-extrabold cursor-pointer active:scale-95 text-center px-3"
                    title="Xem cẩm nang bản đồ và tọa độ chìa khóa"
                  >
                    📖 HƯỚNG DẪN
                  </button>

                  <button
                    onClick={() => {
                      synth.playPlace();
                      setShowSOSModal(true);
                      if (document.pointerLockElement) {
                        try {
                          document.exitPointerLock();
                        } catch(err) {}
                      }
                    }}
                    className="pill bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border-rose-500 text-white font-extrabold cursor-pointer active:scale-95 animate-pulse text-center px-3 hidden sm:flex"
                    title="Khẩn cấp tiếp tế, bảo vệ & thoát hiểm hiểm nghèo"
                  >
                    🚨 SOS CỨU TRỢ
                  </button>
                </>
              )}

              <div
                className={`pill cursor-pointer select-none font-bold active:scale-95 transition-all w-[110px] text-center flex justify-center ${
                  isVoiceActive 
                    ? speakingPeers.includes('local') 
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse' 
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                    : 'bg-slate-800'
                }`}
                onClick={async () => {
                  synth.playPlace();
                  try {
                    const nowActive = await voiceManager.toggleVoice(opts.room || 'lobby');
                    setIsVoiceActive(nowActive);
                    if (nowActive) {
                      triggerToast('🎤 Đã kết nối Voice Chat vùng (WebRTC)!');
                    } else {
                      triggerToast('🔇 Đã ngắt kết nối Voice Chat');
                    }
                  } catch (e: any) {
                    triggerToast(`❌ Lỗi Voice: ${e.message || "Không có quyền Mic"}`);
                  }
                }}
              >
                {isVoiceActive ? (speakingPeers.includes('local') ? '🎤 PHÁT ÂM' : '🔊 ĐÃ KẾT NỐI') : '🎙️ VOICE'}
              </div>

              <div
                className={`pill cursor-pointer select-none font-bold active:scale-95 transition-all ${
                  showChat ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : ''
                }`}
                onClick={() => {
                  setShowChat(!showChat);
                  synth.playPlace();
                }}
              >
                💬 CHAT {chatLogs.length > 1 ? `(${chatLogs.length - 1})` : ''}
              </div>
              
              <div
                id="invBtn2"
                className="pill pointer-events-auto cursor-pointer font-bold active:scale-95 bg-slate-800"
                onClick={() => {
                  setInventoryActive(prev => !prev);
                  setShopActive(false);
                }}
              >
                🎒 TÚI ĐỒ (E)
              </div>

              <button
                type="button"
                className="pill cursor-pointer select-none font-bold active:scale-95 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-400 hidden lg:flex"
                onClick={() => {
                  copyInviteLink();
                  synth.playPlace();
                }}
              >
                🔗 MỜI BẠN
              </button>
              <button
                type="button"
                className="pill cursor-pointer select-none font-bold active:scale-95 bg-slate-900 border border-slate-700 hidden lg:flex"
                onClick={toggleFullscreen}
              >
                🖥️ TOÀN MÀN HÌNH
              </button>
              
              <button 
                className={`pill cursor-pointer select-none font-bold active:scale-95 transition-all ${
                  showSettings ? 'border-emerald-500 bg-slate-800' : 'border-slate-700'
                }`}
                onClick={() => setShowSettings(!showSettings)}
                title="Cài đặt hệ thống (Esc)"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* --- Multiplayer Immersive Kênh Chat Overlay --- */}
          {showChat && (
            <div
              id="chat-container"
              className="chat-box absolute left-4 top-16 w-80 max-w-[90vw] h-60 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 flex flex-col pointer-events-auto z-40 backdrop-blur-md shadow-2xl select-text"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2">
                <span className="text-xs font-black text-emerald-400 select-none">🌐 PHÒNG CHƠI: {opts.room.toUpperCase()}</span>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-white select-none pointer-events-auto cursor-pointer"
                  onClick={() => setShowChat(false)}
                >
                  ✕ Đóng
                </button>
              </div>

              {/* Chat lines logs container */}
              <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                {chatLogs.map((log, index) => {
                  const isSys = log.sender === 'Hệ thống';
                  const isMe = log.sender === opts.name;
                  return (
                    <div key={index} className="leading-5">
                      <span className={`font-bold ${isSys ? 'text-blue-400' : isMe ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {log.sender}:{' '}
                      </span>
                      <span className="text-slate-200">{log.text}</span>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat action message compose form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  socketService.emit('chat:send', chatInput.trim());
                  setChatLogs((prev) => [...prev, { sender: opts.name, text: chatInput.trim() }]);
                  setChatInput('');
                  setTimeout(() => {
                    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className="flex gap-1 mt-2 border-t border-slate-800 pt-2"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2 text-white outline-none focus:border-emerald-500 placeholder-slate-500"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 py-1 px-3 rounded-lg text-xs cursor-pointer select-none active:scale-95 transition-transform"
                >
                  Gửi
                </button>
              </form>
            </div>
          )}

          {/* Linear sky solar tracking pill */}
          <div id="timePill" className="flex items-center gap-2">
            <span className="bg-slate-950 border border-slate-800 text-emerald-400 font-sans font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider uppercase select-none">
              NGÀY {survivalDay}
            </span>
            <span>{isNight ? '🌙' : '☀️'}</span>
            <div id="timebar">
              <div
                id="tbfill"
                style={{
                  width: `${timePercent}%`,
                  background: isNight
                    ? 'linear-gradient(90deg, #344058, #1c263c)'
                    : 'linear-gradient(90deg, #ffd700, #ff8c00)'
                }}
              />
            </div>
            <span className="font-mono font-bold leading-none">{timeLabel}</span>
          </div>

          {/* Cooperative shared keys tracking pill */}
          {opts.mode === 'treasure' && (
            <div
              id="keysPill"
              title="Số lượng chìa khóa vàng cả đội đã thu thập chung!"
              onClick={() => {
                triggerToast('🔑 Chìa khóa vàng chia sẻ chung toàn phòng! Cùng nhau đi tìm & gom đủ chìa khóa mở Rương Thủy Tổ nhé.');
                synth.playCollect();
              }}
            >
              🔑 <span className="font-mono font-black text-amber-400">{bagItems['key'] || 0}</span>
              <span className="text-[10px] text-blue-400 font-bold font-sans">/</span>
              <span className="font-mono text-slate-400">{(window as any).gameKeysLoc?.length || 3}</span>
            </div>
          )}

          {/* Gold wallet pill */}
          <div
            id="goldPill"
            onClick={() => {
              setShopActive(true);
              setInventoryActive(false);
            }}
          >
            🪙 <span id="goldAmt">{goldCount}</span>
          </div>

          {/* Dynamic Weather System Pill */}
          <div
            id="weatherPill"
            className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 rounded-full py-1.5 px-3 select-none hover:bg-slate-800 transition-colors pointer-events-auto cursor-pointer text-xs"
            onClick={() => {
              triggerToast(`🌦️ Thời tiết: ${
                weather === 'clear' ? 'Trời Quang Đãng ☀️' :
                weather === 'rain' ? 'Mưa Bão Sấm Chớp 🌧️' :
                weather === 'fog' ? 'Sương Mù Dày Đặc 🌫️' : 'Mặt Trăng Máu Kỳ Bí 🌑 (Quái vật siêu khoẻ!)'
              }. Đổi sau ${weatherTimer}s.`);
              synth.playCollect();
            }}
          >
            <span className="text-sm">
              {weather === 'clear' ? '☀️' :
               weather === 'rain' ? '🌧️' :
               weather === 'fog' ? '🌫️' : '🌑' }
            </span>
            <span className="font-sans font-extrabold flex items-center gap-1 leading-none text-[10px] tracking-wider uppercase">
              <span className={
                weather === 'clear' ? 'text-amber-400' :
                weather === 'rain' ? 'text-blue-400 font-black animate-pulse' :
                weather === 'fog' ? 'text-slate-300' : 'text-red-500 font-black animate-pulse'
              }>
                {weather === 'clear' ? 'QUANG' :
                 weather === 'rain' ? 'MƯA BÃO' :
                 weather === 'fog' ? 'SƯƠNG MÙ' : 'TRĂNG MÁU'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono font-normal">({weatherTimer}s)</span>
            </span>
          </div>

          {/* Game mode designation badge */}
          <span
            id="modeBadge"
            className={`${opts.mode} flex items-center justify-center`}
          >
            {currentBadge}
          </span>
          
          {/* Circular Minimap Overlay (Click to Cycle Style) */}
          {minimapVisibleStyle !== 'hidden' && (
            <div
              className={`absolute top-16 left-2 sm:left-4 z-10 rounded-full overflow-hidden border-2 border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-m opacity-90 hover:opacity-100 cursor-pointer transition-all ${
                minimapVisibleStyle === 'compact' ? 'w-20 h-20' : 'w-32 h-32'
              }`}
              onClick={() => {
                const nextStyle = minimapVisibleStyle === 'compact' ? 'expanded' : 'hidden';
                setMinimapVisibleStyle(nextStyle);
                triggerToast(nextStyle === 'expanded' ? '🗺️ Đã mở rộng bản đồ!' : '🗺️ Đã ẩn bản đồ (Tối ưu hóa hiệu năng!)');
                synth.playCollect();
              }}
              title="Nhấp để thu phóng hoặc ẩn bản đồ"
            >
              <canvas ref={minimapCanvasRef} width={100} height={100} className="w-full h-full [image-rendering:pixelated]" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm shadow-red-500/50"></div>
              {/* Compass labels */}
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/70 select-none">N</span>
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/70 select-none">S</span>
              <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/70 select-none">W</span>
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/70 select-none">E</span>
            </div>
          )}

          {/* Minimap Quick Reveal button if hidden */}
          {minimapVisibleStyle === 'hidden' && (
            <button
              onClick={() => {
                setMinimapVisibleStyle('compact');
                triggerToast('🗺️ Hiện bản đồ (Dạng nhỏ)');
                synth.playCollect();
              }}
              className="absolute top-16 left-2 sm:left-4 z-10 bg-slate-900/90 border border-slate-700/60 p-1.5 px-2.5 rounded-full text-[10px] font-extrabold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer pointer-events-auto active:scale-95 transition-all shadow-md"
            >
              🗺️ HIỆN BẢN ĐỒ
            </button>
          )}

          {/* TEAMMATE RADAR DIRECTIONAL TRACKING HUD SYSTEM */}
          {teammates.map((peer) => {
            const isSpeaking = speakingPeers.includes(peer.id);
            if (peer.onScreen) {
              return (
                <div
                  key={peer.id}
                  className="absolute pointer-events-none z-30 select-none -translate-x-1/2 -translate-y-[120%] flex flex-col items-center animate-fade-in"
                  style={{ left: `${peer.screenX}%`, top: `${peer.screenY}%` }}
                >
                  {/* Visual name card with distance */}
                  <div className={`bg-slate-950/90 border p-1 px-2.5 rounded-lg shadow-2xl flex items-center gap-1.5 backdrop-blur-sm transition-colors ${isSpeaking ? 'border-amber-400' : 'border-emerald-500/70'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSpeaking ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`text-[10px] font-extrabold font-sans tracking-wide leading-none ${isSpeaking ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {peer.name} : {peer.dist}m
                      {isSpeaking && <span className="ml-1 animate-pulse">🔊</span>}
                    </span>
                  </div>
                  {/* Arrow Indicator pointing down to teammate's avatar */}
                  <span className={`text-sm font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter select-none animate-bounce ${isSpeaking ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ▼
                  </span>
                </div>
              );
            } else {
              // Rectangular clamp to the screen edges so indicators sit perfectly at the margins
              const dx = Math.sin(peer.angle);
              const dy = -Math.cos(peer.angle);
              const rx = 44; // Max horizontal screen reach from center (offsets to 6% and 94%)
              const ry = 42; // Max vertical screen reach from center (offsets to 8% and 92%)
              
              const kX = Math.abs(dx) > 0.0001 ? rx / Math.abs(dx) : Infinity;
              const kY = Math.abs(dy) > 0.0001 ? ry / Math.abs(dy) : Infinity;
              const scaleK = Math.min(kX, kY);
              
              const cx = 50 + dx * scaleK;
              const cy = 50 + dy * scaleK;
              const rotDeg = Math.round(peer.angle * (180 / Math.PI));
              
              return (
                <div
                  key={peer.id}
                  className={`absolute pointer-events-none z-30 select-none -translate-x-1/2 -translate-y-1/2 bg-slate-950/90 border p-1.5 px-3 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 ${isSpeaking ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.25)]'}`}
                  style={{ left: `${cx}%`, top: `${cy}%` }}
                >
                  <span
                    className={`text-xs font-black block select-none transform transition-transform ${isSpeaking ? 'text-amber-400' : 'text-emerald-400'}`}
                    style={{ transform: `rotate(${rotDeg}deg)` }}
                  >
                    ▲
                  </span>
                  <span className={`text-[10px] font-extrabold tracking-wider font-sans leading-none ${isSpeaking ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {peer.name.substring(0, 10)}: {peer.dist}m
                    {isSpeaking && <span className="ml-1">🔊</span>}
                  </span>
                </div>
              );
            }
          })}

          {/* Display screen Crosshair targeting point */}
          <div className="ch"></div>

          {/* Key Collectible Pick Progress Bar */}
          <div id="pickProgressOuter" className="absolute top-[55%] left-1/2 -translate-x-1/2 w-48 h-3 bg-slate-950/80 border border-slate-700 rounded-full overflow-hidden hidden pointer-events-none z-40">
            <div id="pickProgressBar" className="h-full bg-amber-400 w-0 transition-all duration-[50ms] ease-out shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div>
          </div>

          {/* Keyboard inputs desk guide */}
          <div className="help select-none leading-relaxed font-semibold">
            WASD·di chuyển SPAC·nhảy F·bay
            <br />
            E·túi đồ G·cửa hàng P·lưu game
            <br />
            Cuộn chuột / Số 1-9·chọn ô khối
            <br />
            Chuột trái·phá khối / phải·đặt khối
          </div>

          {/* Mobs kill-feed logs container */}
          <div id="klog"></div>

          {/* Status attribute bars (HP, Hunger, XP) */}
          {equippedWpn && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[140px] flex items-center justify-center p-1 px-3 bg-slate-900/80 border border-amber-500/50 rounded drop-shadow-md overflow-visible pointer-events-none">
              <span className="text-xl leading-none">{equippedWpn.e}</span>
              <span className="ml-2 font-bold text-[10px] text-amber-400 font-mono">{equippedWpn.n} (Dmg: {equippedWpn.dmg})</span>
            </div>
          )}
          <div className="bars select-none text-[8px] font-mono">
            {/* Health Bar (Heart) */}
            <div className="bar hp">
              <div style={{ width: `${(hp / mhp) * 100}%` }} />
              <span>♥ {Math.ceil(hp)}</span>
            </div>
            {/* Hunger Thighs Bar */}
            <div className="bar hg">
              <div style={{ width: `${(hunger / 20) * 100}%` }} />
              <span>🍗 {Math.ceil(hunger)}</span>
            </div>
            {/* XP Level Bar */}
            <div className="bar xp">
              <div style={{ width: `${xpPercent}%` }} />
              <span>⭐ Lv.{playerLevel}</span>
            </div>
            {/* Oxygen Diving Bar */}
            {oxygen < 100 && (
              <div className="bar oxy select-none" style={{ background: 'rgba(14, 165, 233, 0.25)', borderColor: '#0ea5e9' }}>
                <div style={{ width: `${oxygen}%`, background: '#0ea5e9', height: '100%' }} />
                <span>🤿 Oxy: {Math.ceil(oxygen)}%</span>
              </div>
            )}
            {/* Active Armor Badges */}
            {equippedArmorList && equippedArmorList.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 max-w-[140px]" style={{ pointerEvents: 'none' }}>
                {equippedArmorList.map(aid => {
                  const it = ITM[aid];
                  if (!it) return null;
                  return (
                    <span key={aid} className="px-1 py-0.5 bg-slate-950/90 border border-green-500 text-green-400 font-bold rounded text-[7px] uppercase tracking-wide">
                      {it.e} {it.n}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic hotbar elements */}
          <div className="hotbar select-none">
            {hotbar.map((slot, i) => {
              const blDef = BLK[slot.id];
              const isActive = selIndex === i;
              const colorHex = '#' + (blDef?.c?.toString(16).padStart(6, '0') || '000000');
              return (
                <div
                  key={i}
                  className={`slot relative ${isActive ? 'active shadow-lg' : ''}`}
                  onClick={() => setSelIndex(i)}
                >
                  <div className="bi select-none" style={{ background: colorHex }}>
                    {blDef?.e || ''}
                  </div>
                  <div className="cn">{slot.n}</div>
                  <div className="lb">{blDef?.n || ''}</div>
                </div>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════
               MOBILE GRAPHICS TACTILE PANELS WITH POINTER BINDINGS
               ══════════════════════════════════════════════ */}
          {/* Visual joystick boundary tracking zone */}
          <div id="joyWrap" className="mob">
            <div id="joyRing"></div>
            <div id="joyKnob"></div>
          </div>

          {/* High sensitivity responsive quick tactile action cluster buttons */}
          <div id="actBtns" className="mob select-none">
            <div
              className="ab pri"
              id="btnJump"
              onPointerDown={(e) => { e.preventDefault(); bindTactileAction('jump', true, 'btnJump'); }}
              onPointerUp={(e) => { e.preventDefault(); bindTactileAction('jump', false, 'btnJump'); }}
              onPointerCancel={() => bindTactileAction('jump', false, 'btnJump')}
            >
              JUMP
            </div>
            <div
              className="ab"
              id="btnFly"
              onPointerDown={(e) => {
                e.preventDefault();
                const p = playerRef.current;
                if (p) {
                  p.fly = !p.fly;
                  triggerToast('Fly: ' + (p.fly ? 'BẬT 🦅' : 'TẮT'));
                }
              }}
            >
              FLY
            </div>
            <div
              className="ab dng"
              id="btnBreak"
              onPointerDown={(e) => { e.preventDefault(); bindTactileAction('break', true, 'btnBreak'); }}
              onPointerUp={(e) => { e.preventDefault(); bindTactileAction('break', false, 'btnBreak'); }}
              onPointerCancel={() => bindTactileAction('break', false, 'btnBreak')}
            >
              ⛏️ Phá
            </div>
            <div
              className="ab"
              id="btnPlace"
              onPointerDown={(e) => { e.preventDefault(); bindTactileAction('place', true, 'btnPlace'); }}
              onPointerUp={(e) => { e.preventDefault(); bindTactileAction('place', false, 'btnPlace'); }}
              onPointerCancel={() => bindTactileAction('place', false, 'btnPlace')}
            >
              🧱 Đặt
            </div>
          </div>




        </div>
      )}

      {/* ─── 4. BAG INVENTORY TAB MODAL OVERLAY ─── */}
      {inventoryActive && (
        <div id="inventory" className="on">
          <div className="ip border-dashed backdrop-blur-md max-w-2xl">
            {/* Filtering Tabs */}
            <div className="tabs flex-wrap gap-1">
              <button
                className={`tab ${activeTab === 'blocks' ? 'on' : ''}`}
                onClick={() => setActiveTab('blocks')}
              >
                🧱 Khối Voxel
              </button>
              <button
                className={`tab ${activeTab === 'items' ? 'on' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                ⚔️ Trang Bị
              </button>
              <button
                className={`tab ${activeTab === 'food' ? 'on' : ''}`}
                onClick={() => setActiveTab('food')}
              >
                🍖 Thực Phẩm
              </button>
              <button
                className={`tab ${activeTab === 'clothing' ? 'on' : ''}`}
                onClick={() => setActiveTab('clothing')}
              >
                👕 Thay Quần Áo
              </button>
              <button
                className={`tab ${activeTab === 'crafting' ? 'on' : ''}`}
                onClick={() => setActiveTab('crafting')}
                style={{
                  background: activeTab === 'crafting' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : undefined,
                  borderColor: activeTab === 'crafting' ? '#0f766e' : undefined
                }}
              >
                ⚒️ Chế Tạo
              </button>
            </div>

            {/* Bag section label and lists */}
            <h3 className="mb-2 uppercase tracking-wide text-xs text-slate-400">📦 Kho Đồ &amp; Hành Trang ({activeTab.toUpperCase()})</h3>

            {activeTab === 'blocks' ? (
              <div className="ig">
                {BL.map((blockId) => {
                  const bDef = BLK[blockId];
                  if (!bDef) return null;
                  const colorHex = '#' + (bDef.c.toString(16).padStart(6, '0'));
                  return (
                    <div
                      key={blockId}
                      className="slot hover:border-emerald-400 select-none cursor-pointer"
                      onClick={() => {
                        // Equip selected voxel block onto active hotbar indexslot
                        setHotbar(prev => {
                          const next = [...prev];
                          next[selIndex] = { id: blockId, n: 64 };
                          return next;
                        });
                        setInventoryActive(false);
                        triggerToast(`Đã trang bị ${bDef.e} ${bDef.n}`);
                      }}
                    >
                      <div className="bi select-none" style={{ background: colorHex }}>
                        {bDef.e || ''}
                      </div>
                      <div className="cn">∞</div>
                      <div className="lb">{bDef.n}</div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'items' || activeTab === 'food' ? (
              <div className="ig">
                {Object.entries(bagItems).filter(([id, count]) => {
                  const it = ITM[id];
                  const cCount = Number(count) || 0;
                  if (!it || cCount <= 0) return false;
                  if (activeTab === 'items' && it.t !== 'food' && it.t !== 'potion') return true;
                  if (activeTab === 'food' && (it.t === 'food' || it.t === 'potion')) return true;
                  return false;
                }).map(([id, count]) => {
                  const it = ITM[id];
                  return (
                    <div
                      key={id}
                      className="slot hover:border-emerald-400 select-none cursor-pointer"
                      onClick={() => consumeItem(id)}
                    >
                      <div className="bi select-none text-2xl flex items-center justify-center">
                        {it.e}
                      </div>
                      <div className="cn">{count}</div>
                      <div className="lb">{it.n}</div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'clothing' ? (
              <div className="p-3 bg-slate-900/60 rounded-xl space-y-3 max-h-[50vh] overflow-y-auto border border-slate-700/40">
                <p className="text-slate-300 text-xs text-center">
                  👗 Tự chọn màu da và thay xiêm y lộng lẫy để hiển thị trước toàn bộ đồng đội trong sảnh chơi!
                </p>

                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Màu Sắc Da:</span>
                    <div className="flex gap-2 justify-center">
                      {[
                        { c: '#dbcca0', name: 'Sáng' },
                        { c: '#bf9e75', name: 'Rám nắng' },
                        { c: '#10b981', name: 'Alien' },
                        { c: '#ec4899', name: 'Gợi cảm' },
                        { c: '#8b5cf6', name: 'Pháp sư' }
                      ].map((item) => (
                        <button
                          key={item.c}
                          type="button"
                          className={`w-7 h-7 rounded-sm border-2 cursor-pointer transition-all ${opts.skinColor === item.c ? 'border-emerald-400 scale-110 shadow' : 'border-slate-800'}`}
                          style={{ backgroundColor: item.c }}
                          onClick={() => {
                            setOpts(prev => {
                              const next = { ...prev, skinColor: item.c };
                              if (socketService.socket?.connected && playerRef.current) {
                                socketService.emit('player:move', {
                                  x: playerRef.current.pos.x,
                                  y: playerRef.current.pos.y,
                                  z: playerRef.current.pos.z,
                                  rotY: playerRef.current.yaw,
                                  skinColor: item.c,
                                  shirtColor: prev.shirtColor,
                                  pantsColor: prev.pantsColor
                                });
                              }
                              return next;
                            });
                            triggerToast('✨ Đã thay nước Da mới!');
                            synth.playPlace();
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Thiết Kế Áo Thun (Shirt):</span>
                    <div className="flex gap-2 justify-center">
                      {[
                        { c: '#3b82f6', name: 'Xanh dương' },
                        { c: '#ef4444', name: 'Đỏ ruby' },
                        { c: '#10b981', name: 'Xanh saphire' },
                        { c: '#f59e0b', name: 'Vàng cam' },
                        { c: '#1e293b', name: 'Xám khói' }
                      ].map((item) => (
                        <button
                          key={item.c}
                          type="button"
                          className={`w-7 h-7 rounded-sm border-2 cursor-pointer transition-all ${opts.shirtColor === item.c ? 'border-emerald-400 scale-110 shadow' : 'border-slate-800'}`}
                          style={{ backgroundColor: item.c }}
                          onClick={() => {
                            setOpts(prev => {
                              const next = { ...prev, shirtColor: item.c };
                              if (socketService.socket?.connected && playerRef.current) {
                                socketService.emit('player:move', {
                                  x: playerRef.current.pos.x,
                                  y: playerRef.current.pos.y,
                                  z: playerRef.current.pos.z,
                                  rotY: playerRef.current.yaw,
                                  skinColor: prev.skinColor,
                                  shirtColor: item.c,
                                  pantsColor: prev.pantsColor
                                });
                              }
                              return next;
                            });
                            triggerToast('👕 Đã đổi màu Áo thun!');
                            synth.playPlace();
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">Màu Sắc Quần (Pants):</span>
                    <div className="flex gap-2 justify-center">
                      {[
                        { c: '#1d4ed8', name: 'Xanh jean' },
                        { c: '#111827', name: 'Đen lụa' },
                        { c: '#7c2d12', name: 'Nâu nhung' },
                        { c: '#0f766e', name: 'Xanh rêu' },
                        { c: '#ec4899', name: 'Hồng sen' }
                      ].map((item) => (
                        <button
                          key={item.c}
                          type="button"
                          className={`w-7 h-7 rounded-sm border-2 cursor-pointer transition-all ${opts.pantsColor === item.c ? 'border-emerald-400 scale-110 shadow' : 'border-slate-800'}`}
                          style={{ backgroundColor: item.c }}
                          onClick={() => {
                            setOpts(prev => {
                              const next = { ...prev, pantsColor: item.c };
                              if (socketService.socket?.connected && playerRef.current) {
                                socketService.emit('player:move', {
                                  x: playerRef.current.pos.x,
                                  y: playerRef.current.pos.y,
                                  z: playerRef.current.pos.z,
                                  rotY: playerRef.current.yaw,
                                  skinColor: prev.skinColor,
                                  shirtColor: prev.shirtColor,
                                  pantsColor: item.c
                                });
                              }
                              return next;
                            });
                            triggerToast('👖 Đã nhuộm màu Quần!');
                            synth.playPlace();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Character preview */}
                <div className="flex flex-col items-center justify-center p-2 bg-slate-950/70 rounded-lg border border-slate-800 w-[140px] mx-auto">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Hình ảnh hiển thị</span>
                  <div className="flex flex-col items-center justify-center space-y-0.5" style={{ height: '70px', width: '50px' }}>
                    <div className="w-5 h-5 rounded-sm border border-slate-800/10" style={{ backgroundColor: opts.skinColor }} />
                    <div className="w-7 h-7 rounded-sm flex justify-between px-0.5 relative" style={{ backgroundColor: opts.shirtColor }}>
                      <div className="w-1.5 h-full rounded-sm absolute -left-2 top-0" style={{ backgroundColor: opts.skinColor }} />
                      <div className="w-1.5 h-full rounded-sm absolute -right-2 top-0" style={{ backgroundColor: opts.skinColor }} />
                    </div>
                    <div className="flex gap-1 w-7 h-5 justify-between">
                      <div className="w-3 h-full rounded-sm" style={{ backgroundColor: opts.pantsColor }} />
                      <div className="w-3 h-full rounded-sm" style={{ backgroundColor: opts.pantsColor }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-bold mt-1 max-w-full truncate">{opts.name}</span>
                </div>
              </div>
            ) : activeTab === 'crafting' ? (
              <div className="p-3 bg-slate-900/40 rounded-xl space-y-3 max-h-[50vh] overflow-y-auto border border-b-slate-700/20">
                <p className="text-teal-300 text-xs text-center font-bold">
                  ⚒️ BẢNG CHẾ TẠO THỦ CÔNG (RECIPES CRAFTING)
                </p>
                <p className="text-slate-400 text-[11px] text-center mb-2">
                  Khai thác các khối đất, cát, đá, gỗ tròn, vàng và kim cương để làm nguyên liệu chế tạo vũ khí cực mạnh!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {CRAFTING_RECIPES.map((recipe, index) => {
                    const canCraft = recipe.ingredients.every((ing) => (bagItems[ing.id] || 0) >= ing.req);
                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg border transition-all ${canCraft ? 'bg-teal-950/20 border-teal-500/50 hover:border-teal-400' : 'bg-slate-950/40 border-slate-800 opacity-75'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <span className="text-2xl">{recipe.resultEmoji}</span>
                            <div>
                              <b className="text-xs text-white block">{recipe.resultName}</b>
                              <span className="text-[10px] text-teal-400 bg-teal-950/50 px-1 rounded block w-max mt-0.5">Số lượng: x{recipe.count}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded text-xs font-bold leading-none select-none cursor-pointer transition-all active:scale-95 ${canCraft ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            onClick={() => { if (canCraft) craftItem(recipe); }}
                          >
                            ⚒️ Chế Tạo
                          </button>
                        </div>

                        {/* Ingredients list */}
                        <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex flex-wrap gap-x-2.5 gap-y-0.5">
                          {recipe.ingredients.map((ing) => {
                            const owned = bagItems[ing.id] || 0;
                            const isEnough = owned >= ing.req;
                            let displayName = ing.name;

                            // Include visual block representation emoji
                            let displayEmoji = '🎒';
                            if (ing.type === 'block') {
                              const bNum = Number(ing.id);
                              displayEmoji = BLK[bNum]?.e || '🧱';
                            } else {
                              displayEmoji = ITM[ing.id]?.e || '🗡️';
                            }

                            return (
                              <span
                                key={ing.id}
                                className={`text-[10px] flex items-center gap-0.5 ${isEnough ? 'text-slate-300' : 'text-rose-400 font-bold'}`}
                              >
                                {displayEmoji} {displayName}:{' '}
                                <b className={isEnough ? 'text-teal-400' : 'text-rose-500'}>
                                  {owned}/{ing.req}
                                </b>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ig">
                {Object.entries(ITM)
                  .filter(([_, itemDef]) => {
                    if (activeTab === 'food') return itemDef.t === 'food' || itemDef.t === 'potion';
                    return itemDef.t === 'weapon' || itemDef.t === 'tool' || itemDef.t === 'armor' || itemDef.t === 'special';
                  })
                  .map(([itemId, itemDef]) => {
                    const count = bagItems[itemId] || 0;
                    return (
                      <div
                        key={itemId}
                        className="slot hover:border-blue-400 select-none cursor-pointer"
                        style={{ opacity: count > 0 ? 1 : 0.4 }}
                        onClick={() => {
                          if (count > 0) consumeItem(itemId);
                          else triggerToast('Bạn chưa sở hữu món này, hãy mua từ Cửa Hàng!');
                        }}
                      >
                        <div className="bi">{itemDef.e}</div>
                        <div className="cn">{count}</div>
                        <div className="lb">{itemDef.n}</div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="btn sec flex-1 m-0 pt-2 pb-2 leading-none"
                onClick={() => setInventoryActive(false)}
              >
                Đóng hành trang
              </button>
              <button
                className={`btn flex-1 m-0 pt-2 pb-2 leading-none ${activeTab === 'crafting' ? 'bg-teal-600 text-white' : ''}`}
                onClick={() => {
                  setActiveTab('crafting');
                  triggerToast('⚒️ Đã mở Bảng Chế Tạo!');
                }}
              >
                ⚒ Chế Tạo đồ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. EMERALD SHOP CHECKOUT TAB OVERLAY ─── */}
      {shopActive && (
        <div id="shop" className="on">
          <div className="shp backdrop-blur-md">
            <h3>🏪 Cửa Hàng Tiện Lợi Voxel</h3>
            <p className="text-slate-400 text-xs mb-3">
              Mở khóa vũ khí võ lâm và linh đan bằng 🪙 vàng thu được từ việc khai thác mỏ &amp; hạ gục mob.
            </p>

            <div className="tabs">
              <button
                className={`tab stab ${activeShopTab === 'weapons' ? 'on' : ''}`}
                onClick={() => setActiveShopTab('weapons')}
              >
                ⚔️ Vũ Khí chiến
              </button>
              <button
                className={`tab stab ${activeShopTab === 'tools' ? 'on' : ''}`}
                onClick={() => setActiveShopTab('tools')}
              >
                🔧 Công Cụ hữu dụng
              </button>
              <button
                className={`tab stab ${activeShopTab === 'food' ? 'on' : ''}`}
                onClick={() => setActiveShopTab('food')}
              >
                🍖 Thuốc &amp; Đồ Ăn
              </button>
              <button
                className={`tab stab ${activeShopTab === 'special' ? 'on' : ''}`}
                onClick={() => setActiveShopTab('special')}
              >
                ✨ Trang bị Cánh
              </button>
            </div>

            <div className="sgg">
              {(SHOP[activeShopTab] || []).map((shopItem) => {
                const itProfile = ITM[shopItem.id];
                if (!itProfile) return null;
                const isOwned = (bagItems[shopItem.id] || 0) > 0;
                const currentGold = playerRef.current?.gold || 0;
                const canAfford = currentGold >= shopItem.p;

                return (
                  <div
                    key={shopItem.id}
                    className={`si relative border flex flex-col items-center justify-center p-3 select-none cursor-pointer rounded-xl bg-slate-900 border-slate-700 transition ${
                      isOwned ? 'owned opacity-60' : !canAfford ? 'noaf opacity-45' : 'hover:border-amber-400'
                    }`}
                    onClick={() => {
                      if (!isOwned && canAfford) purchaseShopItem(shopItem.id, shopItem.p);
                      else if (isOwned) triggerToast('Bạn đã sở hữu vật phẩm này rồi!');
                      else triggerToast('Kiếm thêm vàng từ khai mỏ vàng / diệt quái nhé!');
                    }}
                  >
                    <span className="se text-3xl mb-1">{itProfile.e}</span>
                    <div className="sn font-bold text-xs text-slate-200">{itProfile.n}</div>
                    <div className="spr text-amber-400 text-sm font-semibold mt-1">
                      {shopItem.p} 🪙
                    </div>
                    <div className="sd text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">
                      {itProfile.t}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn sec w-full m-0 mt-4 py-2 text-sm"
              onClick={() => setShopActive(false)}
            >
              Quay lại thế giới
            </button>
          </div>
        </div>
      )}

      {/* ─── 6. DEATH & RESPAWN BANNER SCREEN ─── */}
      <div id="dead" className={isDead ? 'on' : ''}>
        <h2>💀 Bạn Đã Tử Trận!</h2>
        <p className="text-red-300 antialiased font-medium tracking-tight">
          Nguyên nhân hi sinh: {deadMsg}
        </p>
        <button
          className="font-bold text-sm tracking-wide shadow-lg border border-yellow-500/20 active:scale-95"
          onClick={reloadRespawn}
        >
          🔄 Hồi Sinh Ngay
        </button>
      </div>

      {/* ─── 6b. VICTORY CELEBRATION SCREEN ─── */}
      {isVictory && (
        <div id="victory-screen" className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="max-w-md w-full bg-slate-900/95 border-2 border-yellow-500 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 animate-pulse" />
            
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 uppercase tracking-widest leading-none drop-shadow mb-3 pb-1">
              Chiến Thắng!
            </h2>
            
            <p className="text-slate-200 font-medium text-sm leading-relaxed mb-6">
              {victoryMsg}
            </p>
            
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 mb-6 text-left space-y-1.5 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Chế độ chơi:</span>
                <span className="text-yellow-400 font-bold uppercase">Truy Tìm Kho Báu</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Bản đồ thử thách:</span>
                <span className="text-emerald-400 font-bold">
                  {opts.biome.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Vàng tích lũy:</span>
                <span className="text-amber-400 font-bold">🪙 {goldCount} vàng</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlaying(false);
                setIsVictory(false);
                setVictoryMsg('');
                document.exitPointerLock?.();
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:from-yellow-400 hover:to-amber-400 active:scale-95 font-black text-sm tracking-widest uppercase py-3.5 px-6 rounded-2xl shadow-lg transition-transform duration-100 cursor-pointer text-center select-none"
            >
              🎉 TRỞ VỀ MENU CHÍNH 🎉
            </button>
          </div>
        </div>
      )}

      {/* ─── TREASURE HUNT MODE FULL-SCREEN DETAILED GUIDE ─── */}
      {showTreasureGuide && (
        <div id="treasure-guide" className="absolute inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in text-slate-200">
          <div className="max-w-xl w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <div className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer text-xl font-bold font-mono" onClick={() => setShowTreasureGuide(false)}>✕</div>
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
              <span className="text-4xl">👑</span>
              <div>
                <h3 className="text-xl font-black text-amber-400 uppercase tracking-wider leading-none">Cẩm Nang Truy Tìm Kho Báu</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Chiến dịch sinh tồn đoạt rương Thủy Tổ · Vô Hạn Zombie</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm leading-relaxed antialiased">
              <p>
                Chào mừng Chiến Binh dũng cảm! Bạn đang dấn thân vào chế độ <span className="text-amber-300 font-bold">Truy Tìm Kho Báu</span> kỳ vĩ. Bản đồ cực kỳ rộng lớn, đầy ắp hiểm nguy rình rập và tầng tầng lớp lớp thử thách nguy nan:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1 text-xs uppercase tracking-wide">🔑 {((window as any).gameKeysLoc?.length) || 3} Chìa Khóa Vàng (HIỂM ĐỊA)</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong className="text-amber-300">NẰM XA KHẮP PHƯƠNG TRỜI:</strong> Các chìa khóa lưu lạc ở vùng cấm địa xa xôi.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1 text-xs uppercase tracking-wide">🎁 Rương Thủy Tổ (TẦNG CAO CUNG ĐIỆN)</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong className="text-emerald-300">NẰM TRONG ĐẾ ĐÔ KHỔNG LỒ:</strong> Tọa độ <span className="text-red-400 font-bold font-mono">X: {((window as any).gamePalaceLoc?.x) || 300}, Z: {((window as any).gamePalaceLoc?.z) || 300}</span>. Cung điện có bọn Dơi Quỷ biết bay tuần tra rát mặt! Nơi này bảo vệ tuyệt mật.
                    <br /><span className="text-amber-300 font-bold">Cảnh giác:</span> Mật thất cung điện canh giữ bởi <span className="text-red-400 font-bold">Vệ Binh Hoàng Gia</span>. Thu thập đủ {((window as any).gameKeysLoc?.length) || 3} chìa khóa để giải phong ấn!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <h4 className="font-black text-sky-400 text-xs mb-1.5 uppercase tracking-wide flex items-center gap-1">🛠️ Đồ Chuyên Dụng Bắt Buộc (Mở Shop - G):</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400">🧑‍🚒</span>
                    <span><strong className="text-amber-300">Giáp Chống Lửa (160🪙):</strong> Kháng sát thương thiêu đốt khi bơi/lặn hoặc đứng trên dung nham tại bản đồ <strong className="text-red-400">Vực Thẳm Dung Nham 🔥</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-sky-400">🤿</span>
                    <span><strong className="text-sky-400">Mũ Lặn Ô-xy (120🪙):</strong> Ngăn chặn trạng thái cạn kiệt dưỡng khí tước đoạt sinh mệnh khi bơi sâu dưới lòng bản đồ <strong className="text-sky-400">Đại Dương Sâu Lạnh 🌊</strong>.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-[11px] text-amber-300 leading-normal">
                ⚠️ <strong className="font-bold">ZOMBIE ĐỘT KÍCH VÔ HẠN:</strong> Đêm xuống, lũ thây ma hung hãn sẽ trồi lên dập dồn tấn công bủa vây áp sát lưng bạn. Hãy săn quái hoặc đào quặng bán lấy vàng, vào <strong className="text-white">Cửa hàng (Phím G)</strong> nâng cấp vũ khí trang bị thích ứng sinh tồn!
              </div>
            </div>

            <button
              onClick={() => {
                synth.playPlace();
                setShowTreasureGuide(false);
              }}
              className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 active:scale-95 font-black text-sm tracking-widest uppercase py-3.5 px-6 rounded-2xl shadow-xl transition-all cursor-pointer text-center select-none"
            >
              🚀 BẮT ĐẦU CHẠY CHIẾN DỊCH 🚀
            </button>
          </div>
        </div>
      )}

      {/* ─── DRONE SUPPORT HUD ─── */}
      {isPlaying && (
          <div 
             id="drone-support-hud"
             className="absolute left-3 top-32 lg:top-40 z-[50] flex flex-col items-center gap-1 active:scale-95 transition-transform select-none group"
             onContextMenu={(e) => e.preventDefault()}
             onPointerDown={() => {
                 if (droneActive) return;
                 const longPress = setTimeout(() => {
                     // trigger drone support
                     const activate = () => {
                         setDroneActive(true);
                         triggerToast('🛸 Đã có yêu cầu trợ giúp Drone! Drone vận chuyển đang vào vị trí...');
                         synth.playCollect();
                         
                         if (sceneRef.current && playerRef.current) {
                             const pInst = playerRef.current;
                             const droneMat = new THREE.SpriteMaterial({ 
                                map: new THREE.TextureLoader().load('/robot-drone-voxel.webp'), 
                                transparent: true 
                             });
                             const drone = new THREE.Sprite(droneMat);
                             drone.scale.set(4, 4, 4);
                             drone.position.copy(pInst.pos).add(new THREE.Vector3(0, 40, 0));
                             sceneRef.current.add(drone);
                             
                             const animInt = setInterval(() => {
                                 if (!playerRef.current || !sceneRef.current) {
                                     clearInterval(animInt);
                                     return;
                                 }
                                 const tgt = playerRef.current.pos.clone().add(new THREE.Vector3(0, 2.5, 0));
                                 drone.position.lerp(tgt, 0.08); // fly in
                             
                                 if (drone.position.distanceTo(tgt) < 1.5) {
                                     clearInterval(animInt);
                                     
                                     // reached, drop item
                                     setTimeout(() => {
                                         triggerToast('🛸 Drone cứu trợ đã thả thành công Thùng Sinh Tồn Khẩn Cấp!');
                                         synth.playPlace();
                                         setBagItems(prev => {
                                            const b = {...prev};
                                            b['apple'] = (b['apple'] || 0) + 10;
                                            b['bread'] = (b['bread'] || 0) + 5;
                                            b['diamond_sword'] = 1;
                                            return b;
                                         });
                                         if (playerRef.current) {
                                             playerRef.current.hp = playerRef.current.mhp; // Full heal
                                             playerRef.current.hunger = 100;
                                             playerRef.current.invincibleShieldT = 10; // add some shield for safe respawn
                                             setInvincibleSeconds(10);
                                             setHp(playerRef.current.hp);
                                             setHunger(playerRef.current.hunger);
                                         }
                                         
                                         // fly away
                                         const flyAway = setInterval(() => {
                                              drone.position.y += 0.8;
                                              if (drone.position.y > 60) {
                                                  clearInterval(flyAway);
                                                  sceneRef.current?.remove(drone);
                                                  setDroneActive(false);
                                              }
                                         }, 50);
                                     }, 1500); // hover for 1.5s
                                 }
                             }, 50);
                         }
                     };
                     
                     if (droneFreeCount > 0) {
                         setDroneFreeCount(v => v - 1);
                         activate();
                     } else if (playerRef.current && playerRef.current.gold >= 500) {
                         playerRef.current.gold -= 500;
                         setGoldCount(playerRef.current.gold);
                         activate();
                     } else {
                         triggerToast('❌ KHÔNG THỂ GỌI DRONE: Cần 500 Vàng do đã hết lượt miễn phí!');
                         synth.playPlace();
                     }
                 }, 800); // 800ms hold
                 
                 const cancelPress = () => clearTimeout(longPress);
                 document.addEventListener('pointerup', cancelPress, { once: true });
                 document.addEventListener('pointerleave', cancelPress, { once: true });
             }}
          >
             <div className="absolute -top-7 text-[9px] text-white font-bold bg-blue-600/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">GỌI DRONE CỨU TRỢ</div>
             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800/80 border-2 border-blue-500 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer relative" style={{ backdropFilter: 'blur(4px)' }}>
                 <div className="absolute inset-0 bg-blue-500/20 active:bg-blue-500/50 transition-colors pointer-events-none" />
                 <img src={opts.companionPet === 'poodle' ? '/dog-poodle.webp.png' : '/dog-labrador.webp.png'} className="w-10 h-10 sm:w-12 sm:h-12 object-cover relative z-10 drop-shadow-md pointer-events-none" alt="Pet Rescue" />
             </div>
             <div className="text-[9px] sm:text-[10px] font-mono font-bold bg-black/80 px-1.5 py-0.5 rounded text-blue-300 mt-1 whitespace-nowrap border border-blue-500/30">Nhấn giữ (800ms)</div>
             <div className="text-[8px] text-slate-400 mt-0.5">Miễn: <strong className="text-white">{droneFreeCount}</strong> | <strong className="text-amber-400">500🪙</strong></div>
          </div>
      )}

      {/* ─── SOS SHIELD VISUAL OVERLAY HALO ─── */}
      {isPlaying && invincibleSeconds > 0 && (
        <div className="absolute inset-0 z-40 border-[10px] sm:border-[16px] border-amber-500/25 pointer-events-none animate-pulse flex items-start justify-center pt-24 select-none">
          <div className="bg-amber-950/95 border-2 border-amber-500/60 text-amber-200 px-4 py-2 rounded-2xl font-black text-xs tracking-wider shadow-2xl flex items-center gap-2">
            <span className="animate-spin text-sm">🛡️</span>
            <span>HÀO QUANG SOS BẢO VỆ ĐANG KÍCH HOẠT: {invincibleSeconds} giây</span>
          </div>
        </div>
      )}

      {/* ─── SOS EMERGENCY RECOVERY MODAL SELECTION SCREEN ─── */}
      {isPlaying && showSOSModal && (() => {
        const handleSOSTrigger = (actionCallback: () => void) => {
          const pInst = playerRef.current;
          if (!pInst) return;
          if (sosFreeCount > 0) {
            setSosFreeCount(prev => prev - 1);
            actionCallback();
          } else if (pInst.gold >= 500) {
            pInst.gold -= 500;
            setGoldCount(pInst.gold);
            actionCallback();
          } else {
            triggerToast('❌ KHÔNG THỂ GỌI SOS: Bạn đã hết lượt miễn phí và cần 500 Vàng để mua thêm!');
            synth.playPlace();
          }
        };

        return (
        <div id="sos-modal" className="absolute inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none font-sans animate-fade-in text-slate-200">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient design gradients */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer text-xl font-bold font-mono" onClick={() => {
              synth.playPlace();
              setShowSOSModal(false);
            }}>✕</div>
            
            <div className="flex items-center gap-3 border-b border-red-900/50 pb-4 mb-5">
              <span className="text-3xl animate-bounce">🚨</span>
              <div>
                <h3 className="text-base md:text-lg font-black text-red-500 uppercase tracking-widest leading-none">HỆ THỐNG CỨU TRỢ SOS</h3>
                <p className="text-[10px] items-center gap-2 flex text-slate-400 font-medium mt-1 leading-none">
                   Miễn phí: <strong className="text-white bg-red-500/30 px-1 py-0.5 rounded">{sosFreeCount} lần</strong> | Mua thêm: <strong className="text-amber-400">500🪙</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Hệ thống SOS hỏa tốc đã được kết nối! Nếu bạn đang gặp tình thế nguy hại cạn kiệt, hãy kích hoạt các đặc quyền dưới đây để cứu mạng:
            </p>

            <div className="space-y-3.5">
              {/* Option 1: Instashield + supplies */}
              <button
                onClick={() => {
                  handleSOSTrigger(() => {
                    const pInst = playerRef.current;
                    if (pInst) {
                      pInst.hp = pInst.mhp; // Full HP
                      pInst.hunger = 100; // Full hunger
                      pInst.invincibleShieldT = 15; // 15 seconds shield
                      setHp(pInst.hp);
                      setHunger(pInst.hunger);
                      setInvincibleSeconds(15);
                      
                      // Give bread and blocks
                      setBagItems(prev => {
                        const updated = { ...prev };
                        updated['bread'] = (updated['bread'] || 0) + 12; // 12 emergency bread
                        updated['5'] = (updated['5'] || 0) + 40; // 40 Bricks blocks to build safety pillars
                        return updated;
                      });
                      
                      triggerToast('🛡️ SOS: Đã kích hoạt 15 giây Hào Quang Vô Song & tiếp tế lương thực!');
                      synth.playCollect();
                      setShowSOSModal(false);
                    }
                  });
                }}
                className="w-full p-3.5 bg-gradient-to-r from-amber-950/80 to-amber-900/40 hover:from-amber-900 hover:to-amber-800 border-2 border-amber-500 text-left rounded-2xl transition-all cursor-pointer group active:scale-95 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🛡️</span>
                  <span className="font-extrabold text-xs text-amber-300 uppercase tracking-wide group-hover:text-amber-200">Hào Quang Khiên & Tiếp Tế Hoả Tốc</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-7">
                  Hồi ngay <strong className="text-white">100% Máu & Thức Ăn</strong>, tiếp viện <strong className="text-white">12 Bánh mì</strong>, <strong className="text-white">40 Khối gạch</strong> & kích hoạt <strong className="text-amber-400">Khiên Bất Tử trong 15s</strong> miễn nhiễm thây ma.
                </p>
              </button>

              {/* Option 2: Teleport Home */}
              <button
                onClick={() => {
                  handleSOSTrigger(() => {
                    const pInst = playerRef.current;
                    if (pInst && chunkMgrRef.current) {
                      const wgenInstance = chunkMgrRef.current.wg;
                      const homeH = wgenInstance.h(8, 8);
                      
                      pInst.pos.set(8, homeH + 3.5, 8);
                      pInst.vel.set(0, 0, 0);
                      pInst.invincibleShieldT = 8; // grant 8 seconds safety shield
                      setInvincibleSeconds(8);
                      
                      triggerToast('🚀 SOS: Đã dịch chuyển khẩn cấp về đồi xuất phát an toàn [+8s Khiên]!');
                      synth.playPlace();
                      setShowSOSModal(false);
                    }
                  });
                }}
                className="w-full p-3.5 bg-gradient-to-r from-rose-950/80 to-rose-900/40 hover:from-rose-900 hover:to-rose-800 border-2 border-rose-500 text-left rounded-2xl transition-all cursor-pointer group active:scale-95 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🚀</span>
                  <span className="font-extrabold text-xs text-rose-300 uppercase tracking-wide group-hover:text-rose-200">Khẩn Cấp Di Trú Về Đồi Xuất Phát</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-7">
                  Ngắt trạng thái nguy hiểm & <strong className="text-white">Biến về đồi xuất phát</strong> an toàn tọa độ [8, 8], kèm <strong className="text-rose-400">8 giây Khiên bảo vệ</strong> để định hình lại lối chơi.
                </p>
              </button>

              {/* Option 3: Super Gold Funding */}
              <button
                onClick={() => {
                  handleSOSTrigger(() => {
                    const pInst = playerRef.current;
                    if (pInst) {
                      pInst.gold += 350; // Give 350 coins
                      setGoldCount(pInst.gold);
                      
                      setBagItems(prev => {
                        const updated = { ...prev };
                        if (!updated['knife']) updated['knife'] = 1; // steel dagger rescue
                        return updated;
                      });
                      
                      triggerToast('🪙 SOS: Thêm ngân lượng khẩn cấp (+350 vàng) & Dao Thép chuyên dụng!');
                      synth.playCollect();
                      setShowSOSModal(false);
                    }
                  });
                }}
                className="w-full p-3.5 bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 hover:from-emerald-900 hover:to-emerald-800 border-2 border-emerald-500 text-left rounded-2xl transition-all cursor-pointer group active:scale-95 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🪙</span>
                  <span className="font-extrabold text-xs text-emerald-300 uppercase tracking-wide group-hover:text-emerald-200">Tiếp Tế Ngân Lượng & Siêu Dao Thân Thủ</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-7">
                  Cung cấp ngay <strong className="text-emerald-400">+350 Vàng</strong> để bạn nâng cấp trang bị chống chịu & cấp <strong className="text-white">Dao Thép (Sát thương 6)</strong> để nghênh chiến sinh tồn!
                </p>
              </button>

              {/* Option 4: Teammate SOS Rescue */}
              <button
                onClick={() => {
                  handleSOSTrigger(() => {
                    const pInst = playerRef.current;
                    if (pInst) {
                      if (socketService.socket?.connected) {
                        // Emit SOS signal to the multiplayer room using correct chat broadcast event 'chat:send'
                        const sosMessage = `🚨 SOS CẤP CỨU: Đồng đội ${opts.name} đang cần chi viện gấp tại tọa độ [X: ${Math.floor(pInst.pos.x)}, Y: ${Math.floor(pInst.pos.y)}, Z: ${Math.floor(pInst.pos.z)}]!`;
                        socketService.emit('chat:send', sosMessage);
                        triggerToast('📡 SOS: Đã phát tín hiệu cầu cứu chí tử tới radar đồng đội!');
                        // Grant some invincible seconds just in case
                        pInst.invincibleShieldT = 15;
                        setInvincibleSeconds(15);
                      } else {
                        triggerToast('❌ KHÔNG THỂ PHÁT SOS: Bạn không ở trong phòng chơi mạng hoặc chưa có kết nối Radar!');
                      }
                      synth.playCollect();
                      setShowSOSModal(false);
                    }
                  });
                }}
                className="w-full p-3.5 bg-gradient-to-r from-blue-950/80 to-indigo-900/40 hover:from-blue-900 hover:to-indigo-800 border-2 border-blue-500 text-left rounded-2xl transition-all cursor-pointer group active:scale-95 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1 text-[8px] bg-blue-500 text-white font-bold rounded-bl-lg font-mono">SOCIAL</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📡</span>
                  <span className="font-extrabold text-xs text-blue-300 uppercase tracking-wide group-hover:text-blue-200">Phát Tín Hiệu SOS Đồng Đội</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal pl-7">
                  Phát thông báo định vị khẩn cấp tới toàn phòng qua <strong className="text-blue-400">Hệ Thống Mạng Radar</strong> kêu gọi chi viện gấp, kèm <strong className="text-white">10 giây Khiên sinh tồn</strong>.
                </p>
              </button>
            </div>

            <div className="text-center mt-5">
              <button
                onClick={() => {
                  synth.playPlace();
                  setShowSOSModal(false);
                }}
                className="px-5 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Hủy Yêu Cầu Cứu Trợ
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {showSettings && (
        <div id="settings-modal" className="absolute inset-0 z-[15] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-center text-white mb-6 uppercase tracking-wider text-emerald-400">⚙️ Cài Đặt (Pause)</h3>
            
            <div className="space-y-4">
              <button
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold border border-slate-600 transition-colors"
                onClick={() => {
                  saveGameData();
                  setShowSettings(false);
                  triggerToast('💾 Đã lưu dữ liệu thế giới!');
                }}
              >
                💾 Lưu Thế Giới Hiện Tại
              </button>

              <button
                className="w-full py-3 bg-rose-900/40 hover:bg-rose-900/60 text-white rounded font-bold border border-rose-800/50 transition-colors"
                onClick={() => {
                  window.location.reload();
                }}
              >
                🚪 Thoát về Sảnh Chính
              </button>
            </div>

            <button
              className="mt-6 w-full py-2 bg-transparent text-slate-400 hover:text-white font-bold text-sm border-t border-slate-800 pt-4"
              onClick={() => setShowSettings(false)}
            >
              C.Tục Chơi
            </button>
          </div>
        </div>
      )}

      {/* ─── 7. ANIMATED SHORT FLOATING TOASTS ─── */}
      <div id="toast" className={`toast ${toastVisible ? 'show' : ''}`}>
        {toastText}
      </div>
    </div>
  );
}
