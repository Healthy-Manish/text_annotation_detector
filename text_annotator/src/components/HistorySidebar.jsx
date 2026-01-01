import React from 'react';
import { Video, Trash2 } from 'lucide-react';

const HistorySidebar = ({ sessions, onSelect, onDelete, activeSession }) => {
  return (
    <div className="w-60 bg-neutral-850 border-r border-neutral-700 flex flex-col">

      {/* Header */}
      <div className="h-10 px-3 flex items-center text-xs font-semibold text-gray-300 border-b border-neutral-700">
        Previous Sessions
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="p-4 text-xs text-gray-500">
            No saved sessions
          </div>
        )}

        {sessions.map((s) => (
          <div
            key={s.session_id}
            className={`
              flex items-center justify-between px-0.5 py-1 text-xs
              border-b border-neutral-800
             
              ${activeSession === s.session_id ? 'bg-neutral-700' : ''}
            `}
          >
            {/* Select Session */}
            <button
              onClick={() => onSelect(s.session_id)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <Video size={14} />
              <span className="truncate">{s.session_id}</span>
            </button>

            {/* Delete Session */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // 🔴 IMPORTANT
                onDelete(s.session_id);
              }}
              className="
                rounded ml-0.5 mr-0.5
                text-gray-400 hover:text-red-400
                hover:bg-red-900/30
              "
              title="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default HistorySidebar;
