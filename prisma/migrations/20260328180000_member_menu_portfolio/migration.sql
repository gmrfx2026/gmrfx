-- Menu member: tab Portofolio (href /profil/portfolio di kode). Baris opsional agar admin melihat default di DB.
INSERT INTO "MemberMenuItem" ("id", "tabKey", "label", "sortOrder", "enabled", "updatedAt")
VALUES ('clmembermenuportfolio01', 'portfolio', 'Portofolio', 2, true, NOW())
ON CONFLICT ("tabKey") DO NOTHING;
