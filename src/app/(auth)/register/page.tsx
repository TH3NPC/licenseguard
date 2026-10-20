import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <>
      <h1 className="text-[2rem] mb-1">Create your account</h1>
      <p className="text-sm text-[var(--color-muted)] mb-7">
        Start protecting your website previews in minutes.
      </p>
      <AuthForm mode="register" action={registerAction} />
    </>
  );
}
