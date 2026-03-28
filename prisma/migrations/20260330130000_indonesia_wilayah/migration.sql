-- Referensi wilayah Indonesia untuk dropdown alamat (diisi via `npm run db:seed-wilayah`).

CREATE TABLE "IndonesiaProvince" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "IndonesiaProvince_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndonesiaRegency" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "IndonesiaRegency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndonesiaDistrict" (
    "id" TEXT NOT NULL,
    "regencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "IndonesiaDistrict_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IndonesiaRegency_provinceId_idx" ON "IndonesiaRegency"("provinceId");
CREATE INDEX "IndonesiaDistrict_regencyId_idx" ON "IndonesiaDistrict"("regencyId");

ALTER TABLE "IndonesiaRegency" ADD CONSTRAINT "IndonesiaRegency_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "IndonesiaProvince"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndonesiaDistrict" ADD CONSTRAINT "IndonesiaDistrict_regencyId_fkey" FOREIGN KEY ("regencyId") REFERENCES "IndonesiaRegency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
