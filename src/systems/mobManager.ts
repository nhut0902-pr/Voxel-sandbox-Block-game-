import * as THREE from 'three';
import { MobState, MobType } from '../types';
import { PhysicsEngine } from './physics';
import { useInventoryStore } from './inventoryStore';

export class MobManager {
  public mobs: MobState[] = [];
  private scene: THREE.Scene;
  private physics: PhysicsEngine;
  private mobGroups: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene, physics: PhysicsEngine) {
    this.scene = scene;
    this.physics = physics;
  }

  public spawnMob(type: MobType, x: number, z: number, y = 30): void {
    const id = type + '_' + Math.random().toString(36).substring(2, 9);
    const maxH = this.getMobMaxHealth(type);
    
    const mob: MobState = {
      id,
      type,
      x,
      y,
      z,
      rotY: Math.random() * Math.PI * 2,
      health: maxH,
      maxHealth: maxH,
      action: 'wander',
      hurtCooldown: 0,
    };

    this.mobs.push(mob);
    this.createMobMesh(mob);
  }

  private getMobMaxHealth(type: MobType): number {
    switch (type) {
      case 'chicken': return 10;
      case 'sheep': return 20;
      case 'cow': return 30;
      case 'spider': return 25;
      case 'skeleton': return 40;
      case 'zombie': return 50;
    }
  }

  /**
   * Procedural cube-based lowpoly Minecraft mob models
   */
  private createMobMesh(mob: MobState): void {
    const group = new THREE.Group();
    group.position.set(mob.x, mob.y, mob.z);
    
    // Add custom visual identity based on mob taxonomy
    let bodyMat: THREE.Material;
    let detailMat: THREE.Material;

    switch (mob.type) {
      case 'cow': {
        // Brown & dark patch boxes
        bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1d });
        const patches = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.4), bodyMat);
        group.add(patches);
        
        // head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x3d2516 }));
        head.position.set(0, 0.3, 0.8);
        group.add(head);

        // horns
        const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        hornL.position.set(-0.25, 0.6, 0.8);
        const hornR = hornL.clone();
        hornR.position.x = 0.25;
        group.add(hornL, hornR);
        break;
      }
      case 'sheep': {
        // Fluffy white model
        bodyMat = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.95 });
        const wool = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.3), bodyMat);
        group.add(wool);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.45), new THREE.MeshStandardMaterial({ color: 0xdbcca0 }));
        head.position.set(0, 0.2, 0.7);
        group.add(head);
        break;
      }
      case 'chicken': {
        // White tiny feathers model
        bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const feathers = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), bodyMat);
        group.add(feathers);

        const crown = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        crown.position.set(0, 0.35, 0.25);
        
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
        beak.position.set(0, 0.15, 0.4);
        group.add(crown, beak);
        break;
      }
      case 'zombie': {
        // Green skin, blue shirt
        bodyMat = new THREE.MeshStandardMaterial({ color: 0x015a87 }); // shirt
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), bodyMat);
        group.add(torso);

        const greenMat = new THREE.MeshStandardMaterial({ color: 0x56a048 });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), greenMat);
        head.position.set(0, 0.62, 0);
        group.add(head);

        // arms reaching out
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.75), greenMat);
        armL.position.set(-0.35, 0.2, 0.3);
        const armR = armL.clone();
        armR.position.x = 0.35;
        group.add(armL, armR);
        break;
      }
      case 'skeleton': {
        // Bony white
        bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.2), bodyMat);
        group.add(torso);

        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), bodyMat);
        skull.position.set(0, 0.6, 0);
        group.add(skull);

        // Black eye cavities
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        eyeL.position.set(-0.1, 0.65, 0.18);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.1;
        group.add(eyeL, eyeR);
        break;
      }
      case 'spider': {
        // Black multi-eye box
        bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const main = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), bodyMat);
        group.add(main);

        // Red glowing eyes
        detailMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xbb0000 });
        const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), detailMat);
        eyes.position.set(0.2, 0.05, 0.46);
        const eyesL = eyes.clone();
        eyesL.position.x = -0.2;
        group.add(eyes, eyesL);
        break;
      }
    }

    this.scene.add(group);
    this.mobGroups.set(mob.id, group);
  }

  /**
   * Primary Mob Engine execution loop
   */
  public updateMobs(playerPos: THREE.Vector3, dt: number): void {
    const isHostile = (type: MobType) => ['zombie', 'skeleton', 'spider'].includes(type);

    for (const m of this.mobs) {
      if (m.action === 'dead') continue;

      if (m.hurtCooldown > 0) {
        m.hurtCooldown -= dt;
      }

      // Check distance to client player
      const dist = playerPos.distanceTo(new THREE.Vector3(m.x, m.y, m.z));

      // AI Decision Tree
      let velX = 0;
      let velZ = 0;

      if (isHostile(m.type) && dist < 14) {
        // Chase state
        m.action = 'chase';
        const dx = playerPos.x - m.x;
        const dz = playerPos.z - m.z;
        m.rotY = Math.atan2(dx, dz);

        const speed = m.type === 'spider' ? 4.2 : 3.0;
        velX = Math.sin(m.rotY) * speed;
        velZ = Math.cos(m.rotY) * speed;

        // Perform attack if very close
        if (dist <= 1.5 && m.hurtCooldown <= 0) {
          // Attack player
          m.action = 'attack';
          m.hurtCooldown = 1.0; // Attack speed tick
          useInventoryStore.getState().damagePlayer(m.type === 'spider' ? 12 : 8);
        }
      } else {
        // Wander state
        if (Math.random() < 0.02) {
          m.action = Math.random() < 0.5 ? 'wander' : 'chase'; // Wander or pause
          if (Math.random() < 0.3) {
            m.rotY = Math.random() * Math.PI * 2;
          }
        }

        if (m.action === 'wander') {
          const speed = 1.2;
          velX = Math.sin(m.rotY) * speed;
          velZ = Math.cos(m.rotY) * speed;
        }
      }

      // Check physics blocks collision for the mob
      const mobPos = new THREE.Vector3(m.x, m.y, m.z);
      const mobVel = new THREE.Vector3(velX, m.y < 2 ? 0 : 0, velZ); // basic fall logic
      const groundState = { onGround: false };
      
      const mobDims = m.type === 'chicken' ? { width: 0.5, height: 0.5 } : { width: 0.9, height: 1.0 };

      // Apply entity mechanics through physics engine
      this.physics.updateEntity(mobPos, mobVel, mobDims, dt, false, groundState);

      // Save output coordinates
      m.x = mobPos.x;
      m.y = mobPos.y;
      m.z = mobPos.z;

      // Update Three Object position/rotation
      const meshGroup = this.mobGroups.get(m.id);
      if (meshGroup) {
        meshGroup.position.set(m.x, m.y, m.z);
        meshGroup.rotation.y = m.rotY;

        // Flash red if hit recently
        if (m.hurtCooldown > 0 && m.health > 0) {
          meshGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const mat = child.material as THREE.MeshStandardMaterial;
              mat.emissive = new THREE.Color(0x3a0000); // glowing dark red tint
            }
          });
        } else {
          meshGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const mat = child.material as THREE.MeshStandardMaterial;
              mat.emissive = new THREE.Color(0x000000);
            }
          });
        }
      }
    }
  }

  /**
   * Damaging a mob (Melee / Range combat)
   */
  public hitMob(mobId: string, dmg: number): boolean {
    const mob = this.mobs.find((m) => m.id === mobId);
    if (!mob || mob.action === 'dead') return false;

    mob.health -= dmg;
    mob.hurtCooldown = 0.5; // flash red timer

    if (mob.health <= 0) {
      mob.action = 'dead';
      // Despawn visually
      const mesh = this.mobGroups.get(mobId);
      if (mesh) {
        this.scene.remove(mesh);
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) child.geometry.dispose();
        });
      }
      this.mobGroups.delete(mobId);
      this.mobs = this.mobs.filter((m) => m.id !== mobId);

      // Reward player
      const inventory = useInventoryStore.getState();
      inventory.gainXp(mob.type === 'cow' ? 15 : 25);
      inventory.earnGold(Math.floor(25 + Math.random() * 50));
      if (Math.random() < 0.25) {
        inventory.earnGems(1);
      }
      
      // Complete quest milestones
      inventory.triggerQuestProgress('kill', mob.type);

      return true; // Slayed!
    }

    return false;
  }

  public clearAllMobs(): void {
    for (const mesh of this.mobGroups.values()) {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
    }
    this.mobGroups.clear();
    this.mobs = [];
  }
}
