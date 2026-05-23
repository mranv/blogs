/**
 * AudioVisualizerAura — Svelte 5 port of @livekit/agent-audio-visualizer-aura
 * Pure Svelte implementation with zero dependencies. Uses Canvas + requestAnimationFrame.
 * Renders an animated radial aura that pulses based on simulated audio frequency data.
 *
 * Props:
 *   size       — number (px) default 200
 *   color      — string (hex) default "#1FD5F9"
 *   colorShift — number 0-1, hue shift intensity default 0.3
 *   state      — "idle" | "speaking" | "thinking" default "idle"
 */
<script lang="ts">
  import { onMount } from 'svelte';

  let {
    size = 200,
    color = '#1FD5F9',
    colorShift = 0.3,
    state = 'idle',
    class: className = '',
  }: {
    size?: number;
    color?: string;
    colorShift?: number;
    state?: 'idle' | 'speaking' | 'thinking';
    class?: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let animId: number;
  let time = 0;

  // Resolve any CSS color to RGB via getComputedStyle
  function resolveColor(colorStr: string): [number, number, number] {
    if (colorStr.startsWith('#')) return hexToRgb(colorStr);
    // Handle CSS variables via getComputedStyle
    const el = document.createElement('div');
    el.style.color = colorStr;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    // Parse rgb(r, g, b) or rgba(r, g, b, a)
    const m = computed.match(/(\d+)/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return [31, 213, 249]; // fallback cyan
  }

  // Parse hex color to RGB
  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }

  // HSL to RGB
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }

  function getRgb(r: number, g: number, b: number, shift: number, t: number): [number, number, number] {
    if (shift > 0) {
      const hueShift = Math.sin(t * 0.5) * shift * 360;
      // Convert original RGB to HSL, shift hue, convert back
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      let h = 0;
      const l = (max + min) / 2;
      const s = max === min ? 0 : l > 0.5
        ? (max - min) / (2 - max - min)
        : (max - min) / (max + min);
      if (max !== min) {
        if (max === rn) h = ((gn - bn) / (max - min)) * 60;
        else if (max === gn) h = (2 + (bn - rn) / (max - min)) * 60;
        else h = (4 + (rn - gn) / (max - min)) * 60;
      }
      return hslToRgb((h + hueShift + 360) % 360, s, l);
    }
    return [r, g, b];
  }

  // Simulated frequency bars for different states
  function getBarHeight(index: number, total: number, t: number, st: string): number {
    const norm = index / total;
    if (st === 'speaking') {
      return (
        0.3 +
        0.5 * Math.sin(t * 3 + norm * Math.PI * 4) *
        Math.cos(t * 2.3 + norm * Math.PI * 2) +
        0.2 * Math.sin(t * 5.7 + norm * Math.PI * 6)
      );
    } else if (st === 'thinking') {
      return 0.15 + 0.1 * Math.sin(t * 1.5 + norm * Math.PI * 3);
    }
    // idle
    return 0.08 + 0.04 * Math.sin(t * 0.8 + norm * Math.PI * 2);
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = size;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displaySize, displaySize);

    const cx = displaySize / 2;
    const cy = displaySize / 2;
    const [baseR, baseG, baseB] = resolveColor(color);
    const barCount = 64;
    const innerRadius = displaySize * 0.22;
    const maxBarHeight = displaySize * 0.26;

    time += 0.016; // ~60fps

    // Draw glow
    const [gr, gg, gb] = getRgb(baseR, baseG, baseB, colorShift, time);
    const gradient = ctx.createRadialGradient(cx, cy, innerRadius * 0.5, cx, cy, innerRadius + maxBarHeight * 1.2);
    gradient.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${state === 'speaking' ? 0.15 : 0.05})`);
    gradient.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, displaySize, displaySize);

    // Draw center circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, 0.08)`;
    ctx.fill();

    // Draw aura bars
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const barHeight = Math.max(0, getBarHeight(i, barCount, time, state)) * maxBarHeight;

      const x1 = cx + Math.cos(angle) * innerRadius;
      const y1 = cy + Math.sin(angle) * innerRadius;
      const x2 = cx + Math.cos(angle) * (innerRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (innerRadius + barHeight);

      const [cr, cg, cb] = getRgb(baseR, baseG, baseB, colorShift, time + i * 0.1);
      const alpha = 0.4 + (barHeight / maxBarHeight) * 0.6;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.lineWidth = Math.max(2, (Math.PI * 2 * innerRadius) / barCount * 0.6);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Outer ring glow
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${gr}, ${gg}, ${gb}, 0.2)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    animId = requestAnimationFrame(draw);
  }

  onMount(() => {
    draw();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class={className}
  style="width: {size}px; height: {size}px;"
  role="img"
  aria-label="Audio visualizer aura"
></canvas>
