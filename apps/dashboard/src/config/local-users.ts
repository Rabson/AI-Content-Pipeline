export const localSeedUsers = [
  { role: 'ADMIN', email: 'admin@example.com', password: 'AdminPass123!' },
  { role: 'EDITOR', email: 'editor@example.com', password: 'EditorPass123!' },
  { role: 'REVIEWER', email: 'reviewer@example.com', password: 'ReviewerPass123!' },
  { role: 'USER', email: 'normal_user@example.com', password: 'UserPass123!' },
] as const;
