"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";
import { applicationSchools, contributorIntent, contributorLoginHref } from "@/lib/contributor-intent";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitContributorApplication(formData: FormData) {
  const schoolSlug = value(formData, "school_slug");
  const requestedRole = value(formData, "requested_role");
  const intent = contributorIntent(schoolSlug, requestedRole);
  const { supabase, userId } = await requireActiveMember({ loginPath: contributorLoginHref(intent.returnTo, true) });
  const affiliation = value(formData, "affiliation").slice(0, 160);
  const contactDetail = value(formData, "contact_detail").slice(0, 240);
  const experienceNote = value(formData, "experience_note").slice(0, 1500);

  if (!applicationSchools().some(school => school.slug === schoolSlug) || !["scorekeeper", "coach"].includes(requestedRole) || affiliation.length < 2 || contactDetail.length < 3 || experienceNote.length < 20) {
    redirect("/contributors?message=Please%20complete%20every%20application%20field.");
  }

  const { error } = await supabase.from("contributor_applications").insert({
    applicant_id: userId,
    school_slug: schoolSlug,
    requested_role: requestedRole,
    affiliation,
    contact_detail: contactDetail,
    experience_note: experienceNote,
  });

  if (error?.code === "23505") redirect("/contributors?message=You%20already%20have%20an%20active%20application%20for%20that%20program.");
  if (error) redirect(`/contributors?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/contributors");
  revalidatePath("/internal/contributor-access");
  redirect("/contributors?submitted=true");
}
