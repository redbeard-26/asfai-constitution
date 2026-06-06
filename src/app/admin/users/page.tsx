import { getAllUsers } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isAdmin, ROLES } from "@/lib/constants";
import { setUserRole } from "@/lib/actions";
import { formatDate, displayName } from "@/lib/format";

export default async function AdminUsersPage() {
  const me = await getSessionUser();
  if (!isAdmin(me?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted">
        Admin access required.
      </div>
    );
  }

  const users = await getAllUsers();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Users &amp; roles
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted">
        Moderators can review edits and moderate comments. Admins can
        additionally manage roles.
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-muted">
            <th
              className="py-2"
              style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
            >
              User
            </th>
            <th
              className="py-2"
              style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
            >
              Joined
            </th>
            <th
              className="py-2"
              style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
            >
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === me!.id;
            return (
              <tr key={u.id} className="border-b border-rule">
                <td className="py-3">
                  <div className="font-bold text-ink">{displayName(u)}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="py-3">
                  {isSelf ? (
                    <span className="border border-panel-border bg-panel px-2 py-1 text-xs text-gold-deep">
                      {u.role} (you)
                    </span>
                  ) : (
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="border border-rule px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button className="rounded border border-rule px-2 py-1 text-xs hover:bg-panel">
                        Save
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
