import NextAuth, { DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscriptionTier: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    subscriptionTier?: string;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              subscription: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            subscriptionTier: user.subscription?.tier || 'FREE',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        if ((user as { role?: string }).role) {
          token.role = (user as { role?: string }).role;
        }
      }

      // Update token when session is updated
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.email = session.email;
      }

      // Always resolve subscription tier from DB (not JWT-stale / OAuth-missing).
      // Google/GitHub sign-in never set user.subscriptionTier → was stuck FREE forever,
      const userId = (token.id || user?.id) as string | undefined;
      if (userId) {
        const now = Date.now();
        const last = Number(token.tierCheckedAt || 0);
        const stale = !last || now - last > 60_000; // refresh ≥1/min
        if (user || stale || !token.subscriptionTier) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, role: true },
            });
            // JWT from pre-cutover DB: user id does not exist — force re-auth
            if (!dbUser) {
              token.id = undefined;
              token.subscriptionTier = 'FREE';
              token.role = 'USER';
              token.tierCheckedAt = now;
              return token;
            }
            const sub = await prisma.subscription.findUnique({
              where: { userId },
              select: { tier: true },
            });
            token.subscriptionTier = sub?.tier || 'FREE';
            token.tierCheckedAt = now;
            if (dbUser.role) token.role = dbUser.role;
          } catch (e) {
            console.error('jwt tier refresh failed', e);
            if (!token.subscriptionTier) token.subscriptionTier = 'FREE';
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Stale JWT after DB move — no id means session is unusable
        if (!token.id) {
          session.user.id = '';
        } else {
          session.user.id = token.id as string;
        }
        session.user.role = (token.role as string) || 'USER';
        session.user.subscriptionTier = (token.subscriptionTier as string) || 'FREE';
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      const { SUBSCRIPTION_TIERS } = await import('@/lib/constants/subscription');
      const { ensureCompedProIfEligible } = await import('@/lib/billing/comped');
      const free = SUBSCRIPTION_TIERS.FREE;

      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: null,
          tier: 'FREE',
          status: 'ACTIVE',
          projectLimit: free.projectLimit,
          parcelLimitPerProject: free.parcelLimitPerProject,
          userLimit: free.userLimit,
          storageLimit: free.storageLimit,
        },
      });

      await ensureCompedProIfEligible(user.id, user.email);

      try {
        const { acceptPendingInvitesForEmail } = await import('@/lib/projectAccess');
        if (user.email) await acceptPendingInvitesForEmail(user.email, user.id);
      } catch (e) {
        console.error('accept invites on createUser failed', e);
      }
    },
    async signIn({ user }) {
      if (!user?.id || !user.email) return;
      try {
        const { ensureCompedProIfEligible } = await import('@/lib/billing/comped');
        await ensureCompedProIfEligible(user.id, user.email);
      } catch (e) {
        console.error('comped pro check failed', e);
      }
      try {
        const { acceptPendingInvitesForEmail } = await import('@/lib/projectAccess');
        await acceptPendingInvitesForEmail(user.email, user.id);
      } catch (e) {
        console.error('accept invites on signIn failed', e);
      }
    },
  },
});

