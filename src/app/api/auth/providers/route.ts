import { isGoogleAuthEnabled } from "~/server/auth/config";

export async function GET() {
  return Response.json({ google: isGoogleAuthEnabled });
}
