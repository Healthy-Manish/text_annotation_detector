import React from 'react';
import { X, Calendar } from 'lucide-react';

const HistoryModal = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Session History</h2>
            <p className="text-sm text-gray-500 mt-1">Review previously detected frames</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50/30">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-20" />
              <p>No history records found for this session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-900">Frame #{item.data.frame_number}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(item.data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {item.data.results.map((res, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">{res.label}</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-100 text-gray-700 font-mono text-xs break-all">
                          {res.detected_text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;