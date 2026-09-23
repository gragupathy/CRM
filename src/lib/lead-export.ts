import { prisma } from "@/lib/prisma";
import { requireSession, ownerScope } from "@/lib/session";
import { DEFAULT_LEAD_VIEW, isLeadView } from "@/lib/lead-views";
import { leadViewWhere } from "@/lib/lead-view-query";
import { fullName, labelFor } from "@/lib/utils";
import { LEAD_SOURCES, LEAD_TYPES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";
import { exportHeaders, exportRowValues, type LeadExportRow } from "@/lib/lead-list-columns";

function sourceValue(source: string) {
  if (source === "WEB") return "WEBSITE";
  if (source === "COLD") return "COLD_CALL";
  return source;
}

export async function loadLeadsForExport(request: Request) {
  const session = await requireSession();
  const sp = new URL(request.url).searchParams;
  const view = isLeadView(sp.get("view") ?? "") ? sp.get("view")! : DEFAULT_LEAD_VIEW;
  const q = sp.get("q")?.trim() || undefined;
  const status = sp.get("status") || undefined;
  const where: Prisma.LeadWhereInput = {
    AND: [
      leadViewWhere(view, session),
      ownerScope(session),
      status ? { status } : {},
      q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { company: { contains: q } },
              { email: { contains: q } },
              { mobile: { contains: q } },
            ],
          }
        : {},
    ],
  };
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return leads.map((l): LeadExportRow => ({
    name: fullName(l.firstName, l.lastName),
    email: l.email || "",
    phone: l.mobile || l.phone || "",
    leadType: labelFor(LEAD_TYPES, l.leadType),
    source: labelFor(LEAD_SOURCES, sourceValue(l.source)),
  }));
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function leadsExcelXml(rows: LeadExportRow[]) {
  const all = [exportHeaders(), ...rows.map((r, i) => exportRowValues(r, i))];
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
 <Worksheet ss:Name="Leads">
  <Table>${table}</Table>
 </Worksheet>
</Workbook>`;
}

export function leadsPrintHtml(rows: LeadExportRow[], autoPrint: boolean) {
  const headers = exportHeaders();
  const colCount = headers.length;
  const landscape = colCount > 6;
  const fontSize = colCount >= 12 ? 8 : colCount >= 9 ? 9 : colCount >= 7 ? 11 : 12;
  const pad = colCount >= 9 ? "4px 5px" : "6px 8px";
  const body = rows
    .map((r, i) => {
      const cells = exportRowValues(r, i)
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
  <title>Leads</title>
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
    <table id="leads-export">
      <thead><tr>${head}</tr></thead>
      <tbody>${body || `<tr><td colspan="${colCount}">No leads</td></tr>`}</tbody>
    </table>
  </div>
  <script>
    function fitTable() {
      var table = document.getElementById("leads-export");
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
