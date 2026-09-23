import { leadSampleCsv } from "@/lib/lead-import";

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format");
  const csv = leadSampleCsv();
  if (format === "xls" || format === "xlsx") {
    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Leads">
  <Table>${csv
    .trim()
    .split("\n")
    .map(
      (line) =>
        `<Row>${line
          .split(",")
          .map((c) => `<Cell><Data ss:Type="String">${c.replace(/"/g, "")}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("")}
  </Table>
 </Worksheet>
</Workbook>`;
    return new Response(xml, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": 'attachment; filename="leads-sample.xls"',
      },
    });
  }
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads-sample.csv"',
    },
  });
}
