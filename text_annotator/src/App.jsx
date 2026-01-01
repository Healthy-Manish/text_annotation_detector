
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import CameraFeed from './components/CameraFeed';
import RegionList from './components/RegionList';
import ResultsPanel from './components/ResultsPanel';
import HistoryModal from './components/HistoryModal';
import { processFrame, fetchHistory } from './services/api';

const App = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [regions, setRegions] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ totalFrames: 0, uniqueFrames: 0 });
  const [status, setStatus] = useState(null);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 4000);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setIsCameraActive(true);
      showStatus('Camera connected', 'success');
    } catch (err) {
      showStatus(`Camera Error: ${err.message}`, 'error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      showStatus('Camera disconnected', 'info');
    }
  };

  const handleCapture = async () => {
    if (regions.length === 0) {
      showStatus('Please draw at least one region first', 'error');
      return;
    }

    setIsProcessing(true);
    
    // Capture Image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    tempCanvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageData = tempCanvas.toDataURL('image/jpeg');

    try {
      const data = await processFrame(imageData, regions, sessionId);
      
      if (data.success) {
        setResults(prev => [{
          frameNumber: data.total_frames,
          isUnique: data.is_unique,
          results: data.results,
          timestamp: new Date().toISOString()
        }, ...prev]);
        
        setStats({
          totalFrames: data.total_frames,
          uniqueFrames: data.unique_frames
        });
        
        data.is_unique 
          ? showStatus('New data captured', 'success')
          : showStatus('Duplicate content detected', 'info');
      } else {
        showStatus(data.error || 'Server error', 'error');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadHistory = async () => {
    try {
      const data = await fetchHistory(sessionId);
      setHistoryData(data);
      setShowHistory(true);
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const updateRegionLabel = (index, newLabel) => {
    const updated = [...regions];
    updated[index].label = newLabel;
    setRegions(updated);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRegion, setActiveRegion] = useState(null);
  



 return (
  <div className="w-screen h-screen overflow-hidden bg-neutral-900 text-gray-200">

    {/* Header */}
    <div className="h-14 bg-neutral-800 border-b border-neutral-700">
      <Header />
    </div>

    {/* Viewer Body */}
    <div className="flex h-[calc(100vh-56px)]">

      {/* Camera Viewer */}
      {/* Camera Viewer Column */}
     <div className="flex-1 flex flex-col bg-black">

       {/* Viewer (takes all remaining space) */}
        <div className="flex-1 relative bg-black">
          <CameraFeed
            videoRef={videoRef}
            stream={stream}
            isCameraActive={isCameraActive}
            regions={regions}
            setRegions={setRegions}
          />
        </div>

       {/* Tool strip (fixed height, always visible) */}
        <ControlPanel
          isCameraActive={isCameraActive}
          isProcessing={isProcessing}
          onStart={startCamera}
          onStop={stopCamera}
          onCapture={handleCapture}
          onClear={() => setRegions([])}
          onHistory={handleLoadHistory}
        />

    </div>

      {/* Dockable Sidebar */}
      <div
        className={`relative transition-all duration-300
          ${isSidebarOpen ? 'w-96' : 'w-10'}
          bg-neutral-850 border-l border-neutral-700`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-4 top-1/2 -translate-y-3/2 w-4 h-16
                     bg-neutral-700 hover:bg-neutral-600
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
              onUpdateLabel={updateRegionLabel}
              onRemove={(i) =>
                setRegions(regions.filter((_, idx) => idx !== i))
              }
            />

            <ResultsPanel
              results={results}
              stats={stats}
              status={status}
            />
          </div>
        )}
      </div>

    </div>

    <HistoryModal
      isOpen={showHistory}
      onClose={() => setShowHistory(false)}
      history={historyData}
    />
  </div>
);

};

export default App;