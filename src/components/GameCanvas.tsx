import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BLOCK_IDS, BLOCK_CONFIGS } from '../types';
import { ChunkManager } from '../systems/chunkManager';
import { PhysicsEngine } from '../systems/physics';
import { MobManager } from '../systems/mobManager';
import { useInventoryStore } from '../systems/inventoryStore';
import { audioSystem } from '../systems/audioSystem';
import { socketService } from '../systems/socketService';
import { Shield, Sparkles, MessageSquare } from 'lucide-react';

interface GameCanvasProps {
  onFpsUpdate: (fps: number) => void;
  onCoordinatesUpdate: (coords: string) => void;
  mobileControls: boolean;
  onMobileToggle?: () => void;
}

export default function GameCanvas({ onFpsUpdate, onCoordinatesUpdate, mobileControls, onMobileToggle }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game systems
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const chunkManagerRef = useRef<ChunkManager | null>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const mobManagerRef = useRef<MobManager | null>(null);

  // Player state coordinates tracked via useRef to avoid fast state triggers re-renders
  const playerPos = useRef(new THREE.Vector3(8, 32, 8));
  const playerVel = useRef(new THREE.Vector3(0, 0, 0));
  const playerRot = useRef({ yaw: 0, pitch: 0 });
  const keyboardState = useRef<Record<string, boolean>>({});
  const onGroundState = useRef({ onGround: false });
  const lastTime = useRef<number>(performance.now());
  const isFlying = useRef<boolean>(false);

  // Multiplayer players
  const remotePlayers = useRef<Map<string, { mesh: THREE.Group; nameplate: any }>>(new Map());

  // Input locking
  const isLocked = useRef<boolean>(false);
  const [lockedUi, setLockedUi] = useState(false);

  // Highlight block
  const highlightMesh = useRef<THREE.Mesh | null>(null);
  const targetBlock = useRef<{ x: number; y: number; z: number; faceIdx: number } | null>(null);

  // Local state sync
  const hotbarIndex = useInventoryStore((state) => state.hotbarIndex);
  const inventory = useInventoryStore((state) => state.inventory);
  const creativeMode = useInventoryStore((state) => state.creativeMode);
  const triggerQuestProgress = useInventoryStore((state) => state.triggerQuestProgress);
  const addItem = useInventoryStore((state) => state.addItem);
  const updateStats = useInventoryStore((state) => state.changeHunger);

  // Virtual Joystick touches
  const joystickTouch = useRef<{ id: number; startX: number; startY: number; curX: number; curY: number } | null>(null);
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize ThreeJS
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8abbec'); // Beautiful morning sky blue
    scene.fog = new THREE.FogExp2('#8abbec', 0.0125);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 0); // eye level
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Prevent white pixels issues
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear out residual canvases
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Light setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffcd1, 0.75);
    dirLight.position.set(20, 64, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. Initiate Voxel Game Core
    const gameSeed = useInventoryStore.getState().seed;
    const chunkManager = new ChunkManager(scene, gameSeed);
    chunkManagerRef.current = chunkManager;

    const physics = new PhysicsEngine(chunkManager);
    physicsRef.current = physics;

    const mobManager = new MobManager(scene, physics);
    mobManagerRef.current = mobManager;

    // 4. Highlight cursor indicator
    const hlGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const hlMesh = new THREE.Mesh(hlGeo, hlMat);
    scene.add(hlMesh);
    highlightMesh.current = hlMesh;

    // Initial position safe spawn (Search for grass height)
    chunkManager.updateLoadCenter(playerPos.current.x, playerPos.current.z);
    let startY = 32;
    for (let th = 120; th > 0; th--) {
      if (chunkManager.getBlock(8, th, 8) !== BLOCK_IDS.AIR) {
        startY = th + 2;
        break;
      }
    }
    playerPos.current.set(8, startY, 8);

    // 5. Spawn starting mobs near user
    mobManager.spawnMob('cow', 12, 12);
    mobManager.spawnMob('sheep', 16, 10);
    mobManager.spawnMob('chicken', 6, 14);
    mobManager.spawnMob('zombie', 17, 18);
    mobManager.spawnMob('spider', 4, 18);
    mobManager.spawnMob('skeleton', 10, 22);

    // 6. Connect multiplayer
    const pName = useInventoryStore.getState().playerName;
    const pRoom = useInventoryStore.getState().currentRoom;
    socketService.connect(pName, playerPos.current.x, playerPos.current.y, playerPos.current.z, playerRot.current.yaw, pRoom);

    // Setup network client triggers
    socketService.on('players:list', (list: any[]) => {
      // Spawn visual cube representations for current players
      list.forEach((p) => {
        spawnOtherPlayer(p);
      });
    });

    socketService.on('player:joined', (p) => {
      spawnOtherPlayer(p);
    });

    socketService.on('player:moved', (data) => {
      const other = remotePlayers.current.get(data.id);
      if (other) {
        other.mesh.position.set(data.x, data.y, data.z);
        other.mesh.rotation.y = data.rotY;
      }
    });

    socketService.on('player:left', (id) => {
      const other = remotePlayers.current.get(id);
      if (other) {
        scene.remove(other.mesh);
        remotePlayers.current.delete(id);
      }
    });

    socketService.on('block:changed', (data) => {
      chunkManager.setBlock(data.x, data.y, data.z, data.blockId);
      audioSystem.playBreakBlock();
    });

    function spawnOtherPlayer(p: any) {
      if (remotePlayers.current.has(p.id)) return;
      
      const otherGroup = new THREE.Group();
      otherGroup.position.set(p.x, p.y, p.z);

      const headMat = new THREE.MeshStandardMaterial({ color: 0xdbcca0 });
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x990022 }); // custom jacket
      
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), headMat);
      head.position.y = 1.45;

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), bodyMat);
      body.position.y = 0.8;

      otherGroup.add(head);
      otherGroup.add(body);
      scene.add(otherGroup);

      remotePlayers.current.set(p.id, { mesh: otherGroup, nameplate: null });
    }

    // 7. Mouse lock events listeners
    const handleMouseMovement = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const sensitivity = 0.0022;
      playerRot.current.yaw -= e.movementX * sensitivity;
      playerRot.current.pitch -= e.movementY * sensitivity;

      // Clamp vertical camera look degrees
      playerRot.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, playerRot.current.pitch));
    };

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      isLocked.current = locked;
      setLockedUi(locked);
    };

    document.addEventListener('mousemove', handleMouseMovement);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Click canvas requests Pointer Lock
    const lockCanvas = () => {
      if (!mobileControls) {
        renderer.domElement.requestPointerLock();
      }
    };
    renderer.domElement.addEventListener('click', lockCanvas);

    // Keyboard registers
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardState.current[e.key.toLowerCase()] = true;
      
      // Select Hotbars
      if (e.key >= '1' && e.key <= '9') {
        useInventoryStore.getState().setHotbarIndex(parseInt(e.key) - 1);
      }

      // Creative Mode Fly Toggle
      if (e.key.toLowerCase() === 'f' && creativeMode) {
        isFlying.current = !isFlying.current;
        playerVel.current.set(0, 0, 0);
        audioSystem.playPlaceBlock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardState.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 8. Dynamic visual raycasting loop
    const raycaster = new THREE.Raycaster();
    const centerPoint = new THREE.Vector2(0, 0);

    // Main render loop clock tick
    let animationId: number;
    let fpsCounter = 0;
    let fpsTimer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime.current) / 1000, 0.1); // Clamp to prevent visual glitches on focus change
      lastTime.current = now;

      // Update FPS stats metrics
      fpsCounter++;
      fpsTimer += dt;
      if (fpsTimer >= 1.0) {
        onFpsUpdate(fpsCounter);
        fpsCounter = 0;
        fpsTimer = 0;
      }

      // Game Tick Core mechanics
      updatePlayerMovement(dt);
      
      // Mob Manager cycle tick
      mobManager.updateMobs(playerPos.current, dt);

      // Perform Raycasting to pick targeted blocks
      raycastBlockIndicator();

      // Render Scene
      renderer.render(scene, camera);
    };

    const raycastBlockIndicator = () => {
      if (!cameraRef.current || !chunkManagerRef.current) return;
      
      // Point center of viewfinder
      raycaster.setFromCamera(centerPoint, cameraRef.current);
      const chunksGroupArray: THREE.Object3D[] = [];
      
      chunkManagerRef.current.chunks.forEach((chunk) => {
        if (chunk.mesh) {
          chunksGroupArray.push(chunk.mesh);
        }
      });

      const intersects = raycaster.intersectObjects(chunksGroupArray, true);
      
      if (intersects.length > 0 && intersects[0].distance < 6.0) {
        // Retrieve targeted coordinates derived from face normal normals
        const point = intersects[0].point;
        const norm = intersects[0].face?.normal;
        
        if (norm) {
          // Subtract small amount to read inside the targeted block
          const bx = Math.floor(point.x - norm.x * 0.1);
          const by = Math.floor(point.y - norm.y * 0.1);
          const bz = Math.floor(point.z - norm.z * 0.1);

          targetBlock.current = {
            x: bx,
            y: by,
            z: bz,
            faceIdx: getFaceIndexFromNormal(norm)
          };

          if (highlightMesh.current) {
            highlightMesh.current.position.set(bx + 0.5, by + 0.5, bz + 0.5);
            highlightMesh.current.visible = true;
          }
        }
      } else {
        targetBlock.current = null;
        if (highlightMesh.current) {
          highlightMesh.current.visible = false;
        }
      }
    };

    const getFaceIndexFromNormal = (n: THREE.Vector3) => {
      if (n.y > 0) return 0; // top
      if (n.y < 0) return 1; // bottom
      if (n.x > 0) return 2; // right
      if (n.x < 0) return 3; // left
      if (n.z > 0) return 4; // front
      return 5; // back
    };

    const updatePlayerMovement = (dt: number) => {
      if (!cameraRef.current || !physicsRef.current) return;

      const keys = keyboardState.current;
      
      // Compute move direction based on camera horizontal plane
      const camDir = new THREE.Vector3();
      cameraRef.current.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();

      const camRight = new THREE.Vector3();
      camRight.crossVectors(camDir, cameraRef.current.up).normalize();

      let moveX = 0;
      let moveZ = 0;

      // Sync physical keys or joystick inputs
      if (keys['w'] || keys['z'] || joystickVector.y < -0.15) {
        const factor = joystickVector.y < -0.15 ? Math.abs(joystickVector.y) : 1;
        moveX += camDir.x * factor;
        moveZ += camDir.z * factor;
      }
      if (keys['s'] || joystickVector.y > 0.15) {
        const factor = joystickVector.y > 0.15 ? joystickVector.y : 1;
        moveX -= camDir.x * factor;
        moveZ -= camDir.z * factor;
      }
      if (keys['a'] || keys['q'] || joystickVector.x < -0.15) {
        const factor = joystickVector.x < -0.15 ? Math.abs(joystickVector.x) : 1;
        moveX -= camRight.x * factor;
        moveZ -= camRight.z * factor;
      }
      if (keys['d'] || joystickVector.x > 0.15) {
        const factor = joystickVector.x > 0.15 ? joystickVector.x : 1;
        moveX += camRight.x * factor;
        moveZ += camRight.z * factor;
      }

      // Check sprint mechanics
      const speedMultiplier = (keys['shift'] || keys['control']) ? 1.7 : 1.0;
      const baseSpeed = isFlying.current ? 12.0 : 5.8;
      const finalSpeed = baseSpeed * speedMultiplier;

      const targetVelX = moveX * finalSpeed;
      const targetVelZ = moveZ * finalSpeed;

      // Smooth horizontal velocity transitions
      playerVel.current.x = THREE.MathUtils.lerp(playerVel.current.x, targetVelX, dt * 10);
      playerVel.current.z = THREE.MathUtils.lerp(playerVel.current.z, targetVelZ, dt * 10);

      // Play procedural footsteps
      const horizontalSpeedSq = playerVel.current.x * playerVel.current.x + playerVel.current.z * playerVel.current.z;
      if (horizontalSpeedSq > 2.0 && onGroundState.current.onGround && Math.random() < 0.08) {
        audioSystem.playFootstep();
        updateStats(-0.02); // Hunger usage on sprint
      }

      // Fly or Vertical jump handling
      if (isFlying.current) {
        if (keys[' '] || joystickVector.y < -0.55) {
          playerVel.current.y = 8.0;
        } else if (keys['shift']) {
          playerVel.current.y = -8.0;
        } else {
          playerVel.current.y = 0;
        }
      } else {
        if ((keys[' '] && onGroundState.current.onGround)) {
          playerVel.current.y = 9.8; // jump impulse velocity
          onGroundState.current.onGround = false;
          audioSystem.playFootstep();
          updateStats(-0.1);
        }
      }

      // Solve collision via custom physics engine
      const px = playerPos.current.x;
      const pz = playerPos.current.z;

      physicsRef.current.updateEntity(
        playerPos.current,
        playerVel.current,
        { width: 0.65, height: 1.8 },
        dt,
        isFlying.current,
        onGroundState.current
      );

      // Dynamic load chunks as player cross coordinate bounds
      const didChunksLoad = chunkManagerRef.current.updateLoadCenter(playerPos.current.x, playerPos.current.z);
      if (didChunksLoad) {
        console.log('Chunk updates compiled.');
      }

      // Emit coordinates position sync to online server
      if (socketService.socket?.connected && (Math.abs(playerPos.current.x - px) > 0.01 || Math.abs(playerPos.current.z - pz) > 0.01)) {
        socketService.emit('player:move', {
          x: playerPos.current.x,
          y: playerPos.current.y,
          z: playerPos.current.z,
          rotY: playerRot.current.yaw
        });
      }

      // Translate 3D Camera coordinates
      cameraRef.current.position.set(playerPos.current.x, playerPos.current.y + 1.55, playerPos.current.z);
      
      // Update Rotations
      cameraRef.current.rotation.order = 'YXZ';
      cameraRef.current.rotation.y = playerRot.current.yaw;
      cameraRef.current.rotation.x = playerRot.current.pitch;

      onCoordinatesUpdate(
        `X: ${playerPos.current.x.toFixed(1)} | Y: ${playerPos.current.y.toFixed(1)} | Z: ${playerPos.current.z.toFixed(1)}`
      );
    };

    // Initiate Loop
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMovement);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      chunkManager.destroy();
      mobManager.clearAllMobs();
      socketService.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [mobileControls]);

  // Click Actions - Placing and Breaking blocks or attacking Mobs!
  const handleVectoredClick = (action: 'break' | 'place') => {
    // If breaking, check for sword/fist hit raycast hitting a Mob first is a highly satisfying gameplay mechanic
    if (action === 'break' && cameraRef.current && mobManagerRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
      
      // Probe active mobs
      const checkMobsList = mobManagerRef.current.mobs;
      let closestMobId: string | null = null;
      let closestDist = 3.8; // melee reach

      checkMobsList.forEach((m) => {
        const mobVec = new THREE.Vector3(m.x, m.y + 0.5, m.z);
        const distToCamera = cameraRef.current!.position.distanceTo(mobVec);
        if (distToCamera < closestDist) {
          // simplistic boundary check path intercept
          const dirFromCam = mobVec.clone().sub(cameraRef.current!.position).normalize();
          const camLook = new THREE.Vector3();
          cameraRef.current!.getWorldDirection(camLook);
          const angle = camLook.dot(dirFromCam);

          if (angle > 0.92) { // facing target
            closestMobId = m.id;
            closestDist = distToCamera;
          }
        }
      });

      if (closestMobId) {
        // Melee hit!
        audioSystem.playHitSwish();
        const activeHotbarItem = inventory[hotbarIndex];
        const baseDmg = activeHotbarItem?.type === 'weapon' ? (activeHotbarItem.val || 5) : 3;
        
        mobManagerRef.current.hitMob(closestMobId, baseDmg);
        return; // Skip block break logic because mob is hit
      }
    }

    // Standard block placements / breaks
    if (!targetBlock.current || !chunkManagerRef.current) return;

    const { x, y, z, faceIdx } = targetBlock.current;

    if (action === 'break') {
      const targetingBlockId = chunkManagerRef.current.getBlock(x, y, z);
      if (targetingBlockId === BLOCK_IDS.AIR) return;

      const blockConfig = BLOCK_CONFIGS[targetingBlockId];
      
      // Perform break
      chunkManagerRef.current.setBlock(x, y, z, BLOCK_IDS.AIR);
      audioSystem.playBreakBlock();
      
      // Notify multiplayer room
      if (socketService.socket?.connected) {
        socketService.emit('block:change', { x, y, z, blockId: BLOCK_IDS.AIR });
      }

      // Add block item to player inventory
      if (blockConfig) {
        const itemName = blockConfig.name;
        const itemId = blockConfig.itemId;
        
        // Grant block item
        const added = addItem({
          id: itemId,
          name: itemName,
          maxStack: 64,
          count: 1,
          type: 'block',
          val: targetingBlockId
        });
        
        if (added) {
          triggerQuestProgress('break', itemId);
        }
      }
    } else {
      // PLACING BLOCKS
      const activeItem = inventory[hotbarIndex];
      if (!activeItem || activeItem.type !== 'block') return;

      // Compute place position beside targeted face
      let px = x;
      let py = y;
      let pz = z;

      if (faceIdx === 0) py += 1;
      if (faceIdx === 1) py -= 1;
      if (faceIdx === 2) px += 1;
      if (faceIdx === 3) px -= 1;
      if (faceIdx === 4) pz += 1;
      if (faceIdx === 5) pz -= 1;

      // Prevent placing inside head/feet
      const playerBlockX = Math.floor(playerPos.current.x);
      const playerBlockY = Math.floor(playerPos.current.y);
      const playerBlockZ = Math.floor(playerPos.current.z);

      if (px === playerBlockX && pz === playerBlockZ && (py === playerBlockY || py === playerBlockY + 1)) {
        return; // blocked
      }

      const placeBlockId = activeItem.val || BLOCK_IDS.STONE;
      
      chunkManagerRef.current.setBlock(px, py, pz, placeBlockId);
      audioSystem.playPlaceBlock();
      
      // Update quantity
      useInventoryStore.getState().removeItem(activeItem.id, 1);
      triggerQuestProgress('place', activeItem.id);

      // Notify multiplayer server
      if (socketService.socket?.connected) {
        socketService.emit('block:change', { x: px, y: py, z: pz, blockId: placeBlockId });
      }
    }
  };

  // Touch handlers for virtual joystick
  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    // Dynamic base position adjustment for premium play!
    // Set the joystick center dynamically to this touch position
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const relativeY = touch.clientY - rect.top;
    
    setJoystickCenter({ x: relativeX, y: relativeY });
    setJoystickActive(true);

    joystickTouch.current = {
      id: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
    };
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickTouch.current || !joystickCenter) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouch.current.id) {
        joystickTouch.current.curX = touch.clientX;
        joystickTouch.current.curY = touch.clientY;

        // Compute distance vector from start position (joystick base center)
        const dx = touch.clientX - joystickTouch.current.startX;
        const dy = touch.clientY - joystickTouch.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 45; // Enhanced virtual joystick radius!

        let vx = dx;
        let vy = dy;
        if (dist > maxRadius) {
          vx = (dx / dist) * maxRadius;
          vy = (dy / dist) * maxRadius;
        }

        setJoystickVector({ x: vx / maxRadius, y: vy / maxRadius });
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    if (!joystickTouch.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouch.current.id) {
        joystickTouch.current = null;
        setJoystickVector({ x: 0, y: 0 });
        setJoystickActive(false);
        setJoystickCenter(null);
      }
    }
  };

  // Handle Dynamic Swipe-gesture looking (optimized for simultaneous look during movement!)
  const swipeTouch = useRef<{ id: number; x: number; y: number } | null>(null);
  
  const handleSwipeStart = (e: React.TouchEvent) => {
    // Search the changed touches for a finger placed on the right portion of screen to look/aim around
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Skip left bottom quadrant (where joystick resides)
      const isRightSide = touch.clientX > window.innerWidth * 0.4;
      if (isRightSide && !swipeTouch.current) {
        swipeTouch.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!swipeTouch.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === swipeTouch.current.id) {
        const dx = touch.clientX - swipeTouch.current.x;
        const dy = touch.clientY - swipeTouch.current.y;
        swipeTouch.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };

        // 0.005 sensitivity is standard on mobile displays
        const sensitivity = 0.005;
        playerRot.current.yaw -= dx * sensitivity;
        playerRot.current.pitch -= dy * sensitivity;
        playerRot.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, playerRot.current.pitch));
        break;
      }
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (!swipeTouch.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === swipeTouch.current.id) {
        swipeTouch.current = null;
        break;
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full select-none"
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      {/* 3D WebGL element */}
      <div id="game-three-canvas" ref={containerRef} className="w-full h-full" />

      {/* Crosshair target indicator */}
      {!mobileControls && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-0.5 bg-white opacity-80 absolute" />
          <div className="h-4 w-0.5 bg-white opacity-80 absolute" />
        </div>
      )}

      {/* Pointer Lock guide overlay for desktops */}
      {!mobileControls && !lockedUi && (
        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
          <div className="bg-neutral-850/90 max-w-sm rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col items-center gap-4">
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
            <div>
              <span className="text-white font-black text-xl tracking-tight leading-snug block mb-1">Click to lock Mouse controls</span>
              <span className="text-neutral-400 text-xs leading-relaxed">
                Rê chuột để nhìn xung quanh, click Chuột Trái để phá block và click Chuột Phải để đặt block!
              </span>
            </div>
            
            <div className="flex flex-col gap-2 w-full mt-2">
              <button 
                id="btn-lock-pointer"
                onClick={() => containerRef.current?.querySelector('canvas')?.requestPointerLock()}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 font-sans font-black text-neutral-900 rounded-xl active:scale-95 transition-all outline-none cursor-pointer text-sm shadow-md"
              >
                🎮 CHƠI TRÊN MÁY TÍNH
              </button>
              
              {onMobileToggle && (
                <button 
                  onClick={onMobileToggle}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-sans font-black rounded-xl active:scale-95 transition-all outline-none cursor-pointer text-xs border border-emerald-600 shadow-md"
                >
                  📱 CHUYỂN CHẾ ĐỘ DI ĐỘNG (CẢM ỨNG)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Input Interfaces */}
      {mobileControls && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-sans select-none">
          {/* Top Swipe indicator label */}
          <div className="w-full flex justify-center pt-2">
            <span className="bg-neutral-900/60 backdrop-blur-md text-neutral-200 border border-white/10 px-4 py-1.5 text-[11px] rounded-full shadow-lg font-bold">
              👈 Vuốt góc phải màn hình để xoay camera | Chạm di chuyển bên trái
            </span>
          </div>

          <div className="w-full flex items-end justify-between select-none">
            {/* Left Joystick - dynamic repositioning within this zone for active gameplay comfort */}
            <div 
              className="w-48 h-48 rounded-3xl bg-neutral-900/10 border-2 border-dashed border-white/5 backdrop-blur-xs flex items-center justify-center relative pointer-events-auto shadow-inner select-none"
              style={{ touchAction: 'none' }}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
            >
              {/* Subtle indicator of touch zone */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase font-mono tracking-wider text-white/20 pointer-events-none">Vùng Joystick ảo</span>

              {/* Responsive indicator base (shifts directly to thumb if touched, otherwise stays relative/centered) */}
              <div 
                className="absolute w-24 h-24 rounded-full bg-neutral-950/80 border-2 border-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl transition-all"
                style={
                  joystickCenter 
                    ? {
                        left: `${joystickCenter.x - 48}px`,
                        top: `${joystickCenter.y - 48}px`,
                        transform: 'none',
                      }
                    : {
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }
                }
              >
                {/* Joystick Stick Handle with smooth active transform */}
                <div 
                  className="w-12 h-12 rounded-full bg-emerald-400 border-2 border-emerald-500 shadow-md flex items-center justify-center transition-transform duration-75 select-none"
                  style={{
                    transform: `translate(${joystickVector.x * 24}px, ${joystickVector.y * 24}px)`
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white/70 shadow-inner" />
                  {joystickActive && <div className="w-3 h-3 rounded-full bg-white opacity-50 animate-ping absolute pointer-events-none" />}
                </div>
              </div>
            </div>

            {/* Right Action Trigger Buttons */}
            <div className="flex flex-col gap-4 items-end pointer-events-auto select-none">
              <div className="flex gap-4">
                <button 
                  id="btn-place-block"
                  onTouchStart={() => handleVectoredClick('place')}
                  className="w-16 h-16 rounded-2xl bg-green-500 active:bg-green-600 active:scale-90 flex flex-col items-center justify-center font-black text-white border-2 border-green-400/40 shadow-xl text-xs select-none cursor-pointer transition-transform duration-75"
                >
                  <span className="text-base">🟢</span>
                  <span className="tracking-tighter mt-1">ĐẶT</span>
                </button>
                <button 
                  id="btn-break-block"
                  onTouchStart={() => handleVectoredClick('break')}
                  className="w-16 h-16 rounded-2xl bg-red-500 active:bg-red-600 active:scale-90 flex flex-col items-center justify-center font-black text-white border-2 border-red-400/40 shadow-xl text-xs select-none cursor-pointer transition-transform duration-75"
                >
                  <span className="text-base">⛏️</span>
                  <span className="tracking-tighter mt-1">PHÁ</span>
                </button>
              </div>
              <button 
                id="btn-jump-trigger"
                onTouchStart={() => {
                  keyboardState.current[' '] = true;
                  setTimeout(() => { keyboardState.current[' '] = false; }, 100);
                }}
                className="w-24 h-15 rounded-2xl bg-blue-500 active:bg-blue-600 active:scale-90 flex flex-col items-center justify-center font-black text-white border-2 border-blue-400/40 shadow-xl text-xs mr-4 cursor-pointer transition-transform duration-75 select-none"
              >
                <span className="text-base">🚀</span>
                <span className="tracking-tighter mt-0.5">NHẢY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
