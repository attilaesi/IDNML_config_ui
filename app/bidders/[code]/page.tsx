'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type BidderRow = {
  slot: string | null;
  page_type: string | null;
  params: any;
  geo: string | null;
  device: string | null;
};

const PAGE_TYPE_ORDER = [
  'image_article',
  'video_article',
  'index',
  'blog_article',
];

export default function BidderMatrixPage() {
  const params = useParams() as { code?: string };
  const bidderCode = params?.code ?? '';

  const [rows, setRows] = useState<BidderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // start empty; we’ll set defaults after data loads
  const [geoFilter, setGeoFilter] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('');

  //
  // Load all mappings for this bidder
  //
  useEffect(() => {
    if (!bidderCode) return;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bidder_configs_enriched')
        .select('slot, page_type, params, geo, device')
        .eq('bidder', bidderCode);

      if (error) {
        console.error(error);
        setError(error.message);
        setRows([]);
      } else {
        setRows((data as BidderRow[]) ?? []);
      }

      setLoading(false);
    }

    load();
  }, [bidderCode]);

  //
  // Build raw option sets
  //
  const rawGeoOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.geo && set.add(r.geo));
    return Array.from(set).sort();
  }, [rows]);

  const rawDeviceOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.device && set.add(r.device));
    return Array.from(set).sort();
  }, [rows]);

  //
  // Once options are known, set sensible defaults:
  //   - geo: 'uk' if present, else first geo
  //   - device: 'mobile' if present, else first device
  //
  useEffect(() => {
    if (!rows.length) return;

    if (!geoFilter) {
      if (rawGeoOptions.includes('uk')) {
        setGeoFilter('uk');
      } else if (rawGeoOptions.length > 0) {
        setGeoFilter(rawGeoOptions[0]);
      }
    }

    if (!deviceFilter) {
      if (rawDeviceOptions.includes('mobile')) {
        setDeviceFilter('mobile');
      } else if (rawDeviceOptions.length > 0) {
        setDeviceFilter(rawDeviceOptions[0]);
      }
    }
  }, [rows, rawGeoOptions, rawDeviceOptions, geoFilter, deviceFilter]);

  //
  // Apply filters (no "All" anymore – must match exactly)
  //
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (geoFilter && r.geo !== geoFilter) return false;
        if (deviceFilter && r.device !== deviceFilter) return false;
        return true;
      }),
    [rows, geoFilter, deviceFilter],
  );

  //
  // Determine column set (page types)
  //
  const pageTypes = useMemo(() => {
    const set = new Set<string>();
    filteredRows.forEach((r) => r.page_type && set.add(r.page_type));
    const found = Array.from(set);

    const ordered: string[] = [];
    PAGE_TYPE_ORDER.forEach((pt) => {
      if (found.includes(pt)) ordered.push(pt);
    });
    found
      .filter((pt) => !PAGE_TYPE_ORDER.includes(pt))
      .sort()
      .forEach((pt) => ordered.push(pt));

    return ordered;
  }, [filteredRows]);

  //
  // Determine row set (slots)
  //
  const slots = useMemo(() => {
    const set = new Set<string>();
    filteredRows.forEach((r) => r.slot && set.add(r.slot));
    return Array.from(set).sort();
  }, [filteredRows]);

  //
  // Build matrix: slot -> page_type -> params
  //
  const matrix = useMemo(() => {
    const map = new Map<string, Map<string, any>>();
    filteredRows.forEach((r) => {
      if (!r.slot || !r.page_type) return;
      if (!map.has(r.slot)) map.set(r.slot, new Map());
      map.get(r.slot)!.set(r.page_type, r.params);
    });
    return map;
  }, [filteredRows]);

  //
  // Render
  //
  if (!bidderCode) {
    return (
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/bidders">← Back to bidders</Link>
        </div>
        <p>Missing bidder code in URL.</p>
      </main>
    );
  }

  const geoReady = !!geoFilter || rawGeoOptions.length === 0;
  const deviceReady = !!deviceFilter || rawDeviceOptions.length === 0;
  const filtersReady = geoReady && deviceReady;

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Navigation */}
      <nav style={{ marginBottom: 12, fontSize: 14 }}>
        <Link href="/bidders">← Back to bidders</Link>
        <span style={{ margin: '0 6px' }}>·</span>
        <Link href="/profiles">Profiles</Link>
      </nav>

      <h1 style={{ fontSize: 26, marginBottom: 4 }}>
        Bidder: <span style={{ fontWeight: 700 }}>{bidderCode}</span>
      </h1>

      <p style={{ marginBottom: 16, fontSize: 14 }}>
        Matrix view grouped by <strong>article type</strong> (columns) and{' '}
        <strong>slot name</strong> (rows).
      </p>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <span style={{ fontWeight: 600 }}>Filters:</span>

        <label>
          Geo:{' '}
          <select
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
          >
            {rawGeoOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label>
          Device:{' '}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            {rawDeviceOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading mappings…</p>}
      {error && (
        <p style={{ color: '#b91c1c', marginBottom: 16 }}>Error: {error}</p>
      )}

      {!loading && !error && !filtersReady && (
        <p>Initialising filters…</p>
      )}

      {!loading && !error && filtersReady && slots.length === 0 && (
        <p>No mappings for the selected filters.</p>
      )}

      {!loading && !error && filtersReady && slots.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Slot</th>
                {pageTypes.map((pt) => (
                  <th key={pt}>{pt}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const rowMap = matrix.get(slot) ?? new Map();

                return (
                  <tr key={slot}>
                    <td style={{ fontWeight: 600 }}>{slot}</td>

                    {pageTypes.map((pt) => {
                      const params = rowMap.get(pt);

                      return (
                        <td
                          key={pt}
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {params ? JSON.stringify(params, null, 2) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}