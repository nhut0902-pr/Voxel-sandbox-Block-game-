import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import VoxelGame from './components/VoxelGame';

export default function App() {
  const [view, setView] = useState<'landing' | 'game'>('landing');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060a13] font-sans select-none">
      {view === 'landing' ? (
        <LandingPage onEnterGame={() => setView('game')} />
      ) : (
        <VoxelGame onBackToLanding={() => setView('landing')} />
      )}
    </div>
  );
}
