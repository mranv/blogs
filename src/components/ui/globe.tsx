"use client";

import React, { useRef, useEffect } from "react";

interface EarthProps {
  scale?: number;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
}

const Earth: React.FC<EarthProps> = ({
  scale = 1,
  baseColor = [0.2, 0.4, 0.8],
  markerColor = [1, 1, 1],
  glowColor = [0.3, 0.6, 1],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / (2 * window.devicePixelRatio);
      const centerY = canvas.height / (2 * window.devicePixelRatio);
      const radius = Math.min(centerX, centerY) * 0.8 * scale;

      // Draw glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 1.5
      );
      gradient.addColorStop(
        0,
        `rgba(${glowColor[0] * 255}, ${glowColor[1] * 255}, ${glowColor[2] * 255}, 0.3)`
      );
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw base sphere
      ctx.fillStyle = `rgb(${baseColor[0] * 255}, ${baseColor[1] * 255}, ${baseColor[2] * 255})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw latitude lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = centerY - radius + (radius * 2 * i) / 5;
        const lineRadius = Math.sqrt(
          radius * radius - Math.pow(y - centerY, 2)
        );
        if (lineRadius > 0) {
          ctx.beginPath();
          ctx.arc(centerX, y, lineRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw longitude lines
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + time;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.lineTo(
          centerX - Math.cos(angle) * radius,
          centerY - Math.sin(angle) * radius
        );
        ctx.stroke();
      }

      // Draw some marker points
      const markers = [
        { lat: 0.3, lng: 0.5 },
        { lat: -0.2, lng: 1.2 },
        { lat: 0.6, lng: -0.8 },
        { lat: -0.4, lng: -1.1 },
      ];

      markers.forEach(marker => {
        const x =
          centerX + Math.cos(marker.lng + time) * Math.cos(marker.lat) * radius;
        const y = centerY + Math.sin(marker.lat) * radius;

        ctx.fillStyle = `rgb(${markerColor[0] * 255}, ${markerColor[1] * 255}, ${markerColor[2] * 255})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [scale, baseColor, markerColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default Earth;
