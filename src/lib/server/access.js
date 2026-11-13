import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fail } from "./http";

export async function requireUser(scope = "admin", owner = false) {
  const session = await auth();
  if (!session?.user?.id) fail(401, "unauthenticated", "Sign in to continue.");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { contact: { include: { client: true } } },
  });
  if (!user?.active) fail(401, "unauthenticated", "Sign in to continue.");
  if (scope === "admin" && !["owner", "builder"].includes(user.role))
    fail(403, "forbidden", "Team access is required.");
  if (owner && user.role !== "owner")
    fail(403, "forbidden", "Only the owner can perform this action.");
  if (scope !== "admin" && !user.contact)
    fail(403, "forbidden", "This account has no client access.");
  return user;
}
export function requireSigner(user) {
  if (user.contact?.role !== "signer")
    fail(
      403,
      "forbidden",
      "Only the primary account holder can perform this action.",
    );
}
