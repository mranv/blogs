<script lang="ts">
  // AudioVisualizerGrid — Svelte 5 port of @livekit/agent-audio-visualizer-grid
  // Props: size(px), color(hex), rowCount, columnCount, radius(px), state(idle|speaking|thinking)
  import { onMount } from 'svelte';

  let {
    size = 300,
    color = '#C04CFA',
    rowCount = 15,
    columnCount = 15,
    radius = 60,
    state = 'idle',
    class: className = '',
  }: {
    size?: number;
    color?: string;
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
    const dotBaseSize = Math.max(1.5, size / (Math.max(rowCount, columnCount) * 3.5));
    const cellW = size / columnCount;
    const cellH = size / rowCount;

    time += 0.016;

    // Animated wave center for speaking
    const waveCx = cx + Math.sin(time * 1.5) * size * 0.05;
    const waveCy = cy + Math.cos(time * 1.2) * size * 0.05;

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columnCount; col++) {
        const dotX = cellW * (col + 0.5);
        const dotY = cellH * (row + 0.5);

        const dist = Math.sqrt((dotX - waveCx) ** 2 + (dotY - waveCy) ** 2);
        const normDist = dist / (size * 0.5);

        let dotSize = dotBaseSize;
        let alpha = 0.2;
        let hueShift = 0;

        if (state === 'speaking') {
          // Ripple effect from center
          const wave = Math.sin(dist * 0.08 - time * 4) * 0.5 + 0.5;
          const proximity = Math.max(0, 1 - dist / (radius * 2.5));
          dotSize = dotBaseSize + wave * dotBaseSize * 2.5 * proximity;
          alpha = 0.15 + wave * 0.7 * proximity;
          hueShift = wave * proximity * 30;
        } else if (state === 'thinking') {
          const pulse = Math.sin(time * 2 + normDist * Math.PI * 3) * 0.5 + 0.5;
          dotSize = dotBaseSize + pulse * dotBaseSize * 0.8;
          alpha = 0.1 + pulse * 0.3;
        } else {
          // idle — subtle breathing
          const breath = Math.sin(time * 0.6 + normDist * Math.PI * 2) * 0.5 + 0.5;
          dotSize = dotBaseSize + breath * dotBaseSize * 0.3;
          alpha = 0.08 + breath * 0.12;
        }

        const r = Math.min(255, baseR + hueShift);
        const g = Math.min(255, baseG + hueShift * 0.5);
        const b = Math.min(255, baseB);

        ctx.beginPath();
        ctx.arc(dotX, dotY, Math.max(0.5, dotSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }
    }

    // Center glow
    const glowAlpha = state === 'speaking' ? 0.1 : state === 'thinking' ? 0.05 : 0.02;
    const glowRadius = radius * (state === 'speaking' ? 1.5 : 1);
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
