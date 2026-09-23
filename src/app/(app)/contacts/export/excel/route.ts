import { contactsExcelXml, loadContactsForExport } from "@/lib/contact-export";

function excelFileName() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `Contacts_${dd}-${mm}-${yyyy}.xls`;
}

export async function GET(request: Request) {
  const rows = await loadContactsForExport(request);
  const filename = excelFileName();
  return new Response(contactsExcelXml(rows), {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
