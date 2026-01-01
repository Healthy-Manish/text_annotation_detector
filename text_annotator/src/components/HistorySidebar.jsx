import React from 'react';
import { Video } from 'lucide-react';

const HistorySidebar = ({ sessions, onSelect, activeSession }) => {
  return (
    <div className="w-60 bg-neutral-850 border-r border-neutral-700 flex flex-col">

      <div className="h-10 px-3 flex items-center text-xs font-semibold text-gray-300 border-b border-neutral-700">
        Previous Sessions
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="p-4 text-xs text-gray-500">
            No saved sessions
          </div>
        )}

        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className={`
              w-full px-3 py-2 text-left text-xs flex items-center gap-2
              border-b border-neutral-800
              hover:bg-neutral-700
              ${activeSession === s.session_id ? 'bg-neutral-700' : ''}
            `}
          >
            <Video size={14} />
            {s.session_id}
          </button>
        ))}
      </div>

    </div>
  );
};

export default HistorySidebar;
