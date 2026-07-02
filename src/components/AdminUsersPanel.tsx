import { getAllUsers } from "@/lib/data";
import { ROLES } from "@/lib/constants";
import { setUserRole, archiveUser, unarchiveUser } from "@/lib/actions";
import { formatDate, displayName } from "@/lib/format";

/** Admin-only users & roles management, embedded in the moderation page. */
export async function AdminUsersPanel({ meId }: { meId: string }) {
  const users = await getAllUsers();

  return (
    <section className="mt-12">
      <div className="section-rule pt-3">
        <p className="kicker text-xs">Administration</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          Users &amp; roles
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted">
        Moderators can review edits and moderate comments. Admins can
        additionally manage roles and archive users.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-muted">
              {["User", "Joined", "Role", "Status"].map((h) => (
                <th
                  key={h}
                  className="py-2"
                  style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === meId;
              return (
                <tr key={u.id} className={`border-b border-rule ${u.archivedAt ? "opacity-50" : ""}`}>
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
                  <td className="py-3">
                    {isSelf ? (
                      <span className="text-xs text-muted">—</span>
                    ) : u.archivedAt ? (
                      <form action={unarchiveUser} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <span
                          className="border border-con bg-con-bg px-1.5 py-0.5 text-xs text-con-head"
                          style={{ fontVariant: "small-caps", letterSpacing: "0.05em" }}
                        >
                          Archived
                        </span>
                        <button className="text-xs text-gold-deep hover:underline">
                          Unarchive
                        </button>
                      </form>
                    ) : (
                      <form action={archiveUser}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="text-xs text-con-head hover:underline">
                          Archive
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
    </section>
  );
}
