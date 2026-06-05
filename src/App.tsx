import React from 'react';
import VoxelGame from './components/VoxelGame';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b1220] font-sans select-none">
      <VoxelGame />
    </div>
  );
}
