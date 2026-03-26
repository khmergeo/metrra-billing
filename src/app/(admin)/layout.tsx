import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import AdminLayout from "./AdminLayoutClient";

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  try {
    const payload = await verifyToken(token);

    if (!payload || payload.role !== "ADMIN") {
      redirect("/admin/login");
    }

    return {
      id: payload.userId,
      email: payload.email,
      name: "Admin",
      role: payload.role,
    };
  } catch {
    redirect("/admin/login");
  }
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAdminAuth();

  return (
    <AdminLayout user={user}>
      {children}
    </AdminLayout>
  );
}
