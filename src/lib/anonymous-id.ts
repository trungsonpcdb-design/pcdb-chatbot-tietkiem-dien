import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "evn_chat_anon_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);
  if (existing?.value) return existing.value;

  const newId = randomUUID();
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return newId;
}
