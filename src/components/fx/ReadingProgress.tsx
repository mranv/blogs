/**
 * Reading-progress ring that doubles as "back to top" on post pages.
 * Adapted from Skiper UI "Skiper89 scroll progress" (free tier; attribution required:
 * https://skiper-ui.com, author @gurvinder-singh02). Restyled to our amber tokens,
 * NumberFlow dependency and drag removed.
 *
 * Mounted ONCE in MainGridLayout, outside the swup container: swup swaps <main> on
 * navigation and <main> has entrance transforms that would break `position: fixed`.
 * Because it outlives page swaps, it decides visibility from the live DOM
 * (`#post-container` only exists on post pages) on every scroll tick instead of props.
 */
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useState } from "react";

const RADIUS = 18;

export default function ReadingProgress() {
	const { scrollYProgress } = useScroll();
	const reduce = useReducedMotion();
	const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
	const [percent, setPercent] = useState(0);
	const [visible, setVisible] = useState(false);

	useMotionValueEvent(scrollYProgress, "change", (v) => {
		setPercent(Math.round(Math.min(Math.max(v, 0), 1) * 100));
		setVisible(v > 0.02 && document.getElementById("post-container") !== null);
	});

	return (
		<motion.button
			type="button"
			aria-label={`Back to top (${percent}% read)`}
			onClick={() => window.scroll({ top: 0, behavior: reduce ? "auto" : "smooth" })}
			initial={false}
			animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.85, y: visible ? 0 : 12 }}
			transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
			style={{ pointerEvents: visible ? "auto" : "none" }}
			className="group fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--float-panel-bg)] text-[var(--primary)] shadow-lg backdrop-blur-md transition-shadow hover:shadow-[0_0_22px_-4px_var(--neon-amber)] lg:bottom-6 lg:right-6"
		>
			<svg className="absolute inset-0 m-auto h-12 w-12" viewBox="0 0 48 48" role="presentation">
				<circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="3" fill="none" className="opacity-20" />
				<motion.circle
					cx="24"
					cy="24"
					r={RADIUS}
					stroke="currentColor"
					strokeWidth="3"
					fill="none"
					strokeLinecap="round"
					style={{ pathLength: reduce ? scrollYProgress : smooth, rotate: -90, transformOrigin: "50% 50%" }}
				/>
			</svg>
			<span className="relative font-heading text-[0.7rem] font-bold tabular-nums transition-opacity group-hover:opacity-0">
				{percent}%
			</span>
			<svg
				className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M6 15l6-6 6 6" />
			</svg>
		</motion.button>
	);
}
