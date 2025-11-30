import { useEffect, useRef, useState, useCallback } from 'react';
import { MotionZone } from '../types';

interface UseMotionProps {
  onMotionDetected: (zoneId: string) => void;
  zones: MotionZone[];
  isActive: boolean;
  sensitivity?: number; // 0-100, lower is more sensitive
}

export const useMotion = ({ onMotionDetected, zones, isActive, sensitivity = 25 }: UseMotionProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const previousFrameData = useRef<Uint8ClampedArray | null>(null);
  const requestRef = useRef<number>();

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        setStream(ms);
        setPermissionGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setPermissionGranted(false);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detectMotion = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive || zones.length === 0) {
      requestRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    // Draw video to canvas (small size for performance)
    const w = 320; // Downscale for processing
    const h = 240;
    canvas.width = w;
    canvas.height = h;

    // Draw video mirrored horizontally to match user mirror expectation
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, -w, h);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const now = Date.now();

    // 1. If no previous frame, save current and return
    if (!previousFrameData.current) {
      previousFrameData.current = data;
      requestRef.current = requestAnimationFrame(detectMotion);
      return;
    }

    const prevData = previousFrameData.current;
    
    // 2. Process active Zones
    zones.forEach(zone => {
      // Cooldown to prevent spam triggers
      if (now - zone.lastTriggered < 1000) return;

      // Map zone coordinates (0-100%) to canvas pixels
      // Note: Video is mirrored. 
      // If UI is 10% from left, in mirrored video, we analyze 10% from left of canvas because we drew it mirrored.
      
      const startX = Math.floor((zone.x / 100) * w);
      const startY = Math.floor((zone.y / 100) * h);
      const zoneW = Math.floor((zone.width / 100) * w);
      const zoneH = Math.floor((zone.height / 100) * h);

      let changedPixels = 0;
      const threshold = 30; // Pixel color difference threshold

      // Scan the zone area
      for (let y = startY; y < startY + zoneH; y++) {
        for (let x = startX; x < startX + zoneW; x++) {
          const index = (y * w + x) * 4;
          // Simple RGB difference
          const diff = 
            Math.abs(data[index] - prevData[index]) +
            Math.abs(data[index + 1] - prevData[index + 1]) +
            Math.abs(data[index + 2] - prevData[index + 2]);

          if (diff > threshold) {
            changedPixels++;
          }
        }
      }

      // Check if motion exceeds sensitivity area
      const totalPixels = zoneW * zoneH;
      const motionPercent = (changedPixels / totalPixels) * 100;

      if (motionPercent > sensitivity) {
        onMotionDetected(zone.id);
      }
    });

    previousFrameData.current = data;
    requestRef.current = requestAnimationFrame(detectMotion);
  }, [isActive, zones, onMotionDetected, sensitivity]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(detectMotion);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [detectMotion]);

  return { videoRef, canvasRef, permissionGranted };
};
