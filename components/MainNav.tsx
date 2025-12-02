'use client';

import Link from 'next/link';

type TopNavProps = {
  active: 'profiles' | 'bidders';
};

export default function MainNav({ active }: TopNavProps) {
  return (
    <nav style={{ marginBottom: '16px' }}>
      {active === 'profiles' ? (
        <>
          <strong>Profiles</strong>
          <span> · </span>
          <Link href="/bidders">Bidders</Link>
        </>
      ) : (
        <>
          <Link href="/profiles">Profiles</Link>
          <span> · </span>
          <strong>Bidders</strong>
        </>
      )}
    </nav>
  );
}