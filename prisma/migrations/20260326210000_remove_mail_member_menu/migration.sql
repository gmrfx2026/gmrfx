-- Hapus konfigurasi menu "Surat" (tab mail) setelah fitur internal mail dihapus.
-- Baris sisa bisa menyebabkan inkonsistensi; menu sekarang hanya dari kode + tab yang valid.
DELETE FROM "MemberMenuItem" WHERE "tabKey" = 'mail';
