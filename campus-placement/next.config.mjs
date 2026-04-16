import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Parent folder also has a package-lock.json; without this, Turbopack picks the wrong
  // workspace root and can crawl huge sibling folders (very slow / appears to hang).
  turbopack: {
    root: __dirname,
  },
  // Helps dev/SSR reliably resolve `next-auth` subpath exports (`next-auth/react`).
  transpilePackages: ['next-auth'],
};

export default nextConfig;
