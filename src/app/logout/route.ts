import { logoutAction } from "../auth-actions";

export async function POST() {
  await logoutAction();
}
