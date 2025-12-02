'use client';

import { use, useEffect, useMemo, useState } from 'react';
import MainNav from '@/components/MainNav';
import { supabase } from '@/lib/supabaseClient';


type Profile = {
  id: number;
  name: string | null;
  environment: string | null;
  geo: string | null;
  device: string | null;
  page_type: string | null;
};

type SlotRow = {
  slot_config_id: number;
  slot_code: string;
};

type BidderConfigRow = {
  bidder_config_id: number;
  bidder: string;
  slot_config_id: number | null;
  params: any;
};

type ProfileParams = {
  id: string;
};

export default function ProfileMatrixPage({
  params,
}: {
  params: Promise<ProfileParams>;
}) {
  // unwrap the params Promise
  const { id } = use(params);
  const profileId = Number(id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [configs, setConfigs] = useState<BidderConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId || Number.isNaN(profileId)) {
      setError('Invalid profile id');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      // 1. Profile details
      const { data: profileData, error: profileError } = await supabase
        .from('config_profiles')
        .select(
          `
          id,
          name,
          environments:environments!inner(code),
          geos:geos!inner(code),
          devices:devices!inner(code),
          page_types:page_types!inner(code)
        `,
        )
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          name: profileData.name ?? null,
          environment: profileData.environments?.code ?? null,
          geo: profileData.geos?.code ?? null,
          device: profileData.devices?.code ?? null,
          page_type: profileData.page_types?.code ?? null,
        });
      }

      // 2. Slots for this profile
      const { data: slotData, error: slotError } = await supabase
        .from('slot_configs_enriched')
        .select('slot_config_id, slot_code')
        .eq('profile_id', profileId);

      if (slotError) {
        console.error(slotError);
        setError(slotError.message);
        setLoading(false);
        return;
      }

      const uniqueSlotsMap = new Map<number, SlotRow>();
      (slotData || []).forEach((row: any) => {
        if (!uniqueSlotsMap.has(row.slot_config_id)) {
          uniqueSlotsMap.set(row.slot_config_id, {
            slot_config_id: row.slot_config_id,
            slot_code: row.slot_code,
          });
        }
      });

      setSlots(Array.from(uniqueSlotsMap.values()).sort((a, b) => a.slot_code.localeCompare(b.slot_code)));

      // 3. Bidder configs for this profile
      const { data: cfgData, error: cfgError } = await supabase
        .from('bidder_configs_enriched')
        .select('bidder_config_id, bidder, slot_config_id, params')
        .eq('profile_id', profileId);

      if (cfgError) {
        console.error(cfgError);
        setError(cfgError.message);
        setLoading(false);
        return;
      }

      setConfigs(
        (cfgData || []).map((row: any) => ({
          bidder_config_id: row.bidder_config_id,
          bidder: row.bidder,
          slot_config_id: row.slot_config_id,
          params: row.params ?? null,
        })),
      );

      setLoading(false);
    }

    load();
  }, [profileId]);

  const bidders = useMemo(() => {
    const s = new Set<string>();
    configs.forEach((c) => s.add(c.bidder));
    return Array.from(s).sort();
  }, [configs]);

  const matrix = useMemo(() => {
    const m: Record<string, Record<number, BidderConfigRow | null>> = {};
    bidders.forEach((b) => {
      m[b] = {};
      slots.forEach((s) => (m[b][s.slot_config_id] = null));
    });

    configs.forEach((cfg) => {
      if (!cfg.slot_config_id) return;
      if (!m[cfg.bidder]) m[cfg.bidder] = {};
      m[cfg.bidder][cfg.slot_config_id] = cfg;
    });

    return m;
  }, [bidders, slots, configs]);

  return (
    <main style={{ padding: '24px' }}>

      <MainNav active="profiles" />

      {error && (
        <>
          <h1 className="text-3xl font-bold mb-4">Profile</h1>
          <p className="text-red-600">{error}</p>
        </>
      )}

      {!error && (
        <>
          <h1 className="text-3xl font-bold mb-2">
            Profile:{' '}
            {profile
              ? profile.name || `${profile.environment} | ${profile.geo} | ${profile.device} | ${profile.page_type}`
              : `#${profileId}`}
          </h1>

          {profile && (
            <p className="text-gray-700 mb-4">
              {profile.environment} · {profile.geo} · {profile.device} · {profile.page_type}
            </p>
          )}

          <p className="mb-4 text-gray-700">
            Matrix view: <strong>bidders</strong> × <strong>slots</strong>. Each cell shows the{' '}
            <code>params</code> JSON for that bidder/slot combination.
          </p>
        </>
      )}

      {loading && <p>Loading matrix…</p>}

      {!loading && !error && (
        <>
          {bidders.length === 0 || slots.length === 0 ? (
            <p className="text-gray-500">No bidder mappings found for this profile.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="w-40 text-left">Bidder</th>
                  {slots.map((s) => (
                    <th key={s.slot_config_id} className="text-left">
                      {s.slot_code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bidders.map((bidder) => (
                  <tr key={bidder}>
                    <td className="font-medium">{bidder}</td>
                    {slots.map((s) => {
                      const cfg = matrix[bidder]?.[s.slot_config_id] || null;
                      return (
                        <td key={s.slot_config_id}>
                          {cfg && cfg.params ? (
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(cfg.params, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </main>
  );
}