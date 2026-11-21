// Ink Type: headings are typed onto the page as they scroll into view, the way /type-garden/ types.
// Each letter strikes in wet signal ink and dries to the heading's own colour, a caret runs ahead of it,
// and a post title ends with the painter's red seal (hanko) carrying its first letter. Post h2s then get a
// sumi brush stroke swept in underneath. Two more ink moments ride on the same observer:
//  - post images below the fold open like ink spreading on paper (a circular clip-path reveal);
//  - a few ume (plum) petals drift across the home hero ([data-petals]) while it is on screen;
//  - an ensō (zen brush circle) draws itself bottom-right while Swup fetches a page, and once per session;
//  - [data-ink-cycle='["a","b"]'] types each phrase, holds, backspaces, types the next (About, Projects);
//  - [data-ink-stamp] (footer seal) stamps down, post blockquotes get their rule painted in, post code
//    blocks print line by line, and [data-ink-fin] (end of a post) brushes an ensō, all on view;
//  - the hero's falling marks follow the season: ume, hotaru, momiji, snow.
// Everything plays on its own: no hover or click needed, so every visitor sees it.
//
// Targets: anything marked [data-ink-type] (post title: ="seal", post-card titles) plus .custom-md h2/h3.
// The same selector is repeated in Layout.astro's <head> (the ink-type-wait rule that hides untyped
// headings before this deferred script runs, failing open after 2.5s): change both together.
//
// Invariants:
//  - The server HTML is never changed, and once a heading is typed its original text nodes are put
//    back, so copy, find-in-page and kerning end up exactly as without this script.
//  - While typing, screen readers get the whole text from a visually hidden copy; the letters are
//    aria-hidden. prefers-reduced-motion: nothing is touched.
//  - Plain script, deferred in <head>; a MutationObserver picks up headings Swup swaps into <main>.
(() => {
	'use strict';
	if (window.InkType) return;
	window.InkType = true;
	const SEL = '[data-ink-type], .custom-md h2, .custom-md h3';
	const root = document.documentElement;
	const done = () => root.classList.remove('ink-type-wait');
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();

	const style = document.createElement('style');
	style.textContent = `
.it-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.it-c{display:inline-block;opacity:0;white-space:pre}
.it-c.on{opacity:1;animation:it-strike .4s cubic-bezier(.2,.9,.3,1.25) both}
@keyframes it-strike{0%{transform:translateY(-.16em) scale(1.3);filter:blur(1px);color:var(--signal)}
 35%{filter:none;color:var(--signal)}}
.it-caret{display:inline-block;width:.07em;height:.85em;margin:0 .02em;vertical-align:-.08em;background:var(--signal)}
.it-caret.blink{animation:it-blink .5s steps(1) 3}
@keyframes it-blink{50%{opacity:0}}
.it-seal{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;margin-left:.3em;
 vertical-align:.05em;font-size:.55em;line-height:1;border-radius:2px;background:var(--signal);color:var(--paper);
 animation:it-stamp .45s cubic-bezier(.2,.9,.3,1.4) both;transform:rotate(-4deg)}
@keyframes it-stamp{0%{opacity:0;transform:scale(1.8) rotate(-14deg)}60%{opacity:1}}
.it-brush{position:absolute;left:0;bottom:-.42em;width:min(5.5em,60%);height:.38em;color:var(--line-strong);pointer-events:none;
 animation:it-sweep .75s cubic-bezier(.3,.7,.2,1) both}
@keyframes it-sweep{0%{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.it-img{transition:clip-path 1.1s cubic-bezier(.25,.8,.25,1)}
.it-enso{position:fixed;right:20px;bottom:20px;width:64px;height:64px;z-index:9999;pointer-events:none;color:var(--ink);opacity:.85;transition:opacity .35s,transform .35s}
.it-enso.out{opacity:0;transform:scale(.85) rotate(20deg)}
.it-fin{display:flex;justify-content:center;color:var(--ink-muted);min-height:56px}
:is(.it-enso,.it-fin) circle{stroke-dasharray:239;animation:it-enso .9s cubic-bezier(.5,.1,.3,1) both}
@keyframes it-enso{from{stroke-dashoffset:239}to{stroke-dashoffset:0}}
.it-wait{opacity:0}
.it-code .ec-line{opacity:0}
.it-code.on .ec-line{opacity:1;animation:it-line .35s ease-out both;animation-delay:calc(min(var(--i),40) * 22ms)}
@keyframes it-line{0%{opacity:0;transform:translateX(-.5em)}}
.it-stamp{animation:it-stamp .5s cubic-bezier(.2,.9,.3,1.4) both}
.custom-md blockquote.it-q:before{transform-origin:top;animation:it-q .9s cubic-bezier(.3,.7,.2,1) both}
@keyframes it-q{0%{transform:scaleY(0);background:var(--signal)}60%{background:var(--signal)}}`;
	document.head.append(style);

	// split every text node into one span per letter; spaces stay plain text so lines still break between words
	function prep(el) {
		const nodes = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
			acceptNode: (n) => n.data.trim() && !n.parentElement.closest('.anchor, svg, [aria-hidden="true"]') ? 1 : 3,
		});
		while (tw.nextNode()) nodes.push(tw.currentNode);
		el._it = nodes.map((node) => {
			const sr = document.createElement('span'), vis = document.createElement('span');
			sr.className = 'it-sr'; sr.textContent = node.data;
			vis.setAttribute('aria-hidden', 'true');
			// each letter is an inline-block (transforms need it), and every inline-block is a line-break
			// opportunity: a nowrap span per word keeps "Deployment" from wrapping as "De / ployment"
			for (const part of node.data.split(/(\s+)/)) {
				if (!part) continue;
				if (/^\s/.test(part)) { vis.append(part); continue; }
				const w = document.createElement('span'); w.style.whiteSpace = 'nowrap';
				for (const ch of part) { const c = document.createElement('span'); c.className = 'it-c'; c.textContent = ch; w.append(c); }
				vis.append(w);
			}
			node.replaceWith(sr, vis);
			return { node, sr, vis };
		});
	}

	function type(el) {
		const chars = el._it.flatMap((p) => [...p.vis.querySelectorAll('.it-c')]);
		if (!chars.length) return;
		const caret = document.createElement('span'); caret.className = 'it-caret';
		// long titles type faster: about 1.1s at most, with a hand's unevenness between keys.
		// Paced by elapsed time, not one timer per letter: post pages keep the main thread busy
		// (ASCII strip, globe), and a timer chain there crawled at ~5 letters a second.
		const step = Math.min(42, 1100 / chars.length), at = [];
		for (let t = 0, k = 0; k < chars.length; k++) { at.push(t); t += step * (0.6 + Math.random() * 0.8); }
		const t0 = performance.now();
		let i = 0;
		const next = () => {
			const now = performance.now() - t0;
			while (i < chars.length && at[i] <= now) chars[i++].classList.add('on');
			if (i) chars[i - 1].after(caret);
			if (i < chars.length) return requestAnimationFrame(next);
			caret.classList.add('blink');
			if (el.dataset.inkType === 'seal') {
				const s = document.createElement('span'); s.className = 'it-seal'; s.setAttribute('aria-hidden', 'true');
				s.textContent = chars[0].textContent.toUpperCase();
				setTimeout(() => el.append(s), 160);
			}
			if (el.tagName === 'H2' && el.closest('.custom-md')) setTimeout(() => brush(el), 120);
			// settle: drop the caret and the letter spans, put the original text back
			setTimeout(() => { caret.remove(); for (const p of el._it) { p.sr.remove(); p.vis.replaceWith(p.node); } el._it = null; }, 1600);
		};
		next();
	}

	// a sumi stroke: heavy where the brush lands, lifting to a dry tip; shape random per heading.
	// Absolutely placed under the heading, so it never shifts the text below it
	function brush(el) {
		const W = 220, H = 14, top = [], bot = [], ph = Math.random() * 6;
		for (let i = 0; i <= 24; i++) {
			const u = i / 24, y = H / 2 + Math.sin(u * 3 + ph) * 1.6;
			const hw = H / 2 * (0.15 + 0.85 * Math.pow(1 - u, 0.6) * Math.min(1, 0.35 + u * 8)) * (0.85 + 0.3 * Math.random());
			top.push(`${(u * W).toFixed(1)} ${(y - hw).toFixed(1)}`); bot.unshift(`${(u * W).toFixed(1)} ${(y + hw).toFixed(1)}`);
		}
		const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
		svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
		svg.setAttribute('aria-hidden', 'true'); svg.classList.add('it-brush');
		path.setAttribute('d', `M${top.join('L')}L${bot.join('L')}Z`); path.setAttribute('fill', 'currentColor');
		svg.append(path);
		if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
		el.append(svg);
	}

	// images: ink spreading from a random point. Only images still below the fold are clipped,
	// so nothing already on screen ever blinks out
	const iio = new IntersectionObserver((es) => {
		for (const e of es) if (e.isIntersecting) {
			const im = e.target; iio.unobserve(im);
			im.style.clipPath = `circle(150% at ${im.dataset.inkAt})`;
			setTimeout(() => { im.style.clipPath = ''; im.classList.remove('it-img'); }, 1200);
		}
	}, { rootMargin: '0px 0px -10% 0px' });
	function images() {
		for (const im of document.querySelectorAll('.custom-md img')) {
			if (im.dataset.inkAt) continue;
			im.dataset.inkAt = `${20 + Math.random() * 60}% ${20 + Math.random() * 60}%`;
			if (im.getBoundingClientRect().top < innerHeight) continue;
			im.classList.add('it-img'); im.style.clipPath = `circle(0% at ${im.dataset.inkAt})`; iio.observe(im);
		}
	}

	// what falls over the hero follows the season (northern hemisphere, the visitor's clock):
	// ume petals in spring, hotaru (fireflies) rising in summer, momiji (maple) in autumn, snow in winter.
	// ?season=ume|hotaru|momiji|snow overrides it, for review.
	const SEASON = (() => {
		const q = new URLSearchParams(location.search).get('season');
		if (/^(ume|hotaru|momiji|snow)$/.test(q || '')) return q;
		return ['snow', 'snow', 'ume', 'ume', 'ume', 'hotaru', 'hotaru', 'hotaru', 'momiji', 'momiji', 'momiji', 'snow'][new Date().getMonth()];
	})();
	// petals: one fixed click-through canvas, alive only while the home hero is on screen or petals remain
	let hero = null, heroOn = false, pcv = null, pg = null, praf = 0, plast = 0, pspawn = 0;
	const petals = [];
	const pio = new IntersectionObserver((es) => { heroOn = es[es.length - 1].isIntersecting; if (heroOn) pkick(); });
	function pkick() {
		if (praf) return;
		if (!pcv?.isConnected) {
			pcv = document.createElement('canvas'); pcv.setAttribute('aria-hidden', 'true');
			pcv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:40';
			document.body.append(pcv); pg = pcv.getContext('2d');
		}
		plast = performance.now(); praf = requestAnimationFrame(pstep);
	}
	function pstep(now) {
		praf = 0;
		const dt = Math.min(50, now - plast), dpr = Math.min(2, devicePixelRatio || 1); plast = now;
		if (pcv.width !== Math.round(innerWidth * dpr) || pcv.height !== Math.round(innerHeight * dpr)) { pcv.width = Math.round(innerWidth * dpr); pcv.height = Math.round(innerHeight * dpr); }
		const live = heroOn && hero?.isConnected;
		// a gentle fall: at most 8 petals, one every ~1.1s, only across the hero's width
		if (live && petals.length < 8 && now > pspawn) {
			const r = hero.getBoundingClientRect(), cs = getComputedStyle(root);
			pspawn = now + 700 + Math.random() * 900;
			const v = (n) => cs.getPropertyValue(n).trim(), up = SEASON === 'hotaru';
			petals.push({ x: r.left + Math.random() * r.width, y: up ? r.top + r.height * (0.5 + Math.random() * 0.5) : Math.max(-16, r.top - 16),
				vy: up ? -(0.008 + Math.random() * 0.012) : SEASON === 'snow' ? 0.02 + Math.random() * 0.025 : 0.025 + Math.random() * 0.03,
				ph: Math.random() * 6, sw: 0.4 + Math.random() * 0.6, die: now + (up ? 4500 + Math.random() * 2500 : 1e9),
				rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.003, fl: Math.random() * 6, vf: 0.002 + Math.random() * 0.003,
				s: SEASON === 'snow' ? 1.5 + Math.random() * 2 : up ? 1.6 + Math.random() * 1.2 : 5 + Math.random() * 4,
				col: SEASON === 'snow' ? v('--ink-dim') : up || Math.random() < 0.7 ? v('--signal') : v('--ink-faint') });
		}
		pg.setTransform(dpr, 0, 0, dpr, 0, 0); pg.clearRect(0, 0, innerWidth, innerHeight);
		for (let i = petals.length - 1; i >= 0; i--) {
			const p = petals[i];
			p.y += p.vy * dt; p.x += Math.sin(now * 0.0011 + p.ph) * p.sw * dt * 0.03; p.rot += p.vr * dt; p.fl += p.vf * dt;
			if (p.y > innerHeight + 20 || p.y < -20 || now > p.die) { petals.splice(i, 1); continue; }
			pg.save(); pg.translate(p.x, p.y); pg.fillStyle = p.col || '#ce5e32'; pg.beginPath();
			if (SEASON === 'snow' || SEASON === 'hotaru') {
				// snow: a soft dot; hotaru: a dot that pulses and fades out at the end of its life
				pg.globalAlpha = SEASON === 'snow' ? 0.7 : Math.min(1, (p.die - now) / 800) * (0.25 + 0.75 * Math.abs(Math.sin(now * 0.003 + p.ph)));
				pg.arc(0, 0, p.s, 0, Math.PI * 2);
			} else {
				// scaleX by cos(fl) is the tumble
				pg.rotate(p.rot); pg.scale(Math.cos(p.fl), 1); pg.globalAlpha = 0.85;
				if (SEASON === 'momiji') {
					// a maple leaf: five lobes, the middle one longest
					for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? p.s * 0.38 : p.s * (k === 0 ? 1.15 : 0.9); pg.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
					pg.closePath();
				} else {
					// a round ume petal with the small notch at its tip
					pg.moveTo(0, p.s); pg.bezierCurveTo(-p.s * 1.2, p.s * 0.6, -p.s, -p.s, -p.s * 0.2, -p.s * 0.9);
					pg.lineTo(0, -p.s * 0.6); pg.lineTo(p.s * 0.2, -p.s * 0.9); pg.bezierCurveTo(p.s, -p.s, p.s * 1.2, p.s * 0.6, 0, p.s);
				}
			}
			pg.fill(); pg.restore();
		}
		if (live || petals.length) praf = requestAnimationFrame(pstep);
		else pg.clearRect(0, 0, innerWidth, innerHeight);
	}
	function petalsScan() {
		const h = document.querySelector('[data-petals]');
		if (h === hero) return;
		hero = h; heroOn = false; pio.disconnect();
		if (h) pio.observe(h);
	}

	// === ENSŌ === a closed-loop brush circle, heavy where the brush lands and dry where it lifts, left
	// open (330°) as ensō are. A filled shape revealed by a stroked mask circle growing along the same path.
	let enso = null, ensoT = 0, ensoN = 0;
	function ensoSvg(size) {
		const a0 = -100 + Math.random() * 40, R = 36, out = [], inn = [], id = 'it-enso-' + ++ensoN;
		for (let i = 0; i <= 60; i++) {
			const u = i / 60, a = (a0 + u * 330) * Math.PI / 180, r = R + Math.sin(u * 9 + a0) * 0.8;
			const hw = 7 * (0.18 + 0.82 * Math.pow(1 - u, 0.55) * Math.min(1, 0.45 + u * 9)) * (0.9 + 0.2 * Math.random());
			out.push(`${(50 + Math.cos(a) * (r + hw)).toFixed(1)} ${(50 + Math.sin(a) * (r + hw)).toFixed(1)}`);
			inn.unshift(`${(50 + Math.cos(a) * (r - hw)).toFixed(1)} ${(50 + Math.sin(a) * (r - hw)).toFixed(1)}`);
		}
		return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><mask id="${id}"><circle cx="50" cy="50" r="${R}" fill="none" stroke="#fff" stroke-width="22" transform="rotate(${a0} 50 50)"/></mask><path mask="url(#${id})" fill="currentColor" d="M${out.join('L')}L${inn.join('L')}Z"/></svg>`;
	}
	function ensoShow(delay) {
		clearTimeout(ensoT);
		ensoT = setTimeout(() => {
			if (enso) return;
			const box = document.createElement('div');
			box.className = 'it-enso'; box.setAttribute('aria-hidden', 'true');
			box.innerHTML = ensoSvg(64);
			document.body.append(box); enso = box;
			ensoT = setTimeout(ensoHide, 8000); // failsafe: never strand it if a visit never ends
		}, delay);
	}
	function ensoHide() {
		clearTimeout(ensoT);
		const e = enso; enso = null;
		if (e) { e.classList.add('out'); setTimeout(() => e.remove(), 400); }
	}
	// Swup boots after this deferred script; wait for it (about 10s at most), fast loads (<150ms) show nothing
	(function hook(n) {
		if (window.swup?.hooks) { window.swup.hooks.on('visit:start', () => ensoShow(150)); window.swup.hooks.on('visit:end', ensoHide); }
		else if (n < 40) setTimeout(() => hook(n + 1), 250);
	})(0);
	try {
		if (!sessionStorage.getItem('it-enso')) { sessionStorage.setItem('it-enso', '1'); ensoShow(200); setTimeout(ensoHide, 1900); }
	} catch {}

	// === CYCLE === type a phrase, hold it, take it back, type the next. The element's server text is the
	// first phrase, which is what reduced-motion visitors and no-JS readers keep.
	function cycle(el) {
		let words; try { words = JSON.parse(el.dataset.inkCycle); } catch { return; }
		if (!Array.isArray(words) || !words.length) return;
		const t = document.createTextNode(''), caret = document.createElement('span');
		caret.className = 'it-caret';
		el.textContent = ''; el.append(t, caret);
		const wait = (ms) => new Promise((r) => setTimeout(r, ms));
		(async () => {
			for (let i = 0; el.isConnected; i++) {
				const w = words[i % words.length];
				caret.classList.remove('blink');
				for (let k = 1; k <= w.length && el.isConnected; k++) { t.data = w.slice(0, k); await wait(45 + Math.random() * 70); }
				caret.classList.add('blink'); await wait(2400);
				caret.classList.remove('blink');
				while (t.data && el.isConnected) { t.data = t.data.slice(0, -1); await wait(22); }
				await wait(350);
			}
		})();
	}

	// === ON-VIEW MARKS === the footer seal and blockquote rules; only ones still below the fold are
	// held back, so nothing already painted disappears
	const vio = new IntersectionObserver((es) => {
		for (const e of es) if (e.isIntersecting) {
			const el = e.target; vio.unobserve(el);
			if (el.tagName === 'BLOCKQUOTE') el.classList.add('it-q');
			else if (el.dataset.inkFin != null) el.innerHTML = ensoSvg(56);
			else if (el.classList.contains('it-code')) el.classList.add('on');
			else { el.classList.remove('it-wait'); el.classList.add('it-stamp'); }
		}
	}, { rootMargin: '0px 0px -8% 0px' });
	function marks() {
		for (const el of document.querySelectorAll('[data-ink-cycle]')) {
			if (el.dataset.inkDone != null) continue;
			el.dataset.inkDone = ''; cycle(el);
		}
		for (const el of document.querySelectorAll('[data-ink-stamp], [data-ink-fin], .custom-md blockquote:not(.admonition), .custom-md .expressive-code')) {
			if (el.dataset.inkDone != null) continue;
			el.dataset.inkDone = '';
			// the end mark is empty until seen, so it is drawn even when the post is short enough to be on screen
			if (el.dataset.inkFin != null) { el.classList.add('it-fin'); vio.observe(el); continue; }
			if (el.getBoundingClientRect().top < innerHeight) continue;
			// code prints line by line, the first 40 lines staggered (the rest arrive with line 40)
			if (el.classList.contains('expressive-code')) { el.classList.add('it-code'); el.querySelectorAll('.ec-line').forEach((ln, i) => ln.style.setProperty('--i', i)); }
			else if (el.tagName !== 'BLOCKQUOTE') el.classList.add('it-wait');
			vio.observe(el);
		}
	}

	const io = new IntersectionObserver((es) => {
		for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); type(e.target); }
	}, { rootMargin: '0px 0px -6% 0px' });
	function scan() {
		for (const el of document.querySelectorAll(SEL)) {
			if (el.dataset.inkDone != null) continue;
			el.dataset.inkDone = '';
			prep(el); io.observe(el);
		}
		images(); petalsScan(); marks();
	}
	scan(); done();
	// MutationObserver callbacks run before the next paint, so swapped-in headings never flash
	new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
