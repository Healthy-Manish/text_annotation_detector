import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import CameraFeed from './components/CameraFeed';
import RegionList from './components/RegionList';
import ResultsPanel from './components/ResultsPanel';
import HistoryModal from './components/HistoryModal';
import HistorySidebar from './components/HistorySidebar';
const API_BASE = 'http://localhost:5000';

const App = () => {
  const videoRef = useRef(null);
  const streamIntervalRef = useRef(null);

  // =======================
  // STATE
  // =======================
  const [stream, setStream] = useState(null);
  const [regions, setRegions] = useState([]);
  const [regionsLocked, setRegionsLocked] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ totalFrames: 0, uniqueFrames: 0 });
  const [status, setStatus] = useState(null);

  const [sessionId, setSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRegion, setActiveRegion] = useState(null);

  const [showHistory, setShowHistory] = useState(false);

  // =======================
  // CLEANUP
  // =======================
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [stream]);

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 4000);
  };

  // =======================
  // CAMERA
  // =======================
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
      showStatus('Camera connected', 'success');
    } catch (err) {
      showStatus(`Camera error: ${err.message}`, 'error');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCameraActive(false);
    videoRef.current.srcObject = null;
    showStatus('Camera stopped', 'info');
  };

  // =======================
  // SESSION CONTROL
  // =======================
  const startSession = async () => {
    if (regions.length === 0) {
      showStatus('Define regions before starting', 'error');
      return;
    }
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);

    await fetch(`${API_BASE}/start_session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: newSessionId, regions })
    });

    setRegionsLocked(true);
    setIsStreaming(true);
    showStatus('Live feed started', 'success');

    streamIntervalRef.current = setInterval(()=> sendFrame(newSessionId),500); // 2 FPS
  };

const stopSession = async () => {
  // 1. Clear interval immediately to stop sendFrame calls
  if (streamIntervalRef.current) {
    clearInterval(streamIntervalRef.current);
    streamIntervalRef.current = null;
  }

  try {
    await fetch(`${API_BASE}/stop_session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });

    // 2. Reset UI States
    setIsStreaming(false); // This stops the "Processing" spinner
    setRegionsLocked(false);
    
    // 3. Load the final results
    await loadTimeline();
    showStatus('Session saved successfully', 'success');
  } catch (err) {
    showStatus('Error stopping session', 'error');
    setIsStreaming(false); // Ensure it unlocks even on error
  }
};


  // =======================
  // FRAME STREAMING
  // =======================
  const sendFrame = async (sid) => {
  if (!videoRef.current) return;

  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.current, 0, 0);

  const frame = canvas.toDataURL('image/jpeg');

  const res = await fetch(`${API_BASE}/stream_frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sid, frame })
  });

  const data = await res.json();

  if (data.detected_texts) {
    updateLiveTimeline(data);
  }
};


  const [timelineData, setTimelineData] = useState({});
  const loadTimeline = async () => {
  const res = await fetch(`${API_BASE}/timeline/${sessionId}`);
  const data = await res.json();
  setTimelineData(data);
};
const [sessions, setSessions] = useState([]);
const [activeSession, setActiveSession] = useState(null);
const [replayVideoUrl, setReplayVideoUrl] = useState(null);

useEffect(() => {
  fetch(`${API_BASE}/sessions`)
    .then(res => res.json())
    .then(setSessions);
}, []);
const loadSession = async (sessionId) => {
  setActiveSession(sessionId);

  // Load video
  setReplayVideoUrl(`${API_BASE}/video/${sessionId}`);

  // Load timeline
  const res = await fetch(`${API_BASE}/timeline/${sessionId}`);
  const timeline = await res.json();
  setTimelineData(timeline);

  showStatus(`Loaded session ${sessionId}`, 'info');
};
const [isHistoryOpen, setIsHistoryOpen] = useState(false);

const deleteSession = async (id) => {
  if (!window.confirm(`Delete session ${id}?`)) return;

  await fetch(`${API_BASE}/delete_session/${id}`, {
    method: 'DELETE'
  });

  // Refresh session list
  setSessions(prev => prev.filter(s => s.session_id !== id));

  // If deleted session was active
  if (activeSession === id) {
    setActiveSession(null);
    setReplayVideoUrl(null);
    setTimelineData({});
   
  }

  showStatus('Session deleted', 'success');
};
const updateLiveTimeline = (data) => {
  setTimelineData(prev => {
    const updated = { ...prev };

    Object.entries(data.detected_texts).forEach(([idx, text]) => {
      if (!text) return;

      if (!updated[idx]) updated[idx] = [];

      if (
        updated[idx].length === 0 ||
        updated[idx][0].text !== text
      ) {
        updated[idx] = [
          { timestamp: data.timestamp, text },
          ...updated[idx]
        ];
      }
    });

    return updated;
  });
};

  // =======================
  // UI
  // =======================
  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-900 text-gray-200">
      {/* HEADER */}
      <div className="h-14 border-b border-neutral-700">
        <Header />
      </div>



      {/* MAIN BODY */}
      <div className="flex h-[calc(100vh-56px)]">
          
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* LEFT SIDEBAR */}
          <div
              className={`
                relative transition-all duration-300
                ${isHistoryOpen ? 'w-60' : 'w-10'}
                bg-neutral-850 border-r border-neutral-700
              `}
            >
          {/* TOGGLE BUTTON */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="
              absolute -right-4 top-1/2 -translate-y-3/2
                       w-4 h-16 bg-neutral-700 hover:bg-neutral-600
                       rounded-r-md flex items-center justify-center z-10
            "
          >
            {isHistoryOpen ? '❮' : '❯'}
          </button>

          {/* CONTENT */}
          {isHistoryOpen && (
            <div className="flex flex-col h-full">
            <HistorySidebar
              sessions={sessions}
              activeSession={activeSession}
              onSelect={(id) => {
                loadSession(id);
                setIsHistoryOpen(false);
              }}
              onDelete={deleteSession}
            />
            </div>
          )}
        </div>
         {/* CAMERA COLUMN */}

            <div className="flex-1 relative">
            <CameraFeed
                videoRef={videoRef}
                stream={stream}
                isCameraActive={isCameraActive}
                regions={regions}
                setRegions={setRegions}
                regionsLocked={regionsLocked}
                replayVideoUrl={replayVideoUrl}
              />

            </div>
            {/* RIGHT SIDEBAR */}
            <div
              className={`relative transition-all duration-300
                ${isSidebarOpen ? 'w-96' : 'w-10'}
                bg-neutral-850 border-l border-neutral-700`}
            >
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -left-4 top-1/2 -translate-y-3/2
                        w-4 h-16 bg-neutral-700 hover:bg-neutral-600
                        rounded-l-md flex items-center justify-center"
            >
              {isSidebarOpen ? '❯' : '❮'}
            </button>

            {isSidebarOpen && (
              <div className="flex flex-col h-full">

                <RegionList
                  regions={regions}
                  activeIndex={activeRegion}
                  onSelect={setActiveRegion}
                  onUpdateLabel={(i, v) => {
                    const r = [...regions];
                    r[i].label = v;
                    setRegions(r);
                  }}
                  onRemove={(i) =>
                    setRegions(regions.filter((_, idx) => idx !== i))
                  }
                />

                <ResultsPanel
                    timeline={timelineData}
                    liveResults = {results}
                    regions={regions}
                    status={status}
                />

              </div>
          )}
        </div>
          </div >
          
            <ControlPanel
              isCameraActive={isCameraActive}
              isProcessing={isStreaming}
              onStart={startCamera}
              onStop={stopCamera}
              onCapture={startSession}
              onClear={stopSession}
              onHistory={() => setShowHistory(true)}
              startLabel="Start Live Feed"
              stopLabel="Stop & Save"
            />
          </div>


      </div>

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={[]}
      />

    </div>
  );
};

export default App;
