import { z } from 'zod';
import { calloutVariantSchema, listStyleSchema, textFormatSchema } from './blog-document.enums';

const blockId = { id: z.string() };

export const textBlockSchema = z.object({
  ...blockId,
  type: z.literal('text'),
  format: textFormatSchema,
  content: z.string(),
}).strict();

export const codeBlockSchema = z.object({
  ...blockId,
  type: z.literal('code'),
  language: z.string(),
  filename: z.string().optional(),
  content: z.string(),
}).strict();

export const imageBlockSchema = z.object({
  ...blockId,
  type: z.literal('image'),
  url: z.string().url(),
  alt: z.string(),
  caption: z.string().nullable().optional(),
}).strict();

export const listBlockSchema = z.object({
  ...blockId,
  type: z.literal('list'),
  style: listStyleSchema,
  items: z.array(z.string()).min(1),
}).strict();

export const quoteBlockSchema = z.object({
  ...blockId,
  type: z.literal('quote'),
  content: z.string(),
  attribution: z.string().nullable(),
}).strict();

export const tableBlockSchema = z.object({
  ...blockId,
  type: z.literal('table'),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string()).min(1)),
  caption: z.string().nullable().optional(),
}).strict();

export const calloutBlockSchema = z.object({
  ...blockId,
  type: z.literal('callout'),
  variant: calloutVariantSchema,
  title: z.string().nullable().optional(),
  content: z.string(),
}).strict();

export const dividerBlockSchema = z.object({ ...blockId, type: z.literal('divider') }).strict();
export const embedBlockSchema = z.object({
  ...blockId,
  type: z.literal('embed'),
  url: z.string().url(),
  provider: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
}).strict();

export const contentBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  codeBlockSchema,
  imageBlockSchema,
  listBlockSchema,
  quoteBlockSchema,
  tableBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
  embedBlockSchema,
]);
