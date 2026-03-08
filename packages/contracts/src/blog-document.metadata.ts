import { z } from 'zod';

const nullableString = z.string().nullable();
const uriString = z.string().url();
const uniqueStringArraySchema = z.array(z.string()).refine((values) => new Set(values).size === values.length, {
  message: 'Expected unique string items',
});

export const blogAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: uriString.nullable(),
}).strict();

export const coverImageSchema = z.object({
  url: uriString,
  alt: z.string(),
  caption: nullableString.optional(),
}).strict();

export const seoSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  canonicalUrl: uriString.optional(),
  keywords: uniqueStringArraySchema.optional(),
}).strict();

export const devtoTransformSchema = z.object({
  tags: uniqueStringArraySchema,
  canonicalUrl: uriString.optional(),
}).strict();

export const linkedInTransformSchema = z.object({
  excerpt: z.string(),
}).strict();

export const platformTransformsSchema = z.object({
  devto: devtoTransformSchema.optional(),
  linkedin: linkedInTransformSchema.optional(),
}).strict();
