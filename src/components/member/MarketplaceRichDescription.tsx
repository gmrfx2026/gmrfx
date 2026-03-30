"use client";

import { RichTextEditor } from "@/components/RichTextEditor";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/**
 * Editor deskripsi indikator/EA — sama seperti isi artikel (TipTap + unggah gambar ke /api/member/article-image).
 */
export function MarketplaceRichDescription({ value, onChange, placeholder }: Props) {
  return (
    <RichTextEditor
      value={value && value.trim() ? value : "<p></p>"}
      onChange={onChange}
      placeholder={placeholder ?? "Tulis deskripsi…"}
      mode="member"
      enableArticleImageUpload
    />
  );
}
