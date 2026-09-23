import { ImportLeadsWizard } from "./import-wizard";

export default async function ImportLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <ImportLeadsWizard error={error} />;
}
