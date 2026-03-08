import { describe, expect, it } from 'vitest';
import { blogDocumentSchema } from './blog-document';

function createValidBlogDocument() {
  return {
    id: 'blog_001',
    type: 'blog',
    status: 'draft',
    version: 3,
    title: 'Understanding OAuth 2.0 and OIDC in Node.js',
    subtitle: 'A practical engineering guide with examples',
    summary: 'Learn the difference between OAuth 2.0 and OpenID Connect with real Node.js examples.',
    slug: 'understanding-oauth-2-0-and-oidc-in-node-js',
    author: { id: 'author_001', name: 'Yogesh Nishad', avatarUrl: null },
    tags: ['nodejs', 'oauth2', 'oidc', 'authentication'],
    category: 'Backend Engineering',
    readingTimeMinutes: 8,
    coverImage: { url: 'https://cdn.example.com/cover/oauth-guide.png', alt: 'OAuth 2.0 and OIDC banner', caption: null },
    seo: {
      metaTitle: 'OAuth 2.0 vs OIDC in Node.js',
      metaDescription: 'A practical guide to OAuth 2.0 and OpenID Connect in Node.js with examples.',
      keywords: ['oauth2', 'oidc', 'nodejs auth'],
      canonicalUrl: 'https://example.com/blog/oauth-2-oidc-nodejs',
    },
    sections: [
      {
        id: 'section_intro',
        title: 'Introduction',
        order: 1,
        status: 'approved',
        blocks: [{ id: 'block_text_1', type: 'text', format: 'markdown', content: 'OAuth 2.0 and OpenID Connect are often confused.' }],
      },
    ],
    platformTransforms: {
      devto: { tags: ['node', 'security', 'webdev'], canonicalUrl: 'https://example.com/blog/oauth-2-oidc-nodejs' },
      linkedin: { excerpt: 'Most developers confuse OAuth 2.0 and OIDC. They should not.' },
    },
    createdAt: '2026-03-07T10:00:00Z',
    updatedAt: '2026-03-07T10:15:00Z',
  };
}

describe('blogDocumentSchema', () => {
  it('accepts a strict blog document payload', () => {
    expect(blogDocumentSchema.parse(createValidBlogDocument()).title).toContain('OAuth 2.0');
  });

  it('rejects a section without status', () => {
    const payload = createValidBlogDocument();
    delete payload.sections[0].status;
    expect(() => blogDocumentSchema.parse(payload)).toThrow();
  });

  it('rejects unknown top-level fields', () => {
    expect(() => blogDocumentSchema.parse({ ...createValidBlogDocument(), unexpected: true })).toThrow();
  });
});
