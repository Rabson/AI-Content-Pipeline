import { z } from 'zod';
import { blogStatusSchema, sectionStatusSchema } from './blog-document.enums';
import { contentBlockSchema } from './blog-document.blocks';
import { blogAuthorSchema, coverImageSchema, platformTransformsSchema, seoSchema } from './blog-document.metadata';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatetime = z.string().datetime({ offset: true });
const uniqueTagsSchema = z.array(z.string()).refine((values) => new Set(values).size === values.length, {
  message: 'Expected unique string items',
});

export const blogSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().positive(),
  status: sectionStatusSchema,
  blocks: z.array(contentBlockSchema).min(1),
}).strict();

export const blogDocumentSchema = z.object({
  id: z.string(),
  type: z.literal('blog'),
  title: z.string(),
  subtitle: z.string().optional(),
  summary: z.string(),
  slug: z.string().regex(slugPattern),
  status: blogStatusSchema,
  version: z.number().int().positive(),
  author: blogAuthorSchema.optional(),
  tags: uniqueTagsSchema.optional(),
  category: z.string().optional(),
  readingTimeMinutes: z.number().int().positive().optional(),
  coverImage: coverImageSchema.optional(),
  seo: seoSchema.optional(),
  sections: z.array(blogSectionSchema).min(1),
  platformTransforms: platformTransformsSchema.optional(),
  createdAt: isoDatetime,
  updatedAt: isoDatetime,
}).strict();

export type BlogDocument = z.infer<typeof blogDocumentSchema>;
export type BlogSection = z.infer<typeof blogSectionSchema>;
export type BlogContentBlock = z.infer<typeof contentBlockSchema>;
export type BlogAuthor = z.infer<typeof blogAuthorSchema>;
export type BlogSeo = z.infer<typeof seoSchema>;
export type BlogPlatformTransforms = z.infer<typeof platformTransformsSchema>;
