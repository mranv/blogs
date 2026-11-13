/**
 * Letters scramble through random glyphs, then settle on the real text.
 * Adapted from Animata "gibberish-text" (MIT, https://github.com/codse/animata).
 * Changes: replays on hover/focus, honours prefers-reduced-motion (renders the plain text),
 * and exposes the real text to screen readers instead of the flickering glyphs.
 */
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\";

function Letter({ letter, run }: { letter: string; run: number }) {
	const [char, setChar] = useState(letter);

	useEffect(() => {
		if (letter === " " || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let left = Math.floor(Math.random() * 10) + 6;
		const id = setInterval(() => {
			left--;
			setChar(left <= 0 ? letter : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
			if (left <= 0) clearInterval(id);
		}, 40);
		return () => clearInterval(id);
	}, [letter, run]);

	return <span className="inline-block min-w-[1ch] text-center">{char === " " ? " " : char}</span>;
}

export default function ScrambleText({ text, className }: { text: string; className?: string }) {
	const [run, setRun] = useState(0);
	const replay = () => setRun((r) => r + 1);

	return (
		<span className={cn("inline-flex font-heading", className)} onMouseEnter={replay} onFocus={replay} tabIndex={-1}>
			<span className="sr-only">{text}</span>
			<span aria-hidden="true" className="inline-flex">
				{text.split("").map((l, i) => (
					<Letter key={`${i}-${l}`} letter={l} run={run} />
				))}
			</span>
		</span>
	);
}
