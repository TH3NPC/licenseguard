import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <>
      <h1 className="text-[2rem] mb-1">Welcome back</h1>
      <p className="text-sm text-[var(--color-muted)] mb-7">
        Access your projects and licenses.
      </p>
      <AuthForm mode="login" action={loginAction} />
    </>
  );
}
