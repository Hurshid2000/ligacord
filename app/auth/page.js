import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  // Already signed in — no reason to show the form again.
  if (await getSessionUserId()) redirect("/");

  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <AuthForm />
    </main>
  );
}
