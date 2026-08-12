import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  return <>{children}</>;
}
