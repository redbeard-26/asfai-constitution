"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { recordMastery, setLearning } from "@/lib/learning";
import { prisma } from "@/lib/prisma";

/** Keep post-action redirects on the learn page (never an open redirect). */
function safeReturn(to: FormDataEntryValue | null): string {
  const s = typeof to === "string" ? to : "";
  return s.startsWith("/learn") ? s : "/learn";
}

/** Mark a concept MASTERED for the signed-in learner. */
export async function markMastered(formData: FormData) {
  const user = await requireUser();
  const topicId = String(formData.get("topicId"));
  const result = await recordMastery(user.id, topicId);
  if (!result) throw new Error("Unknown concept.");
  revalidatePath("/learn");
  redirect(safeReturn(formData.get("returnTo")));
}

/** Mark a concept as in-progress (LEARNING) for the signed-in learner. */
export async function markLearning(formData: FormData) {
  const user = await requireUser();
  const topicId = String(formData.get("topicId"));
  const topic = await setLearning(user.id, topicId);
  if (!topic) throw new Error("Unknown concept.");
  revalidatePath("/learn");
  redirect(safeReturn(formData.get("returnTo")));
}

/** Clear any mastery/learning row for a concept (undo). */
export async function clearMastery(formData: FormData) {
  const user = await requireUser();
  const topicId = String(formData.get("topicId"));
  await prisma.conceptMastery.deleteMany({ where: { userId: user.id, topicId } });
  revalidatePath("/learn");
  redirect(safeReturn(formData.get("returnTo")));
}
