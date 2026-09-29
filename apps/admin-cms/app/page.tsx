import { dataStore } from "@aegis/database";
import { AdminDashboard } from "@/components/admin-dashboard";
import { notFound } from "next/navigation";

export default async function AdminHomePage() {
  const tenant = await dataStore.getTenantBySlug("arukamed");
  const employees = await dataStore.getAllEmployees("arukamed");

  if (!tenant) {
    notFound();
  }

  return <AdminDashboard initialTenant={tenant as any} initialEmployees={employees as any} />;
}
