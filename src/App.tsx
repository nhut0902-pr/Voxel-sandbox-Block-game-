import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import { useInventoryStore } from './systems/inventoryStore';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mobileControls, setMobileControls] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    }
    return false;
  });
  const [coords, setCoords] = useState('X: 0.0 | Y: 0.0 | Z: 0.0');
  const [fps, setFps] = useState(60);

  const handleStartGame = () => {
    setIsPlaying(true);
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    useInventoryStore.getState().setGameStarted(false, '', '', false);
  };

  const handleMobileToggle = () => {
    setMobileControls(prev => !prev);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {!isPlaying ? (
        <MainMenu onStart={handleStartGame} />
      ) : (
        <React.Fragment>
          {/* Main 3D Voxel canvas viewport */}
          <div className="w-full h-full relative">
            <GameCanvas
              onFpsUpdate={(v) => setFps(v)}
              onCoordinatesUpdate={(c) => setCoords(c)}
              mobileControls={mobileControls}
              onMobileToggle={handleMobileToggle}
            />

            {/* Overlying controls & HUD overlay */}
            <GameUI
              fps={fps}
              gpsCoords={coords}
              mobileControls={mobileControls}
              onExit={handleExitGame}
              onMobileToggle={handleMobileToggle}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
