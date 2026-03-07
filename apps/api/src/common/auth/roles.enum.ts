export enum AppRole {
  EDITOR = 'EDITOR',
  REVIEWER = 'REVIEWER',
  ADMIN = 'ADMIN',
}

export const ROLE_PRIORITY: AppRole[] = [
  AppRole.EDITOR,
  AppRole.REVIEWER,
  AppRole.ADMIN,
];
