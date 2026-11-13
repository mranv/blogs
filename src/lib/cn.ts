// Class-name merge helper expected by shadcn-style components (Skiper UI, Animata, Vengeance UI).
// tailwind-merge is pinned to 2.x because this site is on Tailwind v3; 3.x targets Tailwind v4.
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
