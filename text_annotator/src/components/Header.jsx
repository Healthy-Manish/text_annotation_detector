import React from 'react';
import { Camera } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-14 w-full bg-neutral-800 border-b border-neutral-700 flex items-center px-4 select-none">
      
      {/* Left: App Identity */}
      <div className="flex items-center gap-3">
        <Camera size={20} className="text-indigo-400" />
        <span className="text-sm font-semibold text-gray-100 tracking-wide">
          Vision Annotation Pro
        </span>
      </div>

      {/* Center: Spacer (future tools) */}
      <div className="flex-1" />

      {/* Right: Status / Version */}
      <div className="text-xs text-gray-400">
        LIVE • v0.1
      </div>

    </header>
  );
};

export default Header;
