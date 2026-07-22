import { redirect } from "next/navigation";
import { createSupabaseServerReadClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServerReadClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/?session=expired");
  }

  return user;
}
