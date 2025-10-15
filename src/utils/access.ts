import type { User, UserRole } from '../services/userService';

const STAFF_ROLES: readonly UserRole[] = ['admin', 'moderator'];

export function isStaff(user?: User | null): boolean {
  if (!user) return false;
  return user.roles.some((role) => STAFF_ROLES.includes(role));
}
