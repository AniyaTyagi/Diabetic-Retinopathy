import { useAppNav } from "@/shared/hooks/useAppNav";
import {
  C, Ico, Badge, Sidebar, Header,
  Card, CardRow, ActionButton, FilterChip, RoleBadge,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  inviteUser,
  listUsers,
  setUserActive,
  updateUserRole,
  type AuthUser,
} from "@/shared/api/auth";
import { ROLES, type Role } from "@/shared/rbac";
import { useAuth } from "@/shared/auth/AuthContext";
import { useCenterOptions } from "@/shared/hooks/useCenterOptions";

function UserManagementScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("users");
  const { user: me } = useAuth();
  const { centers, defaultCenter } = useCenterOptions(me?.center);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({
    full_name: "",
    email: "",
    password: "netrax123",
    role: "Screening Operator" as Role,
    center: "",
  });

  useEffect(() => {
    if (!invite.center && defaultCenter) {
      setInvite(s => ({ ...s, center: defaultCenter }));
    }
  }, [defaultCenter, invite.center]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(
    () => users.filter(u => filter === "All" || u.role === filter),
    [users, filter],
  );

  async function onRoleChange(id: number, role: string) {
    try {
      const updated = await updateUserRole(id, role);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Role update failed");
    }
  }

  async function onToggleActive(u: AuthUser) {
    try {
      const updated = await setUserActive(u.id, !u.is_active);
      setUsers(prev => prev.map(x => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Status update failed");
    }
  }

  async function onInvite() {
    try {
      const created = await inviteUser(invite);
      setUsers(prev => [...prev, created]);
      setInviteOpen(false);
      setInvite({
        full_name: "",
        email: "",
        password: "netrax123",
        role: "Screening Operator",
        center: defaultCenter,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Invite failed");
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          title="Users"
          breadcrumbs={["NetraX", "Users"]}
          actions={
            <ActionButton variant="primary" size="sm" icon={<Ico.Plus />} onClick={() => setInviteOpen(v => !v)}>
              Invite User
            </ActionButton>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {["All", ...ROLES].map(r => (
              <FilterChip key={r} label={r} active={filter === r} onClick={() => setFilter(r)} />
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: 14, padding: "10px 12px", borderRadius: 10,
              background: C.dangerLight, color: C.danger, fontSize: 13, fontWeight: 600,
            }}>{error}</div>
          )}

          {inviteOpen && (
            <Card title="Invite user" style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <input placeholder="Full name" value={invite.full_name} onChange={e => setInvite(s => ({ ...s, full_name: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Email" value={invite.email} onChange={e => setInvite(s => ({ ...s, email: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Temp password" value={invite.password} onChange={e => setInvite(s => ({ ...s, password: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <select value={invite.center} onChange={e => setInvite(s => ({ ...s, center: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white }}>
                  {centers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={invite.role} onChange={e => setInvite(s => ({ ...s, role: e.target.value as Role }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ActionButton variant="primary" onClick={onInvite}>Create account</ActionButton>
              </div>
            </Card>
          )}

          <Card noPadding>
            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.1fr 100px 170px",
              padding: "12px 20px", gap: 8,
            }}>
              {["Name", "Role (assign)", "Center", "Status", "Actions"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 12px 12px" }}>
              {loading && <div style={{ padding: 20, color: C.slate500, fontSize: 13 }}>Loading users…</div>}
              {!loading && filtered.map(u => {
                const status: BadgeV = u.is_active ? "online" : "offline";
                return (
                  <CardRow key={u.id} style={{
                    display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.1fr 100px 170px",
                    padding: "12px 12px", gap: 8, alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, background: C.indigoLight, color: C.indigo,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                      }}>{u.full_name.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                          {u.full_name}{me?.id === u.id ? " (you)" : ""}
                        </div>
                        <div style={{ fontSize: 11, color: C.slate500 }}>{u.email}</div>
                      </div>
                    </div>
                    <div>
                      <select
                        value={u.role}
                        onChange={e => onRoleChange(u.id, e.target.value)}
                        style={{
                          width: "100%", padding: "7px 10px", borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.white, fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <div style={{ marginTop: 4 }}><RoleBadge role={u.role} /></div>
                    </div>
                    <div style={{ fontSize: 12, color: C.slate600 }}>{u.center}</div>
                    <div><Badge v={status} /></div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton
                        variant={u.is_active ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => onToggleActive(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </ActionButton>
                    </div>
                  </CardRow>
                );
              })}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <UserManagementScreen onNav={onNav} />;
}
