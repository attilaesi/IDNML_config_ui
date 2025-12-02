'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Bidder = {
  id: number;
  code: string;
  adapter_name: string | null;
};

export default function BiddersPage() {
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [geoFilter, setGeoFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bidders')
        .select('id, code, adapter_name')
        .order('code');

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setBidders((data ?? []) as Bidder[]);
      setLoading(false);
    }

    load();
  }, []);

  const filtered = bidders.filter((b) => {
    if (search && !b.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // env/geo/device/page_type filters are placeholders for later;
    // keep them here so the UI is wired and we can plug them into
    // enriched views in the next step.
    return true;
  });

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/profiles">Profiles</Link>
        {' · '}
        <span>Bidders</span>
      </div>

      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Bidders</h1>
      <p style={{ marginBottom: 16 }}>
        Browse bidders and click a row to see all mappings for that bidder across profiles and slots.
      </p>

      {/* Filters row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search bidder code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '6px 8px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            minWidth: 200,
          }}
        />

        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
        >
          <option value="all">All environments</option>
          <option value="prod">prod</option>
          <option value="uat">uat</option>
        </select>

        <select
          value={geoFilter}
          onChange={(e) => setGeoFilter(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
        >
          <option value="all">All geos</option>
          <option value="uk">uk</option>
          <option value="us">us</option>
        </select>

        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
        >
          <option value="all">All devices</option>
          <option value="desktop">desktop</option>
          <option value="mobile">mobile</option>
        </select>

        <select
          value={pageTypeFilter}
          onChange={(e) => setPageTypeFilter(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}
        >
          <option value="all">All page types</option>
          <option value="image_article">image_article</option>
          <option value="video_article">video_article</option>
          <option value="blog_article">blog_article</option>
          <option value="index">index</option>
        </select>
      </div>

      {loading && <p>Loading bidders…</p>}
      {error && <p style={{ color: '#b91c1c' }}>Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th style={{ width: 200 }}>Code</th>
              <th>Adapter name</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>
                  <Link href={`/bidders/${b.code}`}>{b.code}</Link>
                </td>
                <td>{b.adapter_name ?? '—'}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 16 }}>
                  No bidders match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}