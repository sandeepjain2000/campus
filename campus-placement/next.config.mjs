import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const gitShort =
  process.env.VERCEL_GIT_COMMIT_SHA && process.env.VERCEL_GIT_COMMIT_SHA.length >= 7
    ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version || '0.1.0',
    NEXT_PUBLIC_APP_GIT_SHA: gitShort,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || '',
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || '',
  },
  // Parent folder also has a package-lock.json; without this, Turbopack picks the wrong
  // workspace root and can crawl huge sibling folders (very slow / appears to hang).
  turbopack: {
    root: __dirname,
  },
  // Helps dev/SSR reliably resolve `next-auth` subpath exports (`next-auth/react`).
  transpilePackages: ['next-auth'],
};

export default nextConfig;
