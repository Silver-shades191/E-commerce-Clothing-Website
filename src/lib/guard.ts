import { auth, type Role } from "@/auth";

// Server-side authorization check. Call at the top of every protected server
// action or page. Never rely on hidden UI alone for access control.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireUser();
  if (!roles.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}
