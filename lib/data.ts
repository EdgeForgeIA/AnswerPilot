import { createClient } from "@/lib/supabase/server";
import type { Org } from "@/types/db";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type OrgContext = {
  supabase: SupabaseClient;
  user: User;
  org: Org;
};

/**
 * Resolve the signed-in user and their org, or null if unauthenticated.
 * Used by both Server Components and Route Handlers.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: org } = await supabase
    .from("orgs")
    .select("*")
    .eq("id", membership.org_id)
    .single();
  if (!org) return null;

  return { supabase, user, org: org as Org };
}
