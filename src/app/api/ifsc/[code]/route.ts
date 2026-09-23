import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { lookupIfsc, ifscMatchesBank } from "@/lib/ifsc-lookup";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const bankName = new URL(_req.url).searchParams.get("bank") ?? "";
  const result = await lookupIfsc(code);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  if (bankName && !ifscMatchesBank(result.ifsc, bankName)) {
    return NextResponse.json(
      { error: "This IFSC does not belong to the selected bank." },
      { status: 400 },
    );
  }
  return NextResponse.json(result);
}
