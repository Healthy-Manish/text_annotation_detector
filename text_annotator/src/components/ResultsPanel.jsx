import React from 'react';
import {
  Activity,
  Layers,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const ResultsPanel = ({ results, stats, status }) => {
  return (
    <div className="flex flex-col h-full bg-neutral-850">

      {/* Stats Bar */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-neutral-700 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <Activity size={12} />
          Frames: <span className="font-semibold">{stats.totalFrames}</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers size={12} />
          Unique: <span className="font-semibold">{stats.uniqueFrames}</span>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`
            px-3 py-2 text-xs flex items-center gap-2 border-b
            ${status.type === 'success'
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900'
              : status.type === 'error'
              ? 'bg-red-900/30 text-red-400 border-red-900'
              : 'bg-blue-900/30 text-blue-400 border-blue-900'}
          `}
        >
          {status.type === 'success'
            ? <CheckCircle size={14} />
            : <AlertCircle size={14} />}
          {status.message}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">

        {results.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <Clock size={28} className="opacity-30" />
            Waiting for inference results
          </div>
        )}

        {results.map((result, idx) => (
          <div
            key={idx}
            className="border-b border-neutral-700 px-3 py-2 text-xs"
          >
            {/* Frame Header */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">
                Frame #{result.frameNumber}
              </span>
              <span
                className={`
                  px-2 py-0.5 rounded text-[10px] uppercase tracking-wide
                  ${result.isUnique
                    ? 'bg-emerald-800 text-emerald-300'
                    : 'bg-neutral-700 text-gray-300'}
                `}
              >
                {result.isUnique ? 'Unique' : 'Duplicate'}
              </span>
            </div>

            {/* ROI Results */}
            <div className="space-y-1">
              {result.results.map((item, i) => (
                <div key={i}>
                  <div className="text-indigo-400 font-medium">
                    {item.label}
                  </div>
                  <div className="font-mono text-gray-200 bg-neutral-900 px-2 py-1 rounded border border-neutral-700">
                    {item.detected_text || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default ResultsPanel;
