import { getAllUsers } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { isAdmin, ROLES } from "@/lib/constants";
import { setUserRole } from "@/lib/actions";
import { formatDate, displayName } from "@/lib/format";

export default async function AdminUsersPage() {
  const me = await getSessionUser();
  if (!isAdmin(me?.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">
        Admin access required.
      </div>
    );
  }

  const users = await getAllUsers();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Users &amp; roles</h1>
      <p className="mt-2 text-sm text-muted">
        Moderators can review edits and hide comments. Admins can additionally
        manage roles.
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2">User</th>
            <th className="py-2">Joined</th>
            <th className="py-2">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === me!.id;
            return (
              <tr key={u.id} className="border-b border-border">
                <td className="py-3">
                  <div className="font-medium">{displayName(u)}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </td>
                <td className="py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="py-3">
                  {isSelf ? (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {u.role} (you)
                    </span>
                  ) : (
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded border border-border px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button className="rounded border border-border px-2 py-1 text-xs hover:bg-gray-50">
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
