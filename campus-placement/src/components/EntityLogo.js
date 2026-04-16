'use client';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';

// Maps a string name to a deterministic index
function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getGenericLogo(name) {
  const lowerName = (name || 'default').toLowerCase();
  
  // College mappings
  if (lowerName.includes('iit madras') || lowerName.includes('iitm')) return '/logos/IITM.jpg';
  if (lowerName.includes('nit trichy') || lowerName.includes('nitt')) return '/logos/nitt.jpg';
  if (lowerName.includes('bits pilani') || lowerName.includes('bits')) return '/logos/BITS.jpg';

  // Company mappings
  if (lowerName.includes('techcorp') || lowerName.includes('tech corp')) return '/logos/TechCorp.jpg';
  if (lowerName.includes('infosys')) return '/logos/infosys.jpg';

  // Admin / Platform
  if (lowerName.includes('placementhub') || lowerName.includes('admin') || lowerName.includes('super')) return '/logos/superadmin.jpg';
  
  // Generic deterministic fallback — cycles across all logos
  const allLogos = [
    '/logos/IITM.jpg',
    '/logos/nitt.jpg',
    '/logos/BITS.jpg',
    '/logos/TechCorp.jpg',
    '/logos/infosys.jpg',
    '/logos/superadmin.jpg'
  ];
  const hash = getHash(name || 'default');
  return allLogos[hash % allLogos.length];
}

/**
 * EntityLogo — smart logo component for companies and colleges.
 *
 * It uses the newly generated beautiful local generic image assets
 * mathematically assigned based on the entity's name.
 *
 * Props:
 *   name      {string}  Display name 
 *   logoUrl   {string=} Explicit URL if one exists
 *   size      {'xs'|'sm'|'md'|'lg'|'xl'}  Default: 'md'
 *   shape     {'circle'|'rounded'}         Default: 'rounded'
 *   className {string=}
 */
export default function EntityLogo({
  name = '',
  logoUrl = null,
  size = 'md',
  shape = 'rounded',
  className = '',
}) {
  const genericImageFallback = getGenericLogo(name);
  const externalGithubFallback = `https://github.com/identicons/${getHash(name)}.png`;
  const candidates = [logoUrl, genericImageFallback, externalGithubFallback].filter(Boolean);

  const [idx, setIdx] = useState(0);

  const handleError = () => {
    if (idx + 1 < candidates.length) {
      setIdx(idx + 1);
    }
  };

  if (idx >= candidates.length) {
    return (
      <div 
        className={`entity-logo ${className}`}
        style={{
          width: size === 'md' ? 40 : 32, // simplified inline fallback
          height: size === 'md' ? 40 : 32,
          background: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          borderRadius: shape === 'circle' ? '50%' : '8px'
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  const sizeMap = {
    xs: { boxSize: 20, borderRadius: shape === 'circle' ? '50%' : '4px' },
    sm: { boxSize: 32, borderRadius: shape === 'circle' ? '50%' : '6px' },
    md: { boxSize: 40, borderRadius: shape === 'circle' ? '50%' : '8px' },
    lg: { boxSize: 56, borderRadius: shape === 'circle' ? '50%' : '10px' },
    xl: { boxSize: 80, borderRadius: shape === 'circle' ? '50%' : '14px' },
  };
  const { boxSize, borderRadius } = sizeMap[size] || sizeMap.md;

  // We no longer render gradients. We render the generic high-quality logo asset
  return (
    <div
      className={`entity-logo ${className}`}
      style={{
        width: boxSize,
        height: boxSize,
        minWidth: boxSize,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        border: '1px solid var(--border-default)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
      title={name}
    >
      <img
        src={candidates[idx]}
        alt={name}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: size === 'xs' ? 2 : 4,
          display: 'block',
        }}
      />
    </div>
  );
}
