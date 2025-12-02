'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type MatrixCell = {
  bidder: string;
  slot: string;
  params: any | null;
};

type Slot = { code: string };

export default function ProfileMatrixPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id as string | undefined);
  const profileId = idParam ? Number(idParam) : NaN;

  const [profileName, setProfileName] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rows, setRows] = useState<
    { bidder: string; cells: Record<string, any | null> }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId || Number.isNaN(profileId)) return;

    async function load() {
      setLoading(true);
      setError(null);

      // 1) get profile name
      const { data: profileData, error: profileError } = await supabase
        .from('config_profiles')
        .select('id, name')
        .eq('id', profileId)
        .single();

      if (profileError) {
        console.error(profileError);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setProfileName(profileData?.name ?? '');

      // 2) get slots for this profile
      const { data: slotsData, error: slotsError } = await supabase
        .from('slot_configs_enriched')
        .select('slot_id, slot_code')
        .eq('profile_id', profileId)
        .order('slot_id', { ascending: true });

      if (slotsError) {
        console.error(slotsError);
        setError(slotsError.message);
        setLoading(false);
        return;
      }

      const slotList: Slot[] = (slotsData ?? []).map((s: any) => ({
        code: s.slot_code,
      }));
      setSlots(slotList);

      // 3) get bidder configs in this profile
      const { data: configsData, error: configsError } = await supabase
        .from('bidder_configs_enriched')
        .select('bidder, slot, params')
        .eq('profile_id', profileId);

      if (configsError) {
        console.error(configsError);
        setError(configsError.message);
        setLoading(false);
        return;
      }

      const matrix: Record<
        string,
        { bidder: string; cells: Record<string, any | null> }
      > = {};

      (configsData ?? []).forEach((row: any) => {
        const bidder = row.bidder as string;
        const slot = row.slot as string | null;
        if (!bidder || !slot) return;

        if (!matrix[bidder]) {
          matrix[bidder] = { bidder, cells: {} };
        }
        matrix[bidder].cells[slot] = row.params ?? null;
      });

      setRows(Object.values(matrix).sort((a, b) => a.bidder.localeCompare(b.bidder)));
      setLoading(false);
    }

    load();
  }, [profileId]);

  if (!profileId || Number.isNaN(profileId)) {
    return (
      <main style={{ padding: 24 }}>
        <p>Invalid profile id</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/profiles">← Back to profiles</Link>
      </div>

      <h1 style={{ fontSize: 26, marginBottom: 4 }}>
        Profile: {profileName || `#${profileId}`}
      </h1>
      <p style={{ marginBottom: 16 }}>
        Matrix view: bidders × slots. Click a bidder name to jump to that
        bidder&apos;s global mappings.
      </p>

      {loading && <p>Loading matrix…</p>}
      {error && <p style={{ color: '#b91c1c' }}>Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th style={{ width: 160 }}>Bidder</th>
              {slots.map((s) => (
                <th key={s.code}>{s.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bidder}>
                <td>
                  <Link href={`/bidders/${row.bidder}`}>{row.bidder}</Link>
                </td>
                {slots.map((s) => {
                  const params = row.cells[s.code];
                  return (
                    <td key={s.code}>
                      {params ? (
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontSize: 12,
                            fontFamily:
                              'Menlo, Monaco, Consolas, monospace',
                          }}
                        >
                          {JSON.stringify(params, null, 2)}
                        </pre>
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={slots.length + 1} style={{ padding: 16 }}>
                  No mappings found for this profile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}