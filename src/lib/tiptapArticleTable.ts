import { mergeAttributes } from "@tiptap/core";
import Table from "@tiptap/extension-table";

/**
 * Tabel TipTap tanpa `style` / `colgroup` di HTML tersimpan — aman untuk DOMPurify & tampilan konsisten lewat CSS.
 */
export const ArticleTable = Table.extend({
  renderHTML({ node, HTMLAttributes }) {
    return [
      "table",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "article-table w-full border-collapse text-sm",
      }),
      ["tbody", 0],
    ];
  },
});
