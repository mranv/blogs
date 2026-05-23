import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		author: z.string().optional().default(""),
		pubDatetime: z.coerce.date().optional(),
		modDatetime: z.coerce.date().optional(),
		published: z.coerce.date().optional(),
		updated: z.coerce.date().optional(),
		draft: z.boolean().optional().default(false),
		featured: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		slug: z.string().optional(),

		/* Aliases used by imported content — map to canonical fields */
		publishDate: z.coerce.date().optional(),
		pubDate: z.coerce.date().optional(),
		categories: z.array(z.string()).optional().default([]),
		heroImage: z.string().optional().default(""),
		excerpt: z.string().optional().default(""),
		series: z.string().optional().default(""),
		authorImage: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
