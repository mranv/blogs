// Ink FX: press springs and drawn hit marks on the site's own controls, in Paper & Ink colours only.
// Written for this site. The approach is borrowed from the idea behind Sakuga VFX (github.com/finktheartist/sakuga-vfx):
// controls are plain at rest, the hand moves them on springs, marks appear only on the moment of change and
// leave by shrinking or thinning, never by fading. No code or artwork from that project is used here.
//
// Colours: every mark is drawn from --paper, --ink and --signal (variables.styl), re-read when the theme flips.
// Signal is only for the small accent wedges and needles, so it stays rare.
// Plain script, loaded deferred in <head>; listeners sit on document so they survive Swup swapping <main>.
(() => {
	'use strict';
	if (window.InkFX) return;
	const TAU = Math.PI * 2;
	const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
	const out = (t) => 1 - (1 - t) ** 3, inn = (t) => t * t * t, rnd = (a, b) => a + Math.random() * (b - a);
	// reduce.matches is read at every use; html.ink-calm is the reader's own switch (window.inkCalm, Layout.astro)
	const mq = matchMedia('(prefers-reduced-motion: reduce)'), reduce = { get matches() { return mq.matches || document.documentElement.classList.contains('ink-calm'); } };

	// ---- colours ----
	const C = { paper: '#000000', ink: '#cdc4ba', shade: '#2d2b28', signal: '#ce5e32' };
	const hex = (s) => { s = s.replace('#', ''); if (s.length === 3) s = [...s].map((c) => c + c).join(''); const n = parseInt(s, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
	const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
	function paint() {
		const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
		const paper = v('--paper'), ink = v('--ink'), signal = v('--signal');
		if (!/^#[0-9a-f]{3,6}$/i.test(paper) || !/^#[0-9a-f]{3,6}$/i.test(ink)) return;
		Object.assign(C, { paper, ink, shade: mix(paper, ink, 0.2), signal: /^#/.test(signal) ? signal : ink });
	}
	paint();
	new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

	// ---- one clock for springs and marks ----
	class Spring {
		constructor(x, k, d) { this.x = this.to = x; this.v = 0; this.k = k; this.d = d; }
		step(dt) { for (let n = Math.ceil(dt / 0.008), h = dt / n; n-- > 0;) { this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h; this.x += this.v * h; } return this.x; }
	}
	const presses = new Map(), marks = [];
	let raf = 0, last = 0, cv = null, g = null, dpr = 1;
	const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
	function frame(ms) {
		const dt = clamp((ms - last) / 1000, 0, 0.034); last = ms; raf = 0;
		for (const [el, m] of presses) stepPress(el, m, dt);
		drawMarks(dt);
		if (presses.size || marks.length) run();
	}

	// ---- the layer: one fixed canvas over the page, click-through, above the film grain ----
	function size() { if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
	function layer() {
		if (cv?.isConnected) return true;
		if (!document.body) return false;
		cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
		cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:10000';
		document.body.append(cv); g = cv.getContext('2d'); size(); return true;
	}
	addEventListener('resize', size);
	// marks are placed in page coordinates, so they stay with their control if the page scrolls
	const add = (life, draw) => { if (reduce.matches || !layer()) return; marks.push({ t: 0, life, draw }); run(); };
	function drawMarks(dt) {
		if (!g) return;
		g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
		g.translate(-scrollX, -scrollY); g.lineCap = g.lineJoin = 'round';
		for (let i = marks.length; i--;) if ((marks[i].t += dt) >= marks[i].life) marks.splice(i, 1);
		for (const m of marks) { g.save(); m.draw(m.t / m.life, m.t); g.restore(); }
	}
	const at = (el, fx = 0.5, fy = 0.5) => { const b = el.getBoundingClientRect(); return { x: b.left + scrollX + b.width * fx, y: b.top + scrollY + b.height * fy, w: b.width, h: b.height }; };

	// ---- the marks ----
	// wedges: small signal darts that shoot out from a point and thin away
	function wedges(x, y, { n = 3, r = 8, len = 8, dir = -0.8, fan = 0.45, life = 0.36 } = {}) {
		add(life, (k) => {
			const a = out(clamp(k / 0.5)), b = inn(clamp((k - 0.4) / 0.6));
			g.fillStyle = C.signal; g.beginPath();
			for (let i = 0; i < n; i++) {
				const an = dir + (i - (n - 1) / 2) * fan, r0 = r + len * b * 1.3, r1 = r + len * a * 1.3, hw = 0.08 + 2 / (r1 + 8);
				if (r1 - r0 < 0.6) continue;
				g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
				g.lineTo(x + Math.cos(an - hw) * r1, y + Math.sin(an - hw) * r1);
				g.lineTo(x + Math.cos(an + hw) * r1, y + Math.sin(an + hw) * r1);
			}
			g.fill();
		});
	}
	// ring: an ink hairline that opens out while its line thins to nothing
	function ring(x, y, { r = 24, life = 0.42 } = {}) {
		add(life, (k) => { const w = 2.4 * (1 - k); if (w < 0.15) return; g.strokeStyle = C.ink; g.lineWidth = w; g.beginPath(); g.arc(x, y, r * (0.45 + out(k) * 0.75), 0, TAU); g.stroke(); });
	}
	// glint: a four-point star in paper with an ink edge and a signal core; opens and closes
	function glint(x, y, { r = 8, life = 0.5 } = {}) {
		add(life, (k) => {
			const s = r * Math.sin(k * Math.PI) ** 0.6, q = s * 0.16; if (s < 0.4) return;
			const p = new Path2D(); p.moveTo(x, y - s); p.quadraticCurveTo(x + q, y - q, x + s * 0.7, y); p.quadraticCurveTo(x + q, y + q, x, y + s); p.quadraticCurveTo(x - q, y + q, x - s * 0.7, y); p.quadraticCurveTo(x - q, y - q, x, y - s);
			g.fillStyle = C.paper; g.fill(p); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke(p);
			g.fillStyle = C.signal; g.beginPath(); g.arc(x, y, s * 0.12, 0, TAU); g.fill();
		});
	}
	// speed lines: ink strokes that shoot one way and thin away
	function streaks(x, y, { n = 5, dir = Math.PI / 2, len = 28, spread = 12, life = 0.28 } = {}) {
		for (let i = 0; i < n; i++) {
			const o = rnd(-spread, spread), l = len * rnd(0.5, 1.2), w = rnd(0.8, 1.8), px = x - Math.sin(dir) * o, py = y + Math.cos(dir) * o, d = rnd(0, 0.2);
			add(life, (k) => {
				const kk = clamp((k - d) / (1 - d)), a = out(kk), b = inn(kk), lw = w * (1 - b); if (lw < 0.15 || a - b < 0.01) return;
				g.strokeStyle = C.ink; g.lineWidth = lw; g.beginPath();
				g.moveTo(px + Math.cos(dir) * l * b, py + Math.sin(dir) * l * b); g.lineTo(px + Math.cos(dir) * l * a, py + Math.sin(dir) * l * a); g.stroke();
			});
		}
	}
	// dust: two or three shade grains with an ink edge that hop up and shrink
	function dust(x, y, { n = 2, size = 3.2, life = 0.42 } = {}) {
		for (let i = 0; i < n; i++) {
			const vx = rnd(-16, 16), vy = rnd(-26, -12), r0 = size * rnd(0.6, 1.1);
			add(life * rnd(0.75, 1), (k, t) => {
				const r = r0 * (k < 0.2 ? out(k / 0.2) : 1 - inn(clamp((k - 0.45) / 0.55))); if (r < 0.3) return;
				g.beginPath(); g.arc(x + vx * t, y + vy * t + 40 * t * t, r, 0, TAU); g.fillStyle = C.shade; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1; g.stroke();
			});
		}
	}
	// burst: the impact star. Shade body, ink edge, signal needles; it leaves by hollowing out from the middle.
	function burst(x, y, { r = 16, spikes = 11, life = 0.36 } = {}) {
		const jag = Array.from({ length: spikes * 2 }, (_, i) => (i % 2 ? rnd(0.38, 0.5) : rnd(0.8, 1.12))), rot = rnd(0, TAU);
		const pins = Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * TAU + rnd(0, 0.5), l: rnd(1.3, 1.8) }));
		add(life, (k) => {
			const R = r * out(clamp(k / 0.3)), hole = R * inn(clamp((k - 0.3) / 0.7)) * 0.95;
			g.fillStyle = C.signal; g.beginPath();
			for (const p of pins) { const l = R * p.l * (1 - inn(clamp((k - 0.5) / 0.5))), r0 = Math.max(R * 0.6, hole); if (l <= r0) continue; g.moveTo(x + Math.cos(p.a - 0.05) * r0, y + Math.sin(p.a - 0.05) * r0); g.lineTo(x + Math.cos(p.a) * l, y + Math.sin(p.a) * l); g.lineTo(x + Math.cos(p.a + 0.05) * r0, y + Math.sin(p.a + 0.05) * r0); }
			g.fill();
			const star = new Path2D();
			jag.forEach((m, i) => { const a = rot + (i / jag.length) * TAU, rr = R * m; star[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); });
			star.closePath();
			if (hole > 0.5) { star.moveTo(x + hole, y); star.arc(x, y, hole, 0, TAU, true); }   // the hollow grows until nothing is left
			g.fillStyle = C.shade; g.fill(star, 'evenodd'); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke(star);
		});
	}

	// ---- the press: squash while held, overshoot on release; flatter means wider, so it keeps its volume ----
	const PRESS = '.btn-regular,.btn-plain,.btn-card,.newsletter-submit';
	function stepPress(el, m, dt) {
		const y = m.s.step(dt), p = m.pop.step(dt);
		if (!m.held && Math.abs(y - 1) < 0.001 && Math.abs(m.s.v) < 0.01 && Math.abs(p - 1) < 0.001 && Math.abs(m.pop.v) < 0.01) {
			el.style.transform = ''; el.style.transition = m.tr; presses.delete(el);
		} else el.style.transform = `scale(${(1 + (1 - y) * 0.5) * p}, ${y * p})`;
	}
	document.addEventListener('pointerdown', (e) => {
		const el = e.target.closest?.(PRESS);
		if (!el || el.disabled || reduce.matches) return;
		let m = presses.get(el);
		if (!m) {
			// transition-all on the templates would ease the spring; keep colour transitions only while it moves
			m = { s: new Spring(1, 520, 15), pop: new Spring(1, 300, 12), tr: el.style.transition };
			el.style.transition = 'background-color .17s, color .17s, border-color .17s';
			presses.set(el, m);
		}
		m.held = true; m.s.to = 0.86; run();
	}, true);
	const release = () => { for (const m of presses.values()) if (m.held) { m.held = false; m.s.to = 1; m.pop.v += 1.6; } run(); };
	document.addEventListener('pointerup', release, true);
	document.addEventListener('pointercancel', release, true);

	// ---- the hit: fired on click, so the keyboard gets it too ----
	document.addEventListener('click', (e) => {
		const el = e.target.closest?.('#scheme-switch,#back-to-top-btn,' + PRESS);
		if (!el || el.disabled) return;
		const c = at(el), top = c.y - c.h / 2, right = c.x + c.w / 2;
		if (el.id === 'scheme-switch') {
			// the theme flips in this same click; wait a frame so the marks use the new colours
			requestAnimationFrame(() => { paint(); ring(c.x, c.y, { r: c.w * 0.6 }); glint(right - 6, top + 6); });
		} else if (el.closest('#back-to-top-btn')) {
			streaks(c.x, c.y + c.h / 2, { spread: c.w * 0.3 });
		} else {
			wedges(right - 2, top + 2);
		}
	});

	// ---- typing: a pinch of dust at the caret ----
	const meter = document.createElement('canvas').getContext('2d');
	document.addEventListener('input', (e) => {
		const inp = e.target;
		if (!inp.matches?.('.newsletter-input') || !String(e.inputType).startsWith('insert')) return;
		const cs = getComputedStyle(inp), b = inp.getBoundingClientRect(), pad = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
		meter.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const upto = inp.selectionStart ?? inp.value.length;   // type=email has no selectionStart; the caret is at the end while typing
		const x = Math.min(b.right - pad, b.left + pad + meter.measureText(inp.value.slice(0, upto)).width - inp.scrollLeft);
		dust(x + scrollX, b.top + scrollY + b.height * 0.8);
	});

	// ---- the one confirm (newsletter success): impact on the check icon, wedges off the far side ----
	window.InkFX = {
		confirm(el) {
			// centred on the widget's check icon, so the message text beside and below it stays clear
			const c = at(el.querySelector('svg') || el);
			burst(c.x, c.y);
			setTimeout(() => wedges(c.x, c.y, { n: 4, r: 18, len: 10, dir: -2, fan: 0.55 }), 90);
		},
	};
})();
