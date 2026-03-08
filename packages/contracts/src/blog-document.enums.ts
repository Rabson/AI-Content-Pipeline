import { z } from 'zod';

export const BLOG_STATUS_VALUES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const;
export const SECTION_STATUS_VALUES = ['draft', 'needs_revision', 'approved'] as const;
export const TEXT_FORMAT_VALUES = ['markdown', 'plain'] as const;
export const LIST_STYLE_VALUES = ['ordered', 'unordered'] as const;
export const CALLOUT_VARIANT_VALUES = ['info', 'warning', 'success', 'error'] as const;

export const blogStatusSchema = z.enum(BLOG_STATUS_VALUES);
export const sectionStatusSchema = z.enum(SECTION_STATUS_VALUES);
export const textFormatSchema = z.enum(TEXT_FORMAT_VALUES);
export const listStyleSchema = z.enum(LIST_STYLE_VALUES);
export const calloutVariantSchema = z.enum(CALLOUT_VARIANT_VALUES);
