'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type RawProfile = {
  id: number;
  name: string;
};

type Profile = RawProfile & {
  environment: string;
  geo: string;
  device: string;
  page_type: string;
};

function parseProfileName(name: string): {
  environment: string;
  geo: string;
  device: string;
  page_type: string;
} {
  const parts = name.split('|').map((p) => p.trim());
  // expected: publisher | env | geo | device | page_type
  return {
    environment: parts[1] ?? '',
    geo: parts[2] ?? '',
    device: parts[3] ?? '',
    page_type: parts[4] ?? '',
  };
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [envFilter, setEnvFilter] = useState('');
  const [geoFilter, setGeoFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [pageTypeFilter, setPageTypeFilter] = useState('');

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('config_profiles')
        .select('id, name')
        .order('id', { ascending: true });

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped: Profile[] = (data ?? []).map((row) => {
        const { environment, geo, device, page_type } = parseProfileName(
          row.name || '',
        );
        return {
          id: row.id,
          name: row.name,
          environment,
          geo,
          device,
          page_type,
        };
      });

      setProfiles(mapped);
      setLoading(false);
    }

    loadProfiles();
  }, []);

  const envOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.environment))).sort(),
    [profiles],
  );
  const geoOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.geo))).sort(),
    [profiles],
  );
  const deviceOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.device))).sort(),
    [profiles],
  );
  const pageTypeOptions = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.page_type))).sort(),
    [profiles],
  );

  const filteredProfiles = profiles.filter((p) => {
    if (envFilter && p.environment !== envFilter) return false;
    if (geoFilter && p.geo !== geoFilter) return false;
    if (deviceFilter && p.device !== deviceFilter) return false;
    if (pageTypeFilter && p.page_type !== pageTypeFilter) return false;
    return true;
  });

  return (
    <main style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Profiles</h1>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 500 }}>Filters:</span>

        <label style={{ fontSize: 14 }}>
          Env:{' '}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="">All</option>
            {envOptions.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 14 }}>
          Geo:{' '}
          <select
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
          >
            <option value="">All</option>
            {geoOptions.map((geo) => (
              <option key={geo} value={geo}>
                {geo}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 14 }}>
          Device:{' '}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            <option value="">All</option>
            {deviceOptions.map((dev) => (
              <option key={dev} value={dev}>
                {dev}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 14 }}>
          Page type:{' '}
          <select
            value={pageTypeFilter}
            onChange={(e) => setPageTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            {pageTypeOptions.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading profiles…</p>}
      {error && <p style={{ color: '#b91c1c' }}>Error: {error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Profile</th>
              <th style={{ width: 140 }}>Matrix</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>
                  <Link href={`/profiles/${p.id}`}>Open matrix</Link>
                </td>
              </tr>
            ))}
            {filteredProfiles.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 16 }}>
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