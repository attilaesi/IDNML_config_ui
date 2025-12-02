'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Row = {
  bidder_config_id: number;
  profile_id: number;
  profile_name: string;
  slot: string | null;
  params: any;
};

export default function BidderDetailPage() {
  const params = useParams();
  const pathname = usePathname();

  const [bidderCode, setBidderCode] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let code: string | null = null;

    // 1) try dynamic route param
    if (params && (params as any).bidder) {
      code = String((params as any).bidder);
    }

    // 2) fallback: last segment of pathname if pattern /bidders/{code}
    if (!code && pathname) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[parts.length - 2] === 'bidders') {
        code = parts[parts.length - 1];
      }
    }

    setBidderCode(code);
  }, [params, pathname]);

  useEffect(() => {
    if (!bidderCode) return;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bidder_configs_enriched')
        .select('bidder_config_id, profile_id, profile_name, slot, params')
        .eq('bidder', bidderCode)
        .order('profile_name', { ascending: true })
        .order('slot', { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as Row[]);
      setLoading(false);
    }

    load();
  }, [bidderCode]);

  if (!bidderCode) {
    return (
      <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/bidders">← Back to bidders</Link>
        </div>
        <p>Loading bidder…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/bidders">← Back to bidders</Link>
        {' · '}
        <Link href="/profiles">Profiles</Link>
      </div>

      <h1 style={{ fontSize: 26, marginBottom: 4 }}>
        Bidder: <span style={{ fontWeight: 700 }}>{bidderCode}</span>
      </h1>
      <p style={{ marginBottom: 16 }}>
        All mappings from <code>bidder_configs_enriched</code> for{' '}
        <strong>{bidderCode}</strong>. Click a profile name to jump into that profile&apos;s
        matrix.
      </p>

      {loading && <p>Loading mappings…</p>}
      {error && <p style={{ color: '#b91c1c' }}>Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Config ID</th>
              <th>Profile</th>
              <th style={{ width: 120 }}>Slot</th>
              <th>Params</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bidder_config_id}>
                <td>{row.bidder_config_id}</td>
                <td>
                  <Link href={`/profiles/${row.profile_id}`}>
                    {row.profile_name}
                  </Link>
                </td>
                <td>{row.slot ?? '—'}</td>
                <td>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontSize: 12,
                      fontFamily: 'Menlo, Monaco, Consolas, monospace',
                    }}
                  >
                    {JSON.stringify(row.params, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 16 }}>
                  This bidder has no mappings yet. Add mappings via a profile matrix.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}