import { leadsPrintHtml, loadLeadsForExport } from "@/lib/lead-export";

export async function GET(request: Request) {
  const rows = await loadLeadsForExport(request);
  return new Response(leadsPrintHtml(rows, true), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
    },
  });
}
