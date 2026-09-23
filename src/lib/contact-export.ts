import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { DEFAULT_CONTACT_VIEW, isContactView } from "@/lib/contact-views";
import { contactViewWhere } from "@/lib/contact-view-query";
import { fullName } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import {
  contactExportHeaders,
  contactExportRowValues,
  type ContactExportRow,
} from "@/lib/contact-list-columns";

export async function loadContactsForExport(request: Request) {
  const session = await requireSession();
  const sp = new URL(request.url).searchParams;
  const view = isContactView(sp.get("view") ?? "") ? sp.get("view")! : DEFAULT_CONTACT_VIEW;
  const q = sp.get("q")?.trim() || undefined;
  const where: Prisma.ContactWhereInput = {
    AND: [
      contactViewWhere(view, session),
      ownerScope(session),
      q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { mobile: { contains: q } },
              { phone: { contains: q } },
              { title: { contains: q } },
              { account: { name: { contains: q } } },
            ],
          }
        : {},
    ],
  };
  const contacts = await prisma.contact.findMany({
    where,
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  return contacts.map(
    (c): ContactExportRow => ({
      name: fullName(c.firstName, c.lastName),
      email: c.email || "",
      phone: c.mobile || c.phone || "",
      jobTitle: c.title || "",
      account: c.account?.name || "",
    }),
  );
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contactsExcelXml(rows: ContactExportRow[]) {
  const all = [contactExportHeaders(), ...rows.map((r, i) => contactExportRowValues(r, i))];
  const table = all
    .map(
      (cols) =>
        `<Row>${cols.map((c) => `<Cell><Data ss:Type="String">${xmlEscape(c)}</Data></Cell>`).join("")}</Row>`,
    )
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Contacts">
  <Table>${table}</Table>
 </Worksheet>
</Workbook>`;
}

export function contactsPrintHtml(rows: ContactExportRow[], autoPrint: boolean) {
  const headers = contactExportHeaders();
  const colCount = headers.length;
  const landscape = colCount > 6;
  const fontSize = colCount >= 12 ? 8 : colCount >= 9 ? 9 : colCount >= 7 ? 11 : 12;
  const pad = colCount >= 9 ? "4px 5px" : "6px 8px";
  const body = rows
    .map((r, i) => {
      const cells = contactExportRowValues(r, i)
        .map((c) => `<td>${xmlEscape(c)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  const head = headers.map((h) => `<th>${xmlEscape(h)}</th>`).join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Contacts</title>
  <style>
    @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 12px; }
    .wrap { width: 100%; overflow: visible; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: ${fontSize}px; }
    th, td { border: 1px solid #cbd5e1; padding: ${pad}; text-align: left; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
    th { background: #e0f2fe; font-weight: 700; }
    td:first-child, th:first-child { width: 48px; white-space: nowrap; }
  </style>
</head>
<body>
  <div class="wrap">
    <table id="contacts-export">
      <thead><tr>${head}</tr></thead>
      <tbody>${body || `<tr><td colspan="${colCount}">No contacts</td></tr>`}</tbody>
    </table>
  </div>
  <script>
    function fitTable() {
      var table = document.getElementById("contacts-export");
      if (!table) return;
      var max = document.documentElement.clientWidth - 24;
      var w = table.scrollWidth;
      if (w > max && max > 0) {
        var s = max / w;
        table.style.transformOrigin = "top left";
        table.style.transform = "scale(" + s + ")";
        var wrap = table.parentNode;
        if (wrap) wrap.style.height = (table.getBoundingClientRect().height) + "px";
      }
    }
    window.addEventListener("load", function () {
      fitTable();
      ${autoPrint ? "window.print();" : ""}
    });
    window.addEventListener("resize", fitTable);
  </script>
</body>
</html>`;
}
