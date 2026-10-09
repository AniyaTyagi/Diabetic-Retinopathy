import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { createDevice, listDevices, updateDevice } from "@/shared/api/ops";
import { useAuth } from "@/shared/auth/AuthContext";
import {
  C, Badge, Sidebar, Header, Card, CardRow, FundusDeviceVisual, ActionButton,
  type NavKey, type BadgeV,
} from "@/shared/ui";
import { useState } from "react";

function asStatus(status: string): BadgeV {
  if (status === "offline") return "offline";
  if (status === "pending") return "pending";
  return "online";
}

function FundusDevicesScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const [activeNav] = useState<NavKey>("devices");
  const [selected, setSelected] = useState(0);
  const { can } = useAuth();
  const isAdmin = can("Administrator");
  const { data: devices, loading, error, reload } = useApiData(listDevices, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ device_id: "", center: "", device_type: "Non-mydriatic 45°" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const d = devices[selected] || devices[0];
  const statusLabel = (s: string) => s === "online" ? "Online" : s === "offline" ? "Offline" : "Maintenance";

  async function onCreate() {
    setSaving(true);
    setFormError(null);
    try {
      await createDevice({
        device_id: form.device_id.trim(),
        center: form.center.trim(),
        device_type: form.device_type.trim(),
        last_sync: "Just now",
      });
      setForm({ device_id: "", center: "", device_type: "Non-mydriatic 45°" });
      setShowForm(false);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: number, status: string) {
    try {
      await updateDevice(id, { status, last_sync: "Just now" });
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Fundus Devices" breadcrumbs={["NetraX", "Devices"]}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.slate500 }}>{devices.length} devices</span>
              {isAdmin && (
                <ActionButton variant="primary" size="sm" onClick={() => setShowForm(v => !v)}>
                  {showForm ? "Cancel" : "Add Device"}
                </ActionButton>
              )}
            </div>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {(error || formError) && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error || formError}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading devices…</div>}

          {showForm && isAdmin && (
            <Card title="New device" style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginTop: 8 }}>
                <input placeholder="Device ID" value={form.device_id} onChange={e => setForm(f => ({ ...f, device_id: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Center" value={form.center} onChange={e => setForm(f => ({ ...f, center: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <input placeholder="Type" value={form.device_type} onChange={e => setForm(f => ({ ...f, device_type: e.target.value }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }} />
                <ActionButton variant="primary" disabled={saving || !form.device_id.trim() || !form.center.trim()} onClick={() => void onCreate()}>
                  {saving ? "Saving…" : "Create"}
                </ActionButton>
              </div>
            </Card>
          )}

          {!d ? (
            <div style={{ fontSize: 13, color: C.slate500 }}>No devices found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
              <Card noPadding>
                <div style={{
                  display: "grid", gridTemplateColumns: "90px 1.2fr 1.1fr 90px 90px 90px 80px",
                  padding: "12px 20px", gap: 8,
                }}>
                  {["Device ID", "Center", "Device Type", "Status", "Last Sync", "Images", "Avg Quality"].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 12px 12px" }}>
                  {devices.map((dev, i) => (
                    <CardRow key={dev.device_id} active={selected === i} onClick={() => setSelected(i)}
                      style={{
                        display: "grid", gridTemplateColumns: "90px 1.2fr 1.1fr 90px 90px 90px 80px",
                        padding: "12px 12px", gap: 8, alignItems: "center",
                      }}>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.indigo }}>{dev.device_id}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{dev.center}</div>
                      <div style={{ fontSize: 12, color: C.slate600 }}>{dev.device_type}</div>
                      <div>
                        {dev.status === "pending"
                          ? <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: C.warningLight, color: C.warning }}>Maintenance</span>
                          : <Badge v={asStatus(dev.status)} />}
                      </div>
                      <div style={{ fontSize: 11, color: C.slate500 }}>{dev.last_sync}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{dev.images_count.toLocaleString()}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: C.success }}>{dev.avg_quality}</div>
                    </CardRow>
                  ))}
                </div>
              </Card>

              <Card title="Device Detail" subtitle={`${d.device_id} · ${statusLabel(d.status)}`} style={{ alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <FundusDeviceVisual size={200} />
                </div>
                {[
                  ["Center", d.center],
                  ["Type", d.device_type],
                  ["Last Sync", d.last_sync],
                  ["Images Captured", d.images_count.toLocaleString()],
                  ["Average Quality", String(d.avg_quality)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 11, color: C.slate500 }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{v}</span>
                  </div>
                ))}
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(d.id, "online")}>Online</ActionButton>
                    <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(d.id, "offline")}>Offline</ActionButton>
                    <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(d.id, "pending")}>Maint.</ActionButton>
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <FundusDevicesScreen onNav={onNav} />;
}
