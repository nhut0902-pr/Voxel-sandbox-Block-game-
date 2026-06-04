import React, { useState } from 'react';
import { useInventoryStore } from '../systems/inventoryStore';
import { SaveSystem } from '../systems/saveSystem';
import { Sparkles, Play, Shield, Earth, Compass, Users } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  const [name, setName] = useState('Steve' + Math.floor(Math.random() * 899 + 100));
  const [seed, setSeed] = useState('minecraft');
  const [room, setRoom] = useState('lobby');
  const [creative, setCreative] = useState(false);
  const setGameStarted = useInventoryStore((state) => state.setGameStarted);
  const setRoomStore = useInventoryStore((state) => state.setRoom);

  const handleLaunch = (loadSaved = false) => {
    if (loadSaved) {
      const ok = SaveSystem.loadGame();
      if (ok) {
        onStart();
        return;
      } else {
        alert('ℹ️ No saved world data discovered. Launching a new world instead!');
      }
    }

    setGameStarted(true, name.trim(), seed.trim(), creative);
    setRoomStore(room.trim() || 'lobby');
    onStart();
  };

  return (
    <div className="absolute inset-0 bg-radial from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        
        {/* Subtle geometric gradient orb decor background absolute layer */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-yellow-400/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl" />

        {/* Logo display paired beautifully */}
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono mb-1.5 block">AI Studio 3D Edition</span>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-sans mb-1 select-none flex items-center justify-center gap-2">
            🕋 VOXEL sandbox
          </h1>
          <p className="text-neutral-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            Procedural voxel worlds with active mobs, inventory drag-drops, recipe tables, and real-time multiplayer lobbies.
          </p>
        </div>

        {/* Input variables segments card */}
        <div className="bg-neutral-850 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
          
          {/* 1. Name segment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-neutral-500" /> Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.substring(0, 16))}
              placeholder="Player username..."
              className="w-full bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-white font-sans text-sm focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Seed configuration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-neutral-500" /> World Seed
              </label>
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="minecraft, world, alpine..."
                className="w-full bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-white font-sans text-sm focus:outline-none transition-all"
              />
            </div>

            {/* 3. Room name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Earth className="w-3.5 h-3.5 text-neutral-500" /> Room Lobby ID
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="lobby, server-1..."
                className="w-full bg-neutral-900 border border-white/10 hover:border-white/20 focus:border-emerald-400 rounded-xl py-2.5 px-3.5 text-white font-sans text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2.5 mt-1 border-t border-white/5 pt-4">
            <button
              onClick={() => setCreative(false)}
              className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs font-sans cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                !creative 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                  : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              ❤️ SURVIVAL
            </button>
            <button
              onClick={() => setCreative(true)}
              className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs font-sans cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                creative 
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                  : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              ⚡ CREATIVE
            </button>
          </div>
        </div>

        {/* Trigger Play button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleLaunch(false)}
            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-neutral-950 font-sans font-black tracking-tight rounded-xl flex items-center justify-center gap-2 transform transition-all cursor-pointer select-none active:scale-95 shadow-lg shadow-yellow-500/10 border border-yellow-500/20"
          >
            <Play className="w-5 h-5 fill-neutral-950" /> GENERATE NEW WORLD
          </button>

          <button
            onClick={() => handleLaunch(true)}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-white/10 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-neutral-400" /> RESUME PREVIOUS WORLD
          </button>
        </div>

        {/* Footnote credit log */}
        <span className="text-center text-[10px] text-neutral-500 font-mono">
          Made with Three.js | Port 3000 Ingress Live.
        </span>

      </div>
    </div>
  );
}
