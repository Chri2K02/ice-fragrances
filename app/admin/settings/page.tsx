import { redirect } from "next/navigation";

// /admin/settings is just the section root — Team is its first subroute.
export default function AdminSettingsIndex() {
  redirect("/admin/settings/team");
}
