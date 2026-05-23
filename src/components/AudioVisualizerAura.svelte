<script lang="ts">
  // AudioVisualizerAura — Faithful Svelte port of @livekit/agents-ui AgentAudioVisualizerAura
  // Renders a smooth, organic circular aura with gradient blobs that breathe/pulse
  // Props: size(px), color(hex), colorShift(0-1), state(idle|speaking|thinking)
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

  // Smooth noise function for organic movement
  function smoothNoise(t: number, seed: number): number {
    return Math.sin(t * 1.3 + seed) * 0.5
      + Math.sin(t * 2.7 + seed * 1.3) * 0.3
      + Math.sin(t * 4.1 + seed * 0.7) * 0.2;
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
    const [baseR, baseG, baseB] = hexToRgb(color);
    const [baseH, baseS, baseL] = rgbToHsl(baseR, baseG, baseB);

    // Animation speed based on state
    const speed = state === 'speaking' ? 2.5 : state === 'thinking' ? 1.2 : 0.6;
    time += 0.016 * speed;

    const baseRadius = displaySize * 0.18;
    const maxAuraRadius = displaySize * 0.45;

    // ── Layer 1: Deep outer glow ──
    const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius, cx, cy, maxAuraRadius);
    const outerAlpha = state === 'speaking' ? 0.08 : state === 'thinking' ? 0.04 : 0.02;
    outerGlow.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${outerAlpha})`);
    outerGlow.addColorStop(0.6, `rgba(${baseR}, ${baseG}, ${baseB}, ${outerAlpha * 0.3})`);
    outerGlow.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, maxAuraRadius, 0, Math.PI * 2);
    ctx.fill();

    // ── Layer 2: Organic gradient blobs (LiveKit-style) ──
    const blobCount = state === 'speaking' ? 8 : state === 'thinking' ? 5 : 3;
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + time * 0.3;
      const noiseVal = smoothNoise(time * 0.5, i * 2.1);

      // Blob position orbits around center with organic movement
      const orbitRadius = baseRadius * (0.8 + 0.4 * noiseVal);
      const bx = cx + Math.cos(angle + noiseVal * 0.5) * orbitRadius;
      const by = cy + Math.sin(angle + noiseVal * 0.5) * orbitRadius;

      // Blob size varies with state
      let blobSize: number;
      if (state === 'speaking') {
        blobSize = baseRadius * (0.6 + 0.8 * Math.abs(smoothNoise(time * 1.5, i * 1.7)));
      } else if (state === 'thinking') {
        blobSize = baseRadius * (0.4 + 0.3 * Math.abs(smoothNoise(time * 0.8, i * 1.7)));
      } else {
        blobSize = baseRadius * (0.3 + 0.15 * Math.abs(smoothNoise(time * 0.4, i * 1.7)));
      }

      // Color shift per blob
      const hueShift = colorShift > 0
        ? Math.sin(time * 0.3 + i * 1.2) * colorShift * 60
        : 0;
      const [cr, cg, cb] = hslToRgb(
        (baseH + hueShift + 360) % 360,
        Math.min(1, baseS * 1.2),
        baseL
      );

      const blobAlpha = state === 'speaking' ? 0.25 : state === 'thinking' ? 0.15 : 0.08;

      const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, blobSize);
      gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${blobAlpha})`);
      gradient.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${blobAlpha * 0.4})`);
      gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bx, by, blobSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Layer 3: Frequency bars (circular aura ring) ──
    const barCount = 72;
    const innerR = baseRadius * 1.1;
    const maxBarH = state === 'speaking' ? baseRadius * 1.2 : state === 'thinking' ? baseRadius * 0.4 : baseRadius * 0.15;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const norm = i / barCount;

      // Bar height with organic variation
      let barH: number;
      if (state === 'speaking') {
        barH = (
          0.2 +
          0.4 * Math.sin(time * 3.2 + norm * Math.PI * 6) *
          Math.cos(time * 1.8 + norm * Math.PI * 3) +
          0.3 * Math.abs(smoothNoise(time * 2, i * 0.5)) +
          0.1 * Math.sin(time * 5.5 + norm * Math.PI * 8)
        ) * maxBarH;
      } else if (state === 'thinking') {
        barH = (0.3 + 0.7 * Math.abs(Math.sin(time * 1.2 + norm * Math.PI * 4))) * maxBarH;
      } else {
        barH = (0.6 + 0.4 * Math.sin(time * 0.8 + norm * Math.PI * 2)) * maxBarH;
      }
      barH = Math.max(1, barH);

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * (innerR + barH);
      const y2 = cy + Math.sin(angle) * (innerR + barH);

      // Color per bar with shift
      const barHueShift = colorShift > 0
        ? Math.sin(time * 0.5 + i * 0.15) * colorShift * 40
        : 0;
      const [br, bg, bb] = hslToRgb(
        (baseH + barHueShift + 360) % 360,
        Math.min(1, baseS * 1.1),
        baseL
      );

      const alpha = 0.3 + (barH / maxBarH) * 0.5;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${br}, ${bg}, ${bb}, ${alpha})`;
      ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * innerR) / barCount * 0.55);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // ── Layer 4: Inner core glow ──
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.8);
    const coreAlpha = state === 'speaking' ? 0.2 : state === 'thinking' ? 0.1 : 0.05;
    coreGlow.addColorStop(0, `rgba(${baseR}, ${baseG}, ${baseB}, ${coreAlpha})`);
    coreGlow.addColorStop(0.7, `rgba(${baseR}, ${baseG}, ${baseB}, ${coreAlpha * 0.2})`);
    coreGlow.addColorStop(1, `rgba(${baseR}, ${baseG}, ${baseB}, 0)`);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // ── Layer 5: Inner ring ──
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${state === 'speaking' ? 0.25 : 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Layer 6: Outer pulsing ring (speaking only) ──
    if (state === 'speaking') {
      const pulseRadius = innerR + maxBarH * (0.6 + 0.2 * Math.sin(time * 2));
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${0.08 + 0.06 * Math.sin(time * 3)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

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
