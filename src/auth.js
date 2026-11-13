import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/brevo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/portal/signin", error: "/portal/signin" },
  providers: [
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST || "localhost",
        port: Number(process.env.SMTP_PORT || 587),
      },
      from: process.env.MAIL_FROM || "noreply@klyvorastudio.com",
      maxAge: 15 * 60,
      async sendVerificationRequest({ identifier, url }) {
        const user = await prisma.user.findUnique({
          where: { email: identifier },
        });
        if (!user?.active) return;
        await sendEmail({
          to: identifier,
          template: "magic",
          params: {
            magic_link: url,
            first_name: user.name || identifier.split("@")[0],
          },
          subject: "Sign in to Klyvora",
          text: `Use this link to sign in to Klyvora. It expires in 15 minutes and can only be used once.\n\n${url}\n\nIf you did not request this, ignore this email.`,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        include: { contact: true },
      });
      return (
        !!existing?.active &&
        (["owner", "builder"].includes(existing.role) || !!existing.contact)
      );
    },
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) return baseUrl + url;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl + "/portal";
    },
  },
  logger: {
    error() {
      console.error("Authentication request failed");
    },
    warn(code) {
      console.warn("Authentication warning", code);
    },
  },
});
