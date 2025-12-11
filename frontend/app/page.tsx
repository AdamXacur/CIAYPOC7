import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirigir temporalmente al login hasta que tengamos el dashboard
  redirect("/login");
}