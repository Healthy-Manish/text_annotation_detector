import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

const CameraFeed = ({
  stream,
  isCameraActive,
  regions,
  setRegions,
  videoRef,
  onCanvasReady,
  regionsLocked,       
  replayVideoUrl      
}) => {

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce', '#85c1e2'];

  // Handle canvas sizing when video loads
  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const video = videoRef.current;
        if (canvasRef.current) {
           canvasRef.current.width = video.videoWidth;
           canvasRef.current.height = video.videoHeight;
           if (typeof onCanvasReady === 'function') {
            onCanvasReady({
              width: video.videoWidth,
              height: video.videoHeight
            });
          }
        }
      };
    }
  }, [isCameraActive, stream, onCanvasReady, videoRef]);

  // Redraw canvas when regions change
  useEffect(() => {
    if (isCameraActive && canvasRef.current) {
      drawRegions();
    }
  }, [regions, currentDraw, isCameraActive]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (!isCameraActive || regionsLocked) return;
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setDrawStart(coords);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    setCurrentDraw({
      x: Math.min(drawStart.x, coords.x),
      y: Math.min(drawStart.y, coords.y),
      width: Math.abs(coords.x - drawStart.x),
      height: Math.abs(coords.y - drawStart.y)
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    const width = Math.abs(coords.x - drawStart.x);
    const height = Math.abs(coords.y - drawStart.y);

    if (width > 10 && height > 10) {
      const newRegion = {
        x: Math.min(drawStart.x, coords.x),
        y: Math.min(drawStart.y, coords.y),
        width,
        height,
        color: colors[regions.length % colors.length],
        label: `Region ${regions.length + 1}`
      };
      setRegions([...regions, newRegion]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
  };

  const drawRegions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    regions.forEach(region => {
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(region.x, region.y, region.width, region.height);
      ctx.fillStyle = region.color;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(region.label, region.x, region.y - 8);
    });

    if (currentDraw) {
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(currentDraw.x, currentDraw.y, currentDraw.width, currentDraw.height);
      ctx.setLineDash([]);
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg aspect-video group">
      {replayVideoUrl ? (
        /* 🔁 REPLAY MODE */
        <video
          src={replayVideoUrl}
          controls
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        /* 🎥 LIVE CAMERA MODE */
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />
      )}

      
      {!replayVideoUrl && (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className={`absolute top-0 left-0 w-full h-full cursor-crosshair ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />
      )}


      {!isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
          <div className="p-4 rounded-full bg-gray-800 mb-4 animate-pulse">
            <Camera size={48} className="opacity-50" />
          </div>
          <p className="text-lg font-medium">Camera is offline</p>
          <p className="text-sm opacity-60">Click "Start Camera" to begin annotating</p>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;