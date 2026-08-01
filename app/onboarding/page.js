import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <main className="wrap" style={{ paddingTop: 44 }}>
      <OnboardingForm initial={user.company} />
    </main>
  );
}
