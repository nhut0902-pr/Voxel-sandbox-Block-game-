import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import VoxelGame from './components/VoxelGame';
import { GameOptions } from './components/VoxelGame';

export default function App() {
  const [view, setView] = useState<'landing' | 'game'>('landing');
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    name: 'Steve',
    seed: 'voxelverse-2026',
    mode: 'treasure',
    difficulty: 'normal',
    biome: 'plains',
    botCount: '3',
    room: 'lobby',
    skinColor: '#dbcca0',
    shirtColor: '#3b82f6',
    pantsColor: '#1d4ed8',
    avatarSkin: 'robot_soldier',
    companionPet: 'labrador'
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060a13] font-sans select-none">
      {view === 'landing' ? (
        <LandingPage 
          onEnterGame={(options) => {
            setGameOptions(options);
            setView('game');
          }} 
        />
      ) : (
        <VoxelGame 
          options={gameOptions}
          onBackToLanding={() => setView('landing')} 
        />
      )}
    </div>
  );
}
