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

/* ─── Types & Interfaces ─── */
interface GameOptions {
  name: string;
  seed: string;
  mode: 'creative' | 'survival' | 'adventure';
  biome: string;
  botCount: string;
  room: string;
}

export default function VoxelGame() {
  /* ─── UI Router states ─── */
  const [isPlaying, setIsPlaying] = useState(false);
  const [opts, setOpts] = useState<GameOptions>({
    name: 'Steve',
    seed: 'voxelverse-2026',
    mode: 'creative',
    biome: 'plains',
    botCount: '3',
    room: 'lobby'
  });

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

  /* ─── HUD Sync React states ─── */
  const [fps, setFps] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [coordsText, setCoordsText] = useState('0, 0, 0');
  const [timeLabel, setTimeLabel] = useState('12:00');
  const [timePercent, setTimePercent] = useState(35);
  const [isNight, setIsNight] = useState(false);
  const [goldCount, setGoldCount] = useState(0);
  const [hp, setHp] = useState(20);
  const [mhp, setMhp] = useState(20);
  const [hunger, setHunger] = useState(20);
  const [xpPercent, setXpPercent] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [currentBadge, setCurrentBadge] = useState('🎨 CREATIVE');

  /* ─── Inventory / Shop states ─── */
  const [inventoryActive, setInventoryActive] = useState(false);
  const [shopActive, setShopActive] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deadMsg, setDeadMsg] = useState('');

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
  
  const [activeTab, setActiveTab] = useState<'blocks' | 'items' | 'food'>('blocks');
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
  
  // Notification Toast state
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  /* ─── Gameplay System Refs ─── */
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Instance engines
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const chunkMgrRef = useRef<CM | null>(null);
  const playerRef = useRef<Player | null>(null);
  const dnRef = useRef<DN | null>(null);
  const entsRef = useRef<Entity[]>([]);
  const hlRef = useRef<THREE.LineSegments | null>(null);
  
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

  /* ─── Auto-Saver ─── */
  const saveGameData = () => {
    if (!playerRef.current) return;
    try {
      localStorage.setItem('vv5_react', JSON.stringify({
        pos: [playerRef.current.pos.x, playerRef.current.pos.y, playerRef.current.pos.z],
        yaw: playerRef.current.yaw,
        gold: playerRef.current.gold,
        lv: playerRef.current.lv,
        seed: opts.seed,
        biome: opts.biome
      }));
    } catch (e) { }
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, Dev.tier() === 'low' ? 1 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    scene.fog = new THREE.Fog(0x87ceeb, 30, Dev.rd() * CW * 0.95);

    // 2. Instantiate procedural engine components
    const dn = new DN(scene);
    dnRef.current = dn;

    const wgen = new WGen(opts.seed, opts.biome);
    const cmgr = new CM(scene, wgen);
    chunkMgrRef.current = cmgr;

    // 3. Initiate Player & spawn safety height
    const player = new Player(cam);
    player.fly = opts.mode === 'creative';
    const initH = wgen.h(8, 8);
    player.pos.set(8, initH + 3, 8);
    playerRef.current = player;

    // Load saves if available, restricting position to matching seed/biome
    try {
      const saved = localStorage.getItem('vv5_react');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.seed === opts.seed && d.biome === opts.biome) {
          if (d.pos) player.pos.set(d.pos[0], d.pos[1], d.pos[2]);
          if (d.yaw != null) player.yaw = d.yaw;
        } else {
          // Reset starting position to safe biome height as seed or biome has changed
          const safeH = wgen.h(8, 8);
          player.pos.set(8, safeH + 3, 8);
        }
        if (d.gold != null) player.gold = d.gold;
        if (d.lv != null) {
          player.lv = d.lv;
          player.mhp = 20 + (d.lv - 1) * 2;
          player.hp = player.mhp;
        }
      }
    } catch (err) { }

    setGoldCount(player.gold);
    setHp(player.hp);
    setMhp(player.mhp);
    setHunger(player.hunger);
    setPlayerLevel(player.lv);

    // --- Connect to Socket.IO Multiplayer Servers ---
    socketService.connect(
      opts.name,
      player.pos.x,
      player.pos.y,
      player.pos.z,
      player.yaw,
      opts.room || 'lobby'
    );

    const remotePlayers = new Map<string, THREE.Group>();

    const createPlayerMesh = (name: string): THREE.Group => {
      const group = new THREE.Group();

      // Simple box head (steve / custom character)
      const headMat = new THREE.MeshStandardMaterial({ color: 0xdbcca0 });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
      head.position.y = 1.45;
      group.add(head);

      // Body mesh
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // blue shirt
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.35), bodyMat);
      body.position.y = 0.825;
      group.add(body);

      // Left leg
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }); // blue pants
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), legMat);
      leftLeg.position.set(-0.15, 0.225, 0);
      group.add(leftLeg);

      // Right leg
      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), legMat);
      rightLeg.position.set(0.15, 0.225, 0);
      group.add(rightLeg);

      // Left arm
      const armMat = new THREE.MeshStandardMaterial({ color: 0xdbcca0 });
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), armMat);
      leftArm.position.set(-0.35, 0.9, 0);
      group.add(leftArm);

      // Right arm
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), armMat);
      rightArm.position.set(0.35, 0.9, 0);
      group.add(rightArm);

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
          const m = createPlayerMesh(p.name);
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
        const m = createPlayerMesh(p.name);
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

    // 4. Cursor wireframe indicator
    const hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    hl.visible = false;
    scene.add(hl);
    hlRef.current = hl;

    // 5. Spawn bots & mobs
    const botNum = parseInt(opts.botCount || '3', 10);
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
      if (e.code === 'Escape') {
        setInventoryActive(false);
        setShopActive(false);
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
      if (e.button === 0) touchSysRef.current.breakOnce = true;
      if (e.button === 2) touchSysRef.current.placeOnce = true;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handleLockChange);
    canvasRef.current.addEventListener('click', handleCanvasClick);
    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('wheel', handleWheel, { passive: true });

    // 7. Bind window resize
    const handleResize = () => {
      if (!camRef.current || !rendererRef.current) return;
      camRef.current.aspect = window.innerWidth / window.innerHeight;
      camRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

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

          pInst.upd(dt, instInputs, cInst, opts.mode, (src) => {
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
                rotY: pInst.yaw
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
              const baseDmg = pInst.wpn?.dmg || 3;
              if (targetMob.hit(baseDmg)) {
                // Kill reward!
                targetMob.remove();
                pInst.kills++;
                pInst.gold += targetMob.cfg.gold;
                setGoldCount(pInst.gold);
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
              
              if (hoverBlock.block === 14) {
                pInst.gold += 3;
                setGoldCount(pInst.gold);
                triggerToast('⛏️ Vàng! +3🪙');
              } else if (hoverBlock.block === 15) {
                pInst.gold += 8;
                setGoldCount(pInst.gold);
                triggerToast('💎 Kim cương! +8🪙');
              } else {
                triggerToast('Phá: ' + (BLK[hoverBlock.block]?.n || 'khối'));
              }
            }
          }

          // Place blocks
          if (doPlace && hoverBlock && hoverBlock.face) {
            const currentSelectedSlot = hotbar[selIndex];
            if (currentSelectedSlot && currentSelectedSlot.id > 0) {
              const nx = hoverBlock.x + hoverBlock.face[0];
              const ny = hoverBlock.y + hoverBlock.face[1];
              const nz = hoverBlock.z + hoverBlock.face[2];
              
              const isCollidingWithPlayerFeet = ~~pInst.pos.x === nx && ~~pInst.pos.z === nz && (ny === ~~pInst.pos.y || ny === ~~(pInst.pos.y + 1));
              if (!isCollidingWithPlayerFeet) {
                synth.playPlace();
                cInst.wSet(nx, ny, nz, currentSelectedSlot.id);
                cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());
                triggerToast('Đặt khối ✅');

                // Sync block placement to other players
                socketService.emit('block:change', { x: nx, y: ny, z: nz, blockId: currentSelectedSlot.id });
              }
            }
          }
        }

        // Atmosphere update
        dInst.upd(dt);
        setTimeLabel(dInst.lbl());
        setTimePercent(dInst.t * 100);
        setIsNight(dInst.night());

        // Spawn extra bad mobs at night
        if (dInst.night() && opts.mode !== 'creative') {
          nightSpawnAccumulator.current += dt;
          if (nightSpawnAccumulator.current > 35) {
            nightSpawnAccumulator.current = 0;
            const nightHostiles = ['zombie', 'skeleton', 'creeper', 'wolf'];
            const chosenType = nightHostiles[~~(Math.random() * nightHostiles.length)];
            const a = Math.random() * Math.PI * 2;
            const r = 22 + Math.random() * 12;
            const x = pInst.pos.x + Math.cos(a) * r;
            const z = pInst.pos.z + Math.sin(a) * r;
            entsRef.current.push(new Entity(chosenType, x, wgen.h(~~x, ~~z) + 2, z, scene));
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
          });
        }

        // Keep local indices loaded
        cInst.upd(pInst.pos.x, pInst.pos.z, Dev.rd());

        // Sync visual stats tags
        setHp(pInst.hp);
        setHunger(pInst.hunger);
        setXpPercent((pInst.xp / (pInst.lv * 100)) * 100);

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
      window.removeEventListener('wheel', handleWheel);
      
      window.removeEventListener('touchstart', handleNativeTouchStart);
      window.removeEventListener('touchmove', handleNativeTouchMove);
      window.removeEventListener('touchend', handleNativeTouchEnd);
      window.removeEventListener('touchcancel', handleNativeTouchEnd);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      entsRef.current.forEach(e => e.remove());
      socketService.disconnect();
    };
  }, [isPlaying, opts]);

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
    } else if (type === 'break' && isStart) {
      tInst.breakOnce = true;
    } else if (type === 'place' && isStart) {
      tInst.placeOnce = true;
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
    } else if (it.t === 'potion') {
      if (it.hl) p.heal(it.hl);
      if (it.spd) {
        p.spdB = it.spd;
        triggerToast(`💊 Nhận hiệu ứng Tốc Độ +${it.spd}!`);
        setTimeout(() => { if (playerRef.current) playerRef.current.spdB = 0; }, 15000);
      }
    } else if (it.t === 'weapon') {
      p.wpn = it;
    } else if (it.t === 'armor') {
      if (it.def) p.def = it.def;
      if (it.spd) p.spdB = it.spd;
    } else if (it.t === 'special' && it.fly) {
      p.fly = true;
      triggerToast('👑 Đã trang bị Cánh Phượng hoàng: Bay BẬT!');
    }

    remBagItem(id, 1);
    triggerToast(`Đã dùng ${it.e} ${it.n}`);
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
      </div>

      {/* ─── 2. MAIN MENU OVERLAY ─── */}
      {!isPlaying && (
        <div id="menu">
          <div className="mc shadow-2xl relative border-dashed">
            <h1 className="logo font-black tracking-tight select-none">VOXELVERSE 2.0</h1>
            <p className="tag">Phiên bản Sandbox Cực Hạn  · 2026</p>

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
                <label>Biomes Thế Giới</label>
                <select
                  value={opts.biome}
                  onChange={(e) => setOpts({ ...opts, biome: e.target.value })}
                >
                  <option value="plains">🌾 Plains (Đồng cỏ)</option>
                  <option value="forest">🌲 Forest (Trùng lâu)</option>
                  <option value="desert">🏜️ Desert (Sa mạc)</option>
                  <option value="snow">❄️ Snow (Băng thổ)</option>
                  <option value="cherry">🌸 Cherry (Anh đào)</option>
                  <option value="volcano">🌋 Volcano (Núi lửa)</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="f">
                <label>Seed Kỹ Thuật Số</label>
                <input
                  type="text"
                  value={opts.seed}
                  onChange={(e) => setOpts({ ...opts, seed: e.target.value })}
                />
              </div>
              <div className="f">
                <label>Số Lượng Bots Quái</label>
                <select
                  value={opts.botCount}
                  onChange={(e) => setOpts({ ...opts, botCount: e.target.value })}
                >
                  <option value="0">Không có</option>
                  <option value="3">3 Bots quái</option>
                  <option value="6">6 Bots cực căng</option>
                  <option value="10">10 Thảm họa</option>
                </select>
              </div>
              <div className="f" style={{ minWidth: '180px' }}>
                <label>🌐 Phòng Chơi (Room ID)</label>
                <div className="flex gap-1 w-full">
                  <input
                    type="text"
                    value={opts.room}
                    placeholder="lobby"
                    className="flex-1 min-w-[70px]"
                    onChange={(e) => setOpts({ ...opts, room: e.target.value })}
                  />
                  <button
                    type="button"
                    className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                    title="Phòng ngẫu nhiên"
                    onClick={() => {
                      const randRoom = 'room-' + ~~(Math.random() * 9000 + 1000);
                      setOpts((prev) => ({ ...prev, room: randRoom }));
                      synth.playPlace();
                      triggerToast('✨ Đã tạo mã phòng ngẫu nhiên!');
                    }}
                  >
                    🎲
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
                    🔗 Mời
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-1 font-bold">Chế Độ Chơi Game</label>
              <div className="mg">
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'creative' ? 's' : ''}`}
                  onClick={() => {
                    setOpts({ ...opts, mode: 'creative' });
                    setCurrentBadge('🎨 CREATIVE');
                  }}
                >
                  <span className="i">🎨</span>
                  <div className="n">Creative</div>
                  <div className="d">Bay lượn tự do</div>
                </button>
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'survival' ? 's' : ''}`}
                  onClick={() => {
                    setOpts({ ...opts, mode: 'survival' });
                    setCurrentBadge('⚔️ SURVIVAL');
                  }}
                >
                  <span className="i">⚔️</span>
                  <div className="n">Survival</div>
                  <div className="d">Máu &amp; Quái vật</div>
                </button>
                <button
                  type="button"
                  className={`mc2 ${opts.mode === 'adventure' ? 's' : ''}`}
                  onClick={() => {
                    setOpts({ ...opts, mode: 'adventure' });
                    setCurrentBadge('🗺️ ADVENTURE');
                  }}
                >
                  <span className="i">🗺️</span>
                  <div className="n">Adventure</div>
                  <div className="d">Khám phá dã ngoại</div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="btn sec font-bold active:scale-95 m-0"
                style={{ flex: 1, marginTop: 0 }}
                onClick={toggleFullscreen}
              >
                🖥️ TOÀN MÀN HÌNH
              </button>
              <button
                className="btn font-black text-slate-900 leading-none shadow-emerald-400/20 active:scale-95 m-0"
                style={{ flex: 2, marginTop: 0 }}
                onClick={() => {
                  synth.init();
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
          {/* Top diagnostic panel bar */}
          <div className="tbar">
            <div className="pill select-none">
              <span className="dot animate-pulse"></span>
              <span>FPS {fps}</span>·<span>{chunkCount}c Chunks</span>
            </div>
            <div className="pill select-none font-mono font-medium">
              📍 {coordsText}
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
            <button
              type="button"
              className="pill cursor-pointer select-none font-bold active:scale-95 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-400"
              onClick={() => {
                copyInviteLink();
                synth.playPlace();
              }}
            >
              🔗 MỜI BẠN
            </button>
            <button
              type="button"
              className="pill cursor-pointer select-none font-bold active:scale-95 bg-slate-900 border border-slate-700"
              onClick={toggleFullscreen}
            >
              🖥️ TOÀN MÀN HÌNH
            </button>
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
          <div id="timePill">
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

          {/* Game mode designation badge */}
          <span
            id="modeBadge"
            className={`${opts.mode} flex items-center justify-center`}
          >
            {currentBadge}
          </span>

          {/* Display screen Crosshair targeting point */}
          <div className="ch"></div>

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

          {/* Bottom paddle bars triggers for hand interaction */}
          <div id="bpRow" className="mob select-none">
            <div
              className="bpb brk"
              id="bpBreak"
              onPointerDown={(e) => { e.preventDefault(); bindTactileAction('break', true, 'bpBreak'); }}
              onPointerUp={(e) => { e.preventDefault(); bindTactileAction('break', false, 'bpBreak'); }}
              onPointerCancel={() => bindTactileAction('break', false, 'bpBreak')}
            >
              ✊ PHÁ KHỐI
            </div>
            <div
              className="bpb plc"
              id="bpPlace"
              onPointerDown={(e) => { e.preventDefault(); bindTactileAction('place', true, 'bpPlace'); }}
              onPointerUp={(e) => { e.preventDefault(); bindTactileAction('place', false, 'bpPlace'); }}
              onPointerCancel={() => bindTactileAction('place', false, 'bpPlace')}
            >
              🖐 ĐẶT KHỐI
            </div>
          </div>

          {/* Quick Backpack tab button trigger */}
          <div
            id="invBtn2"
            className="pill mob pointer-events-auto cursor-pointer z-20 font-bold"
            onClick={() => {
              setInventoryActive(prev => !prev);
              setShopActive(false);
            }}
          >
            🎒 Túi Đồ (E)
          </div>
        </div>
      )}

      {/* ─── 4. BAG INVENTORY TAB MODAL OVERLAY ─── */}
      {inventoryActive && (
        <div id="inventory" className="on">
          <div className="ip border-dashed backdrop-blur-md">
            {/* Filtering Tabs */}
            <div className="tabs">
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
            </div>

            {/* Bag section label and lists */}
            <h3 className="mb-2">📦 Kho Đồ &amp; Hành Trang</h3>

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
                className="btn flex-1 m-0 pt-2 pb-2 leading-none"
                onClick={() => triggerToast('⚒ Hệ thống Chế Tạo đang được nâng cấp...')}
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

      {/* ─── 7. ANIMATED SHORT FLOATING TOASTS ─── */}
      <div id="toast" className={`toast ${toastVisible ? 'show' : ''}`}>
        {toastText}
      </div>
    </div>
  );
}
