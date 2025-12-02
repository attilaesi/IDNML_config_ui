'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MainNav from '@/components/MainNav';
import { supabase } from '@/lib/supabaseClient';


type BidderConfigRow = {
  bidder: string;
  geo: string | null;
  device: string | null;
  page_type: string | null;
};

type BidderSummary = {
  bidder: string;
};

export default function BiddersPage() {
  const [rows, setRows] = useState<BidderConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [geoFilter, setGeoFilter] = useState<string>('All');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bidder_configs_enriched')
        .select('bidder, geo, device, page_type');

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    }

    load();
  }, []);

  const geoOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.geo) set.add(r.geo);
    });
    return Array.from(set).sort();
  }, [rows]);

  const deviceOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.device) set.add(r.device);
    });
    return Array.from(set).sort();
  }, [rows]);

  const pageTypeOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.page_type) set.add(r.page_type);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredBidders: BidderSummary[] = useMemo(() => {
    const seen = new Set<string>();

    rows.forEach((r) => {
      if (geoFilter !== 'All' && r.geo !== geoFilter) return;
      if (deviceFilter !== 'All' && r.device !== deviceFilter) return;
      if (pageTypeFilter !== 'All' && r.page_type !== pageTypeFilter) return;

      const code = r.bidder;
      if (!code) return;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!code.toLowerCase().includes(q)) return;
      }

      seen.add(code);
    });

    return Array.from(seen)
      .sort()
      .map((bidder) => ({ bidder }));
  }, [rows, geoFilter, deviceFilter, pageTypeFilter, search]);

  return (
    <main style={{ padding: '24px' }}>
      <MainNav active="bidders" />

      <h1 className="text-3xl font-bold mb-4">Bidders</h1>

      <p className="mb-4 text-gray-700">
        Browse bidders and click a row to see all mappings for that bidder across profiles and
        slots.
      </p>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search bidder code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1 text-sm min-w-[220px]"
        />

        <select
          value={geoFilter}
          onChange={(e) => setGeoFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="All">All geos</option>
          {geoOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="All">All devices</option>
          {deviceOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={pageTypeFilter}
          onChange={(e) => setPageTypeFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="All">All page types</option>
          {pageTypeOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading bidders…</p>}
      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th className="w-56 text-left">Bidder</th>
              <th className="text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredBidders.map((b) => (
              <tr key={b.bidder} className="cursor-pointer">
                <td>
                  <Link href={`/bidders/${encodeURIComponent(b.bidder)}`} className="text-blue-600">
                    {b.bidder}
                  </Link>
                </td>
                <td className="text-gray-500 text-sm">
                  Click to view mappings for this bidder across profiles and slots.
                </td>
              </tr>
            ))}
            {filteredBidders.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center text-gray-500 py-4">
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