import React from 'react';
import {
  Video,
  VideoOff,
  Play,
  StopCircle,
  Loader2,
  Trash2
} from 'lucide-react';

const ControlPanel = ({
  isCameraActive,
  isRecording,
  onStartCamera,
  onStopCamera,
  onStartRecording,
  onStopRecording,
  clearSession
}) => {
  const btn =
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition";

  return (
    <div className="h-14 flex items-center gap-3 px-4 bg-neutral-850 border-t border-neutral-700">

      {/* CAMERA CONTROL */}
      {!isCameraActive ? (
        <button
          onClick={onStartCamera}
          className={`${btn} bg-violet-600 hover:bg-violet-700 text-white`}
        >
          <Video size={16} />
          Start Camera
        </button>
      ) : (
        <button
          onClick={onStopCamera}
          className={`${btn} bg-gray-700 hover:bg-gray-800 text-white`}
        >
          <VideoOff size={16} />
          Stop Camera
        </button>
      )}

      {/* RECORDING CONTROL */}
      {!isRecording ? (
        <button
          onClick={onStartRecording}
          disabled={!isCameraActive}
          className={`${btn} ${
            !isCameraActive
              ? 'bg-gray-600 text-white cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Play size={16} />
          Start Recording
        </button>
      ) : (
        <button
          onClick={onStopRecording}
          className={`${btn} bg-red-600 hover:bg-red-700 text-white`}
        >
          <Loader2 size={16} className="animate-spin" />
          Stop & Save
        </button>
        
      )}
       <button
          onClick={clearSession}
          className={`${btn} hover:bg-red-700 text-white`}
        >
          <Trash2 size={16} className="trash2" />
          Clear Session
        </button>
    </div>
  );
};

export default ControlPanel;
