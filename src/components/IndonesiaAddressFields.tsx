"use client";

import { useCallback, useEffect, useState } from "react";

type Row = { id: string; name: string };

const WILAYAH_FETCH_MS = 20_000;

async function fetchWilayah(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), WILAYAH_FETCH_MS);
  try {
    return await fetch(url, { credentials: "same-origin", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

type Props = {
  districtCode: string;
  onDistrictCodeChange: (code: string) => void;
  addressLine: string;
  onAddressLineChange: (v: string) => void;
  kodePos: string;
  onKodePosChange: (v: string) => void;
  negara: string;
  onNegaraChange: (v: string) => void;
  inputClass: string;
};

export function IndonesiaAddressFields({
  districtCode,
  onDistrictCodeChange,
  addressLine,
  onAddressLineChange,
  kodePos,
  onKodePosChange,
  negara,
  onNegaraChange,
  inputClass,
}: Props) {
  const [provinces, setProvinces] = useState<Row[]>([]);
  const [regencies, setRegencies] = useState<Row[]>([]);
  const [districts, setDistricts] = useState<Row[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [regencyId, setRegencyId] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);

  const selectClass = `${inputClass} broker-native-select min-h-[2.75rem] cursor-pointer`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProv(true);
      setLoadErr("");
      try {
        const res = await fetchWilayah("/api/wilayah/provinces");
        const j = (await res.json()) as { items?: Row[]; error?: string };
        if (!cancelled) {
          if (!res.ok) {
            setLoadErr(j.error ?? `Gagal memuat provinsi (HTTP ${res.status}).`);
            setProvinces([]);
          } else {
            setProvinces(j.items ?? []);
            if ((j.items ?? []).length === 0) {
              setLoadErr(
                j.error ??
                  "Data wilayah kosong. Di server jalankan: npx prisma migrate deploy lalu npm run db:seed-wilayah"
              );
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          const timeout = e instanceof Error && e.name === "AbortError";
          setLoadErr(
            timeout
              ? "Permintaan wilayah habis waktu — cek koneksi atau restart server dev (npm run dev)."
              : "Gagal memuat daftar provinsi (jaringan atau server)."
          );
          setProvinces([]);
        }
      } finally {
        if (!cancelled) setLoadingProv(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRegencies = useCallback(async (pid: string) => {
    if (!pid) {
      setRegencies([]);
      return;
    }
    setLoadingReg(true);
    try {
      const res = await fetchWilayah(
        `/api/wilayah/regencies?provinceId=${encodeURIComponent(pid)}`
      );
      const j = (await res.json()) as { items?: Row[]; error?: string };
      if (!res.ok) {
        setLoadErr(j.error ?? "Gagal memuat kabupaten/kota.");
        setRegencies([]);
        return;
      }
      setLoadErr("");
      setRegencies(j.items ?? []);
    } catch (e) {
      const timeout = e instanceof Error && e.name === "AbortError";
      setLoadErr(timeout ? "Memuat kabupaten/kota habis waktu — coba pilih provinsi lagi." : "Gagal memuat kabupaten/kota.");
      setRegencies([]);
    } finally {
      setLoadingReg(false);
    }
  }, []);

  const loadDistricts = useCallback(async (rid: string) => {
    if (!rid) {
      setDistricts([]);
      return;
    }
    setLoadingDist(true);
    try {
      const res = await fetchWilayah(
        `/api/wilayah/districts?regencyId=${encodeURIComponent(rid)}`
      );
      const j = (await res.json()) as { items?: Row[]; error?: string };
      if (!res.ok) {
        setLoadErr(j.error ?? "Gagal memuat kecamatan.");
        setDistricts([]);
        return;
      }
      setLoadErr("");
      setDistricts(j.items ?? []);
    } catch (e) {
      const timeout = e instanceof Error && e.name === "AbortError";
      setLoadErr(timeout ? "Memuat kecamatan habis waktu — coba pilih kabupaten lagi." : "Gagal memuat kecamatan.");
      setDistricts([]);
    } finally {
      setLoadingDist(false);
    }
  }, []);

  function onProvinceChange(pid: string) {
    setLoadErr("");
    setProvinceId(pid);
    setRegencyId("");
    onDistrictCodeChange("");
    setRegencies([]);
    setDistricts([]);
    void loadRegencies(pid);
  }

  function onRegencyChange(rid: string) {
    setLoadErr("");
    setRegencyId(rid);
    onDistrictCodeChange("");
    setDistricts([]);
    void loadDistricts(rid);
  }

  return (
    <>
      <p className="text-xs font-medium text-broker-accent">Alamat</p>
      {loadErr ? <p className="text-xs text-amber-400/90">{loadErr}</p> : null}

      <div>
        <label className="text-xs text-broker-muted">Jalan / desa / gang</label>
        <input
          className={inputClass}
          value={addressLine}
          onChange={(e) => onAddressLineChange(e.target.value)}
          required
          autoComplete="street-address"
        />
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-broker-muted">Provinsi</label>
          <select
            className={selectClass}
            value={provinceId}
            onChange={(e) => onProvinceChange(e.target.value)}
            required
            disabled={loadingProv}
          >
            <option value="">
              {loadingProv ? "Memuat…" : provinces.length === 0 ? "— Belum ada data provinsi —" : "Pilih provinsi"}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-broker-muted">Kabupaten / kota</label>
          <select
            className={selectClass}
            value={regencyId}
            onChange={(e) => onRegencyChange(e.target.value)}
            required
            disabled={!provinceId || loadingReg || provinces.length === 0}
          >
            <option value="">{loadingReg ? "Memuat…" : provinceId ? "Pilih kabupaten/kota" : "—"}</option>
            {regencies.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-broker-muted">Kecamatan</label>
          <select
            className={selectClass}
            value={districtCode}
            onChange={(e) => onDistrictCodeChange(e.target.value)}
            required
            disabled={!regencyId || loadingDist}
          >
            <option value="">{loadingDist ? "Memuat…" : regencyId ? "Pilih kecamatan" : "—"}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-broker-muted">Kode pos</label>
          <input
            className={inputClass}
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="45111"
            value={kodePos}
            onChange={(e) => onKodePosChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
            required
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Negara</label>
          <input className={inputClass} value={negara} onChange={(e) => onNegaraChange(e.target.value)} required />
        </div>
      </div>
    </>
  );
}
