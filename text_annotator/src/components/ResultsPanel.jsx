import React from 'react';
import {
  Layers,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const ResultsPanel = ({ timeline = {}, regions = [], status }) => {
  const isEmpty = !timeline || Object.keys(timeline).length === 0;

  return (
    <div className="flex flex-col h-full bg-neutral-850">

      {/* Header */}
      <div className="h-10 flex items-center px-3 border-b border-neutral-700 text-xs text-gray-300">
        <Layers size={12} className="mr-2" />
        Detection Timeline
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

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">

        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <Clock size={28} className="opacity-30" />
            No inference data yet
          </div>
        )}

        {!isEmpty && Object.entries(timeline).map(([regionIdx, events]) => {
          const regionIndex = Number(regionIdx);
          const region = regions[regionIndex];

          return (
            <div
              key={regionIdx}
              className="border-b border-neutral-700 px-3 py-2 text-xs"
            >
              {/* Region Header */}
              <div className="mb-2 text-indigo-400 font-semibold">
                {region?.label || `Region ${regionIndex + 1}`}
              </div>

              {/* Timeline Entries */}
              <div className="space-y-1">
                {[...(Array.isArray(events) ? events : [])]
                  .reverse()
                  .map((e, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-neutral-900 px-2 py-1 rounded border border-neutral-700"
                    >
                      <span className="font-mono text-gray-300">
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-gray-200">
                        {e.text}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsPanel;
