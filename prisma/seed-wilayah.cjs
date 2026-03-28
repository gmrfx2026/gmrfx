/**
 * Mengisi IndonesiaProvince / IndonesiaRegency / IndonesiaDistrict.
 * Jalankan: npm run db:seed-wilayah
 */
const { PrismaClient } = require("@prisma/client");
const wilayahPkg = require("daftar-wilayah-indonesia");

const prisma = new PrismaClient();

const CHUNK = 800;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const provs = wilayahPkg.provinsi().filter((p) => /^\d{2}$/.test(p.kode) && p.nama);
  const kabs = wilayahPkg
    .kabupaten("")
    .filter((k) => /^\d{4}$/.test(k.kode) && k.kode_provinsi && k.nama);
  const kecs = wilayahPkg
    .kecamatan("")
    .filter((c) => /^\d{7}$/.test(c.kode) && c.kode_kabupaten && c.nama);

  console.log(`Provinsi: ${provs.length}, Kab/Kota: ${kabs.length}, Kecamatan: ${kecs.length}`);

  await prisma.$transaction(async (tx) => {
    await tx.indonesiaDistrict.deleteMany();
    await tx.indonesiaRegency.deleteMany();
    await tx.indonesiaProvince.deleteMany();
  });

  await prisma.indonesiaProvince.createMany({
    data: provs.map((p) => ({ id: p.kode, name: p.nama })),
  });

  for (const part of chunk(kabs, CHUNK)) {
    await prisma.indonesiaRegency.createMany({
      data: part.map((k) => ({
        id: k.kode,
        provinceId: k.kode_provinsi,
        name: k.nama,
      })),
    });
  }

  for (const part of chunk(kecs, CHUNK)) {
    await prisma.indonesiaDistrict.createMany({
      data: part.map((c) => ({
        id: c.kode,
        regencyId: c.kode_kabupaten,
        name: c.nama,
      })),
    });
  }

  console.log("Selesai mengisi wilayah Indonesia.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
