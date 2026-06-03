import { useState, useCallback } from "react";

export interface UseCameraResult {
  stream: MediaStream | null;
  active: boolean;
  error: string;
  start: (facingMode?: "user" | "environment") => Promise<MediaStream>;
  stop: () => void;
  capture: (videoElement: HTMLVideoElement | null) => string | null;
}

export function useCamera(): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const start = useCallback(async (facingMode: "user" | "environment" = "environment"): Promise<MediaStream> => {
    setError("");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Web MediaDevices API tidak didukung pada browser ini.");
      }
      
      // Stop existing stream if running
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      setStream(mediaStream);
      setActive(true);
      return mediaStream;
    } catch (err: any) {
      console.error("Camera hook access failed:", err);
      const msg = err.name === "NotAllowedError" 
        ? "Izin untuk mengakses kamera ditolak oleh pengguna." 
        : err.message || "Gagal mengakses kamera hardware.";
      setError(msg);
      throw new Error(msg);
    }
  }, [stream]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setActive(false);
  }, [stream]);

  const capture = useCallback((videoElement: HTMLVideoElement | null): string | null => {
    if (!videoElement) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame to the canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        return dataUrl;
      }
      return null;
    } catch (err) {
      console.error("Error capturing canvas frame:", err);
      return null;
    }
  }, []);

  return {
    stream,
    active,
    error,
    start,
    stop,
    capture
  };
}
