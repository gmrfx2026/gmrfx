import { test, expect } from "@playwright/test";

test("beranda memuat judul situs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /GMR/i }).first()).toBeVisible();
});

test("halaman cari dapat dibuka", async ({ page }) => {
  await page.goto("/cari");
  await expect(page.getByRole("heading", { name: "Cari" })).toBeVisible();
});
