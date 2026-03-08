import type { UserPublisherCredentialView, UserSummary } from '@aicp/shared-types';
import { safeFetch } from './core';

export function getCurrentUser() {
  return safeFetch<UserSummary | null>('/v1/users/me', undefined, null);
}

export function getMyPublisherCredentials() {
  return safeFetch<UserPublisherCredentialView[]>('/v1/users/me/publisher-credentials', undefined, []);
}

export function getUsers() {
  return safeFetch<UserSummary[]>('/v1/users', undefined, []);
}
