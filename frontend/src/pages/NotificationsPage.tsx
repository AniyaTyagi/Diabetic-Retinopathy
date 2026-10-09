import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useApiData } from "@/shared/hooks/useApiData";
import { listNotifications, markAllNotificationsRead } from "@/shared/api/ops";
import {
  C, Ico, Sidebar, Header, Card, ActionButton, FilterChip,
  type NavKey,
} from "@/shared/ui";
import { useState } from "react";

function noteColor(cat: string) {
  if (cat === "Critical") return C.danger;
  if (cat === "Review Required") return C.warning;
  if (cat === "Reports") return C.indigo;
  if (cat === "System") return C.purple;
  return C.slate500;
}

function noteIcon(cat: string) {
  if (cat === "Critical") return <Ico.Warn />;
  if (cat === "Review Required") return <Ico.Shield />;
  if (cat === "Reports") return <Ico.FileText />;
  if (cat === "System") return <Ico.Zap />;
  return <Ico.Eye />;
}

function NotificationsScreen({ onNav, onOpen }: {
  onNav: (k: NavKey) => void;
  onOpen: (path: string) => void;
}) {
  const [activeNav] = useState<NavKey>("dashboard");
  const [cat, setCat] = useState("All");
  const { data: notes, loading, error, reload } = useApiData(listNotifications, []);

  const filtered = cat === "All" ? notes : notes.filter(n => n.category === cat);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Notifications" breadcrumbs={["NetraX", "Notifications"]}
          actions={
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={async () => {
                await markAllNotificationsRead();
                reload();
              }}
            >
              Mark all read
            </ActionButton>
          }
        />
        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {error && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error}</div>}
          {loading && <div style={{ marginBottom: 12, fontSize: 12, color: C.slate500 }}>Loading…</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {["All", "Critical", "Review Required", "System", "Reports"].map(c => (
              <FilterChip key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 860 }}>
            {filtered.map(n => {
              const color = noteColor(n.category);
              return (
                <Card key={n.id} onClick={() => onOpen(n.path)} style={{
                  padding: 16, display: "flex", gap: 14, borderLeft: `4px solid ${color}`,
                  opacity: n.is_read ? 0.7 : 1,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: `${color}14`, color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{noteIcon(n.category)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: C.slate400 }}>{n.time_label}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.slate600, marginTop: 4, lineHeight: 1.5 }}>{n.detail}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: `${color}14`, color }}>{n.category}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div style={{ fontSize: 13, color: C.slate500 }}>No notifications.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  const navigate = useNavigate();
  return <NotificationsScreen onNav={onNav} onOpen={(path) => navigate(path)} />;
}
