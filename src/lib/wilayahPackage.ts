/**
 * Sumber wilayah dari npm `daftar-wilayah-indonesia` (fallback jika tabel DB kosong/error).
 */
import {
  kabupaten as kabupatenFn,
  kecamatan as kecamatanFn,
  provinsi as provinsiFn,
} from "daftar-wilayah-indonesia";

export type ResolvedWilayah = {
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
};

export function getProvincesFromPackage(): { id: string; name: string }[] {
  return provinsiFn()
    .filter((p) => /^\d{2}$/.test(p.kode) && p.nama)
    .map((p) => ({ id: p.kode, name: p.nama }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function getRegenciesFromPackage(provinceId: string): { id: string; name: string }[] {
  return kabupatenFn(provinceId)
    .filter((k) => /^\d{4}$/.test(k.kode) && k.kode_provinsi === provinceId && k.nama)
    .map((k) => ({ id: k.kode, name: k.nama }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function getDistrictsFromPackage(regencyId: string): { id: string; name: string }[] {
  return kecamatanFn(regencyId)
    .filter((c) => /^\d{7}$/.test(c.kode) && c.kode_kabupaten === regencyId && c.nama)
    .map((c) => ({ id: c.kode, name: c.nama }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

let cachedKecamatan: { kode: string; nama: string; kode_kabupaten: string }[] | null = null;
let cachedRegencyById: Map<string, { nama: string; kode_provinsi: string }> | null = null;
let cachedProvById: Map<string, { nama: string }> | null = null;

function getAllKecamatanValid(): { kode: string; nama: string; kode_kabupaten: string }[] {
  if (!cachedKecamatan) {
    cachedKecamatan = kecamatanFn("")
      .filter((c) => /^\d{7}$/.test(c.kode) && c.kode_kabupaten && c.nama)
      .map((c) => ({ kode: c.kode, nama: c.nama, kode_kabupaten: c.kode_kabupaten }));
  }
  return cachedKecamatan;
}

function getRegencyMap(): Map<string, { nama: string; kode_provinsi: string }> {
  if (!cachedRegencyById) {
    cachedRegencyById = new Map();
    for (const r of kabupatenFn("")) {
      if (/^\d{4}$/.test(r.kode) && r.kode_provinsi && r.nama) {
        cachedRegencyById.set(r.kode, { nama: r.nama, kode_provinsi: r.kode_provinsi });
      }
    }
  }
  return cachedRegencyById;
}

function getProvMap(): Map<string, { nama: string }> {
  if (!cachedProvById) {
    cachedProvById = new Map();
    for (const p of provinsiFn()) {
      if (/^\d{2}$/.test(p.kode) && p.nama) {
        cachedProvById.set(p.kode, { nama: p.nama });
      }
    }
  }
  return cachedProvById;
}

export function resolveDistrictFromPackage(districtId: string): ResolvedWilayah | null {
  if (!/^\d{7}$/.test(districtId)) return null;
  const k = getAllKecamatanValid().find((c) => c.kode === districtId);
  if (!k) return null;
  const r = getRegencyMap().get(k.kode_kabupaten);
  if (!r) return null;
  const p = getProvMap().get(r.kode_provinsi);
  if (!p) return null;
  return { kecamatan: k.nama, kabupaten: r.nama, provinsi: p.nama };
}
