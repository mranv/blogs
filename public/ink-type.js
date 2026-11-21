// Ink Type: headings are typed onto the page as they scroll into view, the way /type-garden/ types.
// Each letter strikes in wet signal ink and dries to the heading's own colour, a caret runs ahead of it,
// and a post title ends with the painter's red seal (hanko) carrying its first letter.
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
@keyframes it-stamp{0%{opacity:0;transform:scale(1.8) rotate(-14deg)}60%{opacity:1}}`;
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
			// settle: drop the caret and the letter spans, put the original text back
			setTimeout(() => { caret.remove(); for (const p of el._it) { p.sr.remove(); p.vis.replaceWith(p.node); } el._it = null; }, 1600);
		};
		next();
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
	}
	scan(); done();
	// MutationObserver callbacks run before the next paint, so swapped-in headings never flash
	new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
