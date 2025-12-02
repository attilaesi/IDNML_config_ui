'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MainNav from '@/components/MainNav';
import { supabase } from '@/lib/supabaseClient';


type ProfileRow = {
  id: number;
  name: string;
  environment_id: number | null;
  geo_id: number | null;
  device_id: number | null;
  page_type_id: number | null;
  environment: string | null;
  geo: string | null;
  device: string | null;
  page_type: string | null;
};

export default function ProfilesPage() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [envFilter, setEnvFilter] = useState<string>('All');
  const [geoFilter, setGeoFilter] = useState<string>('All');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('config_profiles')
        .select(
          `
          id,
          name,
          environment_id,
          geo_id,
          device_id,
          page_type_id,
          environments:environments!inner(code),
          geos:geos!inner(code),
          devices:devices!inner(code),
          page_types:page_types!inner(code)
        `,
        );

      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        // Map joined columns into flat fields
        const mapped =
          data?.map((row: any) => ({
            id: row.id,
            name: row.name,
            environment_id: row.environment_id,
            geo_id: row.geo_id,
            device_id: row.device_id,
            page_type_id: row.page_type_id,
            environment: row.environments?.code ?? null,
            geo: row.geos?.code ?? null,
            device: row.devices?.code ?? null,
            page_type: row.page_types?.code ?? null,
          })) ?? [];

        setRows(mapped);
      }

      setLoading(false);
    }

    load();
  }, []);

  const envOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.environment && s.add(r.environment));
    return Array.from(s).sort();
  }, [rows]);

  const geoOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.geo && s.add(r.geo));
    return Array.from(s).sort();
  }, [rows]);

  const deviceOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.device && s.add(r.device));
    return Array.from(s).sort();
  }, [rows]);

  const pageTypeOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.page_type && s.add(r.page_type));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (envFilter !== 'All' && r.environment !== envFilter) return false;
      if (geoFilter !== 'All' && r.geo !== geoFilter) return false;
      if (deviceFilter !== 'All' && r.device !== deviceFilter) return false;
      if (pageTypeFilter !== 'All' && r.page_type !== pageTypeFilter) return false;
      return true;
    });
  }, [rows, envFilter, geoFilter, deviceFilter, pageTypeFilter]);

  return (
    <main style={{ padding: '24px' }}>
      <MainNav active="profiles" />

      <h1 className="text-3xl font-bold mb-4">Profiles</h1>

      <div className="mb-4 flex flex-wrap gap-3 items-center text-sm">
        <span className="font-medium mr-1">Filters:</span>

        <label>
          Env:{' '}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm ml-1"
          >
            <option value="All">All</option>
            {envOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          Geo:{' '}
          <select
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm ml-1"
          >
            <option value="All">All</option>
            {geoOptions.map((v) => (
              <option key={v} value={v}>
                {v}
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
            <option value="All">All</option>
            {deviceOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          Page type:{' '}
          <select
            value={pageTypeFilter}
            onChange={(e) => setPageTypeFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm ml-1"
          >
            <option value="All">All</option>
            {pageTypeOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading profiles…</p>}
      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th className="w-16 text-left">ID</th>
              <th className="text-left">Profile</th>
              <th className="w-40 text-left">Matrix</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  {p.name || `${p.environment} | ${p.geo} | ${p.device} | ${p.page_type}`}
                </td>
                <td>
                  <Link
                    href={`/profiles/${p.id}`}
                    className="text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Open matrix
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-500 py-4">
                  No profiles match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}