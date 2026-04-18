'use client';

import { Linkedin, Github, Globe, FolderGit2, Link2 } from 'lucide-react';

const size = 22;

/**
 * Brand-style icons for student profile links (Lucide set — ships with the app, no S3 round-trip).
 */
export function ProfileLinkKindIcon({ kind, className }) {
  const cn = className || '';
  const p = { size, strokeWidth: 1.75, className: cn, 'aria-hidden': true };
  switch (kind) {
    case 'linkedin':
      return <Linkedin {...p} />;
    case 'github':
      return <Github {...p} />;
    case 'website':
      return <Globe {...p} />;
    case 'project':
      return <FolderGit2 {...p} />;
    default:
      return <Link2 {...p} />;
  }
}
