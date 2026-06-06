import { getSessionUser } from "@/lib/session";
import { isModerator } from "@/lib/constants";
import { createDocument } from "@/lib/actions";
import { DocumentForm } from "@/components/DocumentForm";

export default async function NewDocumentPage() {
  const user = await getSessionUser();
  if (!isModerator(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        Moderator access required.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Library</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">New document</h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        Add a reference document. After saving, you can attach it to the theses
        and articles it informs.
      </p>
      <div className="mt-6">
        <DocumentForm action={createDocument} submitLabel="Create document" />
      </div>
    </div>
  );
}
