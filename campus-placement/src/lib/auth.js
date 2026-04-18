import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from './db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Attempt actual database login
          const result = await query(
            `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
             FROM users u
             LEFT JOIN tenants t ON u.tenant_id = t.id
             WHERE u.email = $1 AND u.is_active = true`,
            [credentials.email]
          );

          const user = result.rows[0];
          if (user) {
            const isValid = await bcrypt.compare(credentials.password, user.password_hash);
            if (!isValid) throw new Error('Invalid password');
            
            await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
            
            // Fallback for missing tenant_names in DB for demo purposes
            let fallbackTenantName = user.tenant_name;
            if (!fallbackTenantName) {
              if (user.role === 'employer') {
                if (user.email.includes('techcorp')) fallbackTenantName = 'TechCorp Solutions';
                else if (user.email.includes('infosys')) fallbackTenantName = 'Infosys Limited';
                else fallbackTenantName = 'Corporate Partner';
              } else if (user.role === 'college_admin') {
                if (user.email.includes('iitm')) fallbackTenantName = 'IIT Madras';
                else if (user.email.includes('nitt')) fallbackTenantName = 'NIT Trichy';
                else fallbackTenantName = 'College Admin';
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: `${user.first_name} ${user.last_name || ''}`.trim(),
              role: user.role,
              tenantId: user.tenant_id,
              tenantName: fallbackTenantName,
              tenantSlug: user.tenant_slug,
              avatar: user.avatar_url,
            };
          }
        } catch (error) {
          console.error('Authentication error:', error.message);
          // Re-throw the original error so the real cause is visible
          throw new Error(error.message);
        }

        throw new Error('Invalid email or password.');
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSlug = user.tenantSlug;
        token.avatar = user.avatar;
        token.logoUrl = user.avatar; // Aliased for consistency
      }
      if (trigger === 'update' && session?.avatar !== undefined) {
        token.avatar = session.avatar;
        token.logoUrl = session.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.tenantName = token.tenantName;
        session.user.tenantSlug = token.tenantSlug;
        session.user.avatar = token.avatar;
        session.user.logoUrl = token.logoUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default handler;
