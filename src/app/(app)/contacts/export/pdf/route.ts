import { contactsPrintHtml, loadContactsForExport } from "@/lib/contact-export";

export async function GET(request: Request) {
  const rows = await loadContactsForExport(request);
  const autoPrint = new URL(request.url).searchParams.get("print") === "1";
  return new Response(contactsPrintHtml(rows, autoPrint), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
    },
  });
}
