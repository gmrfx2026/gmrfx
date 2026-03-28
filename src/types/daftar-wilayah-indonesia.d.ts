declare module "daftar-wilayah-indonesia" {
  export function provinsi(): { kode: string; nama: string }[];
  export function kabupaten(kode: string): {
    kode: string;
    kode_provinsi: string;
    nama: string;
  }[];
  export function kecamatan(kode: string): {
    kode: string;
    kode_kabupaten: string;
    nama: string;
  }[];
  export function desa(kode: string): unknown[];
}
