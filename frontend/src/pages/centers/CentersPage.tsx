import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { createCenter, listCenters, updateCenter } from "@/shared/api/ops";
import { useAuth } from "@/shared/auth/AuthContext";
import {
  C, Ico, Badge, Sidebar, Header, Card, ActionButton,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function asNet(status: string): BadgeV {
  return status === "offline" ? "offline" : "online";
}

function ScreeningCentersScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("centers");
  const { can } = useAuth();
  const isAdmin = can("Administrator");
  const { data: centers, loading, error, reload } = useApiData(listCenters, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", device_id: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const netLabel = (n: BadgeV) => n === "online" ? "Online" : n === "offline" ? "Offline" : "Limited";

  async function onCreate() {
    setSaving(true);
    setFormError(null);
    try {
      await createCenter({
        name: form.name.trim(),
        location: form.location.trim(),
        device_id: form.device_id.trim() || null,
      });
      setForm({ name: "", location: "", device_id: "" });
      setShowForm(false);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNetwork(id: number, current: string) {
    const next = current === "online" ? "offline" : "online";
    try {
      await updateCenter(id, { network_status: next });
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Screening Centers" breadcrumbs={["NetraX", "Centers"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>{centers.length} centers</span>
              {isAdmin && (
                <ActionButton variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>
                  {showForm ? "Cancel" : "Add Center"}
                </ActionButton>
              )}
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {(error || formError) && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error || formError}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading centers…</div>}

          {showForm && isAdmin && (
            <Card title="New center" style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginTop: 8 }}>
                <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Device ID" value={form.device_id} onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <ActionButton variant="primary" disabled={saving || !form.name.trim() || !form.location.trim()} onClick={() => void onCreate()}>
                  {saving ? "Saving…" : "Create"}
                </ActionButton>
              </div>
            </Card>
          )}

          <Card title="Regional Coverage" subtitle="Belagavi–Dharwad screening cluster · live from DB" style={{ marginBottom: 18 }}>
            <div style={{
              height: 160, borderRadius: 14, background: `linear-gradient(135deg, ${C.bg} 0%, ${C.indigoLight} 50%, ${C.slate100} 100%)`,
              border: `1px solid ${C.border}`, position: "relative", overflow: "hidden",
            }}>
              {centers.slice(0, 6).map((c, i) => {
                const spots = [
                  { t: "28%", l: "24%" }, { t: "42%", l: "38%" }, { t: "55%", l: "62%" },
                  { t: "38%", l: "70%" }, { t: "68%", l: "48%" }, { t: "22%", l: "52%" },
                ];
                const p = spots[i] || spots[0];
                const on = c.network_status === "online";
                const short = c.name.replace(/^PHC |^DH /, "");
                return (
                  <div key={c.id} style={{ position: "absolute", top: p.t, left: p.l, transform: "translate(-50%,-50%)", textAlign: "center" }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%", margin: "0 auto 4px",
                      background: on ? C.success : C.slate400,
                      boxShadow: on ? `0 0 0 4px ${C.success}25` : "none",
                    }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap" }}>{short}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {centers.map(c => {
              const net = asNet(c.network_status);
              const limited = c.ophthalmologist_status === "Limited" || c.network_status !== "online";
              return (
                <Card key={c.id} style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.slate500, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <Ico.MapPin /> {c.location}
                      </div>
                    </div>
                    {limited && c.network_status !== "offline" ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 99, background: C.warningLight, color: C.warning }}>Limited Connectivity</span>
                    ) : (
                      <Badge v={net} />
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "Connected Device", v: c.device_id || "—" },
                      { l: "Daily Screenings", v: String(c.daily_volume) },
                      { l: "Image Quality", v: String(c.quality_score) },
                      { l: "Ophthalmologist", v: c.ophthalmologist_status },
                    ].map(f => (
                      <div key={f.l} style={{ padding: 10, borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: C.slate500, textTransform: "uppercase" }}>{f.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginTop: 4 }}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: C.slate400 }}>
                      Network: {limited && c.network_status !== "offline" ? "Limited Connectivity" : netLabel(net)}
                    </div>
                    {isAdmin && (
                      <ActionButton variant="secondary" size="sm" onClick={() => void toggleNetwork(c.id, c.network_status)}>
                        Set {c.network_status === "online" ? "offline" : "online"}
                      </ActionButton>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <ScreeningCentersScreen onNav={onNav} />;
}
