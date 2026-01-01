import React from 'react';

const HistorySidebar = ({ history, onSelect }) => {
  return (
    <div className="w-56 bg-neutral-850 border-r border-neutral-700 overflow-y-auto">
      <div className="h-10 px-3 flex items-center text-xs text-gray-300 border-b border-neutral-700">
        Previous Frames
      </div>

      {history.map((item) => (
        <button
          key={item.hash}
          onClick={() => onSelect(item)}
          className="w-full text-left px-3 py-2 text-xs text-gray-200
                     hover:bg-neutral-700 border-b border-neutral-800"
        >
          Frame #{item.data.frame_number}
          <div className="text-gray-400">
            {new Date(item.data.timestamp).toLocaleTimeString()}
          </div>
        </button>
      ))}
    </div>
  );
};

export default HistorySidebar;
