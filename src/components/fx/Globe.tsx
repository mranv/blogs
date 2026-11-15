/**
 * Slowly rotating dot globe for the home hero (WebGL, `cobe` — zero deps, ~5 KB).
 *
 * Follows the theme switch: cobe takes literal colours, so each frame re-reads the
 * `dark` class on <html> (set by src/utils/setting-utils.ts) and passes the matching
 * palette. Glow colour = paper colour, which hides cobe's halo (flat design, no glow).
 *
 * Decorative only: aria-hidden, no pointer events.
 *
 * Live visitor dots: POST /api/visitors (functions/api/visitors.ts) once a minute while the
 * tab is visible; the response is every coarse location seen in the last 5 minutes.
 * ponytail: polling, not a websocket (lilnasy/multiplayer-globe uses websocket + Valkey);
 * dots lag by up to a minute. On any fetch error the globe just shows no dots.
 */
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

type Rgb = [number, number, number];
// Paper & Ink tokens from src/styles/variables.styl, as 0..1 RGB
const DARK = { dark: 1, baseColor: [0.9, 0.87, 0.82] as Rgb, glowColor: [0, 0, 0] as Rgb, mapBrightness: 5 };
const LIGHT = { dark: 0, baseColor: [0.92, 0.89, 0.84] as Rgb, glowColor: [0.92, 0.89, 0.84] as Rgb, mapBrightness: 9 };

export default function Globe({ size = 320 }: { size?: number }) {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const palette = () => (document.documentElement.classList.contains("dark") ? DARK : LIGHT);
		let phi = 4.4; // start facing Europe / Asia
		const globe = createGlobe(canvas, {
			devicePixelRatio: 2,
			width: size * 2,
			height: size * 2,
			phi,
			theta: 0.25,
			diffuse: 1.1,
			mapSamples: 16000,
			markerColor: [0.81, 0.37, 0.2],
			markers: [],
			...palette(),
		});
		let raf = 0;
		const tick = () => {
			phi += 0.004;
			globe.update({ phi, ...palette() });
			raf = requestAnimationFrame(tick);
		};
		tick();
		const poll = async () => {
			if (document.hidden) return;
			try {
				const res = await fetch("/api/visitors", { method: "POST" });
				const dots: [number, number][] = await res.json();
				globe.update({ markers: dots.map((location) => ({ location, size: 0.05 })) });
			} catch {
				// no function in local preview, or offline: keep the bare globe
			}
		};
		poll();
		const timer = setInterval(poll, 60_000);
		return () => {
			clearInterval(timer);
			cancelAnimationFrame(raf);
			globe.destroy();
		};
	}, [size]);
	return <canvas ref={ref} width={size * 2} height={size * 2} style={{ width: size, height: size }} aria-hidden="true" />;
}
