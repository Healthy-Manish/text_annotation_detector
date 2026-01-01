import React from 'react';
import { Square, X } from 'lucide-react';

const RegionList = ({
  regions,
  onUpdateLabel,
  onRemove,
  activeIndex,
  onSelect
}) => {
  return (
    <div className="flex flex-col h-full bg-neutral-850 border-b border-neutral-700">

      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-neutral-700">
        <div className="flex items-center gap-2 text-gray-200 text-sm font-medium">
          <Square size={14} />
          Regions
        </div>
        <span className="text-xs text-gray-400">
          {regions.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">

        {regions.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No regions drawn
          </div>
        )}

        {regions.map((region, idx) => (
          <div
            key={idx}
            onClick={() => onSelect?.(idx)}
            className={`
              flex items-center gap-2 px-3 h-9 cursor-pointer
              border-l-4
              ${activeIndex === idx
                ? 'bg-neutral-700 border-indigo-500'
                : 'bg-neutral-850 border-transparent hover:bg-neutral-800'}
            `}
          >
            {/* Color indicator */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: region.color }}
            />

            {/* Label */}
            <input
              type="text"
              value={region.label}
              onChange={(e) => onUpdateLabel(idx, e.target.value)}
              className="
                flex-1 bg-transparent text-xs text-gray-200
                focus:outline-none
              "
            />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(idx);
              }}
              className="p-1 text-gray-400 hover:text-red-400"
              title="Remove region"
            >
              <X size={12} />
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default RegionList;
