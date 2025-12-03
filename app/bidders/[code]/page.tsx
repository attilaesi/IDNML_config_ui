'use client';

import MainNav from '@/components/MainNav';
import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type RouteParams = { code: string };

type EnrichedRow = {
  bidder_config_id: number;
  bidder: string;
  params: any;
  slot_config_id: number;
  slot: string | null;
  profile_id: number;
  profile_name: string | null;
  geo: string | null;
  device: string | null;
  page_type: string | null;
};

type MatrixCell = {
  slot: string;
  pageType: string;
  paramsJson: string;
};

export default function BidderMatrixPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  // Next 16: params is a Promise in client components, unwrap with use()
  const { code: bidderCode } = use(params);

  const [allRows, setAllRows] = useState<EnrichedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters (we’ll coerce to valid options once data has loaded)
  const [geoFilter, setGeoFilter] = useState<string>('uk');
  const [deviceFilter, setDeviceFilter] = useState<string>('mobile');

  // ------------------------------------------------------------
  // 1. Load ALL mappings for this bidder (no geo/device filters here)
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bidder_configs_enriched')
        .select(
          'bidder_config_id,bidder,params,slot_config_id,slot,profile_id,profile_name,geo,device,page_type',
        )
        .eq('bidder', bidderCode)
        .order('profile_id', { ascending: true })
        .order('slot', { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
        setAllRows([]);
      } else {
        setAllRows(data as EnrichedRow[]);
      }

      setLoading(false);
    }

    load();
  }, [bidderCode]);

  // ------------------------------------------------------------
  // 2. Build available geo/device options from the raw data
  // ------------------------------------------------------------
  const geoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allRows
            .map((r) => (r.geo || '').trim())
            .filter((g) => g.length > 0),
        ),
      ).sort(),
    [allRows],
  );

  const deviceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allRows
            .map((r) => (r.device || '').trim())
            .filter((d) => d.length > 0),
        ),
      ).sort(),
    [allRows],
  );

  // When options change, coerce the current filter values to something valid.
  useEffect(() => {
    if (geoOptions.length > 0) {
      if (!geoOptions.includes(geoFilter)) {
        // Prefer 'uk' if available, else first option
        const preferred =
          geoOptions.includes('uk') ? 'uk' : geoOptions[0];
        setGeoFilter(preferred);
      }
    }
  }, [geoOptions, geoFilter]);

  useEffect(() => {
    if (deviceOptions.length > 0) {
      if (!deviceOptions.includes(deviceFilter)) {
        // Prefer 'mobile' if available, else first option
        const preferred =
          deviceOptions.includes('mobile') ? 'mobile' : deviceOptions[0];
        setDeviceFilter(preferred);
      }
    }
  }, [deviceOptions, deviceFilter]);

  // ------------------------------------------------------------
  // 3. Apply filters in-memory
  // ------------------------------------------------------------
  const filteredRows = useMemo(
    () =>
      allRows.filter((r) => {
        const geoOk = geoFilter ? r.geo === geoFilter : true;
        const deviceOk = deviceFilter ? r.device === deviceFilter : true;
        return geoOk && deviceOk;
      }),
    [allRows, geoFilter, deviceFilter],
  );

  // ------------------------------------------------------------
  // 4. Build slot × page_type matrix
  // ------------------------------------------------------------
  const { slots, pageTypes, matrix } = useMemo(() => {
    const slotSet = new Set<string>();
    const pageTypeSet = new Set<string>();
    const cellMap = new Map<string, MatrixCell>();

    for (const row of filteredRows) {
      const slot = (row.slot || '').trim();
      const pageType = (row.page_type || '').trim();
      if (!slot || !pageType) continue;

      slotSet.add(slot);
      pageTypeSet.add(pageType);

      const key = `${slot}|||${pageType}`;
      const paramsJson = JSON.stringify(row.params, null, 2);

      cellMap.set(key, { slot, pageType, paramsJson });
    }

    const slots = Array.from(slotSet).sort();
    const pageTypes = Array.from(pageTypeSet).sort();

    const matrix: MatrixCell[][] = slots.map((slot) =>
      pageTypes.map((pageType) => {
        const key = `${slot}|||${pageType}`;
        const cell = cellMap.get(key);
        return (
          cell || {
            slot,
            pageType,
            paramsJson: '',
          }
        );
      }),
    );

    return { slots, pageTypes, matrix };
  }, [filteredRows]);

  const hasData = !loading && filteredRows.length > 0;

  // ------------------------------------------------------------
  // 5. Render
  // ------------------------------------------------------------
return (
  <main style={{ padding: '24px' }}>
    <MainNav active="bidders" />

    <h1 className="text-3xl font-bold mb-2">Bidder: {bidderCode}</h1>
    <p className="mb-4 text-gray-700">
      Matrix view: <strong>slots × page types</strong> for this bidder. Each cell shows the params JSON for that context.
    </p>

    <div className="mb-4 flex flex-wrap gap-3 items-center text-sm">
      <span className="font-medium mr-1">Filters:</span>

      <label>
        Geo:{' '}
        <select
          value={geoFilter}
          onChange={(e) => setGeoFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm ml-1"
        >
          {geoOptions.map((geo) => (
            <option key={geo} value={geo}>
              {geo}
            </option>
          ))}
        </select>
      </label>

      <label>
        Device:{' '}
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm ml-1"
        >
          {deviceOptions.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>
      </label>
    </div>

    {/* rest of the matrix table */}
        <p></p>
      {loading && <p>Loading matrix…</p>}
      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>
          Error loading mappings: {error}
        </p>
      )}

      {!loading && !error && !hasData && (
        <p>
          No mappings for this bidder with the current filters.
        </p>
      )}

      {hasData && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Slot ↓ / Page type →</th>
                {pageTypes.map((pt) => (
                  <th key={pt} style={{ minWidth: 160 }}>
                    {pt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, rowIdx) => (
                <tr key={slot}>
                  <td
                    style={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {slot}
                  </td>
                  {matrix[rowIdx].map((cell) => (
                    <td
                      key={`${cell.slot}-${cell.pageType}`}
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    >
                      {cell.paramsJson ? (
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                          }}
                        >
                          {cell.paramsJson}
                        </pre>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}