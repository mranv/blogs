<script lang="ts">
  // AudioVisualizerGrid — Faithful Svelte port of @livekit/agents-ui AgentAudioVisualizerGrid
  // Renders a circular dot-matrix that responds to audio state with ripple effects
  // Props: size(px), color(hex), colorShift(0-1), rowCount, columnCount, radius(px), state
  import { onMount } from 'svelte';

  let {
    size = 300,
    color = '#1FD5F9',
    colorShift = 0.3,
    rowCount = 15,
    columnCount = 15,
    radius = 60,
    state = 'idle',
    class: className = '',
  }: {
    size?: number;
    color?: string;
    colorShift?: number;
    rowCount?: number;
    columnCount?: number;
    radius?: number;
    state?: 'idle' | 'speaking' | 'thinking';
    class?: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let animId: number;
  let time = 0;

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }

  function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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
    if (h < 0) h += 360;
    return [h, s, l];
  }

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
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const [baseR, baseG, baseB] = hexToRgb(color);
    const [baseH, baseS, baseL] = rgbToHsl(baseR, baseG, baseB);
    const dotBaseSize = Math.max(1.5, size / (Math.max(rowCount, columnCount) * 3.5));
    const cellW = size / columnCount;
    const cellH = size / rowCount;

    // Speed per state
    const speed = state === 'speaking' ? 2.5 : state === 'thinking' ? 1.2 : 0.6;
    time += 0.016 * speed;

    // Animated wave center
    const waveCx = cx + Math.sin(time * 1.5) * size * 0.03;
    const waveCy = cy + Math.cos(time * 1.2) * size * 0.03;

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columnCount; col++) {
        const dotX = cellW * (col + 0.5);
        const dotY = cellH * (row + 0.5);

        const dist = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
        const normDist = dist / (size * 0.5);

        // Only draw dots within a circular area
        if (dist > size * 0.48) continue;

        let dotSize = dotBaseSize;
        let alpha = 0.15;

        if (state === 'speaking') {
          // Multi-ring ripple from center
          const wave1 = Math.sin(dist * 0.08 - time * 4) * 0.5 + 0.5;
          const wave2 = Math.sin(dist * 0.12 - time * 3 + 1.5) * 0.5 + 0.5;
          const wave = (wave1 * 0.7 + wave2 * 0.3);
          const proximity = Math.max(0, 1 - dist / (radius * 3));
          dotSize = dotBaseSize + wave * dotBaseSize * 3 * proximity;
          alpha = 0.1 + wave * 0.75 * proximity;
        } else if (state === 'thinking') {
          const pulse = Math.sin(time * 2 + normDist * Math.PI * 3) * 0.5 + 0.5;
          const proximity = Math.max(0, 1 - dist / (radius * 2));
          dotSize = dotBaseSize + pulse * dotBaseSize * 1.2 * proximity;
          alpha = 0.08 + pulse * 0.35 * proximity;
        } else {
          // idle — gentle breathing
          const breath = Math.sin(time * 0.6 + normDist * Math.PI * 2) * 0.5 + 0.5;
          dotSize = dotBaseSize + breath * dotBaseSize * 0.4;
          alpha = 0.06 + breath * 0.14;
        }

        // Per-dot color shift
        const hueShift = colorShift > 0
          ? Math.sin(time * 0.3 + (row + col) * 0.2) * colorShift * 40
          : 0;
        const [dr, dg, db] = hslToRgb(
          (baseH + hueShift + 360) % 360,
          Math.min(1, baseS * 1.1),
          baseL
        );

        ctx.beginPath();
        ctx.arc(dotX, dotY, Math.max(0.5, dotSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dr}, ${dg}, ${db}, ${alpha})`;
        ctx.fill();
      }
    }

    // Center glow
    const glowAlpha = state === 'speaking' ? 0.12 : state === 'thinking' ? 0.06 : 0.03;
    const glowRadius = radius * (state === 'speaking' ? 2 : 1.2);
    const gradient = ctx.createRadialGradient(waveCx, waveCy, 0, waveCx, waveCy, glowRadius);
    gradient.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${glowAlpha})`);
    gradient.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

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
  aria-label="Audio visualizer grid"
></canvas>
