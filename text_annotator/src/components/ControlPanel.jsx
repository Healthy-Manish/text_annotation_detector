import React from 'react';
import { Play, StopCircle, Save, Trash2, History, Loader2 } from 'lucide-react';

const ControlPanel = ({
  isCameraActive,
  isProcessing,
  onStart,
  onStop,
  onCapture,
  onClear,
  onHistory
}) => {
  const btnBase = "flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform active:scale-95 shadow-sm";
  
  return (
     <div className="h-12 mt-4 mb-2 flex items-center gap-3 px-3  bg-neutral-850 border-t border-neutral-700 select-none">

      <button
        onClick={onStart}
        disabled={isCameraActive}
        className={`${btnBase} ${
          isCameraActive 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md'
        }`}
      >
        <Play size={18} />
        <span>Start</span>
      </button>

      <button
        onClick={onStop}
        disabled={!isCameraActive}
        className={`${btnBase} ${
          !isCameraActive
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-800 text-white hover:bg-gray-900'
        }`}
      >
        <StopCircle size={18} />
        <span>Stop</span>
      </button>

      <button
        onClick={onCapture}
        disabled={!isCameraActive || isProcessing}
        className={`${btnBase} ${
          !isCameraActive || isProcessing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        <span>{isProcessing ? 'Processing...' : 'Capture'}</span>
      </button>

      <button
        onClick={onClear}
        className={`${btnBase} bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-red-50 hover:text-red-600 hover:border-red-200`}
      >
        <Trash2 size={18} />
        <span>Clear All</span>
      </button>

      <button
        onClick={onHistory}
        className={`${btnBase} bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200`}
      >
        <History size={18} />
        <span>History</span>
      </button>
    </div>
  );
};

export default ControlPanel;