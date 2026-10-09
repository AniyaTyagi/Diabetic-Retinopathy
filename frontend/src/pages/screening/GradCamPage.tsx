import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { useScreeningFlowNav } from "@/shared/screening/useScreeningFlowNav";
import { useAuthImage, screeningImagePath, gradcamImagePath } from "@/shared/hooks/useAuthImage";
import {
  C, Ico, FundusImg, Badge, ConfBar, Sidebar, Header,
  Card, ActionButton,
  type NavKey,
} from "@/shared/ui";
import { useState } from "react";

function AuthPanelImg({
  path,
  size,
  fallbackLabel,
}: {
  path: string | null;
  size: number;
  fallbackLabel: string;
}) {
  const { src, loading } = useAuthImage(path);
  if (src) {
    return (
      <img
        src={src}
        alt={fallbackLabel}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: 12 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, background: "rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: C.slate400, fontSize: 11, textAlign: "center", padding: 12,
    }}>
      {loading ? "Loading…" : fallbackLabel}
    </div>
  );
}

function GradCamExplainScreen({
 onNext, onNav, nextLabel }: { onNext: () => void; onNav: (k: NavKey) => void; nextLabel: string }) {
  const { screeningId, result } = useActiveScreening();
  const [activeNav] = useState<NavKey>("screenings");
  const [eye, setEye] = useState<"od" | "os">("od");
  const conf = result?.explainability?.confidence ?? result?.confidence ?? 0;
  const label = result?.explainability?.label || result?.explainability?.summary || "CNN Grad-CAM";
  const sid = screeningId || "";
  const hasEye = eye === "od" ? result?.has_od_image : result?.has_os_image;
  const gc = result?.explainability?.gradcam?.[eye];
  const gcOk = Boolean(gc && !gc.error);

  const findings = result?.explainability?.regions?.map(r => `${r.id}: ${r.note} (${r.intensity})`)
    || [
      "Highlighted patches contributed most to the predicted DR class",
      "Warm colors = higher gradient-weighted activation",
      "Use alongside clinical exam — not a standalone diagnosis",
    ];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Header
          title="Explainability — Grad-CAM"
          breadcrumbs={["NetraX","Screenings", sid || "—","Grad-CAM"]}
          actions={
            <span style={{
              fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:99,
              background: gcOk ? C.successLight : C.warningLight,
              color: gcOk ? C.success : C.warning,
            }}>{gcOk ? "CNN Grad-CAM" : "Pending / fallback"}</span>
          }
        />
        <main style={{ flex:1, overflowY:"auto", padding:28, background:C.bg }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["od", "os"] as const).map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEye(e)}
                style={{
                  border: `1px solid ${eye === e ? C.indigo : C.border}`, cursor: "pointer",
                  padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: eye === e ? C.indigoLight : C.white, color: eye === e ? C.indigo : C.slate600,
                }}
              >
                {e.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                {[
                  {
                    label: "Original",
                    sub: `Uploaded ${eye.toUpperCase()} fundus`,
                    el: (
                      <AuthPanelImg
                        path={hasEye ? screeningImagePath(sid, eye) : null}
                        size={210}
                        fallbackLabel="No upload"
                      />
                    ),
                  },
                  {
                    label: "Grad-CAM Heatmap",
                    sub: gcOk ? "DINOv2 patch CAM" : "Not generated",
                    el: (
                      <AuthPanelImg
                        path={gcOk ? gradcamImagePath(sid, eye, "heatmap") : null}
                        size={210}
                        fallbackLabel={gc?.error || "Run Analyze"}
                      />
                    ),
                  },
                  {
                    label: "Grad-CAM Overlay",
                    sub: "Heatmap on retina",
                    el: (
                      <AuthPanelImg
                        path={gcOk ? gradcamImagePath(sid, eye, "overlay") : null}
                        size={210}
                        fallbackLabel={gc?.error || "Run Analyze"}
                      />
                    ),
                  },
                ].map(p => (
                  <div key={p.label} style={{ background:C.navy, borderRadius:16, overflow:"hidden", border:`1px solid rgba(255,255,255,0.08)` }}>
                    <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.white }}>{p.label}</div>
                      <div style={{ fontSize:10, color:C.slate400, marginTop:2 }}>{p.sub}</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"center", padding:"20px 12px" }}>
                      {p.el}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:C.navy, borderRadius:16, overflow:"hidden", border:`1px solid rgba(255,255,255,0.08)` }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.white }}>Primary Attention Overlay</div>
                    <div style={{ fontSize:11, color:C.slate400, marginTop:2 }}>{label}</div>
                  </div>
                  <Badge v="completed" />
                </div>
                <div style={{ display:"flex", justifyContent:"center", padding:"28px 20px" }}>
                  <AuthPanelImg
                    path={gcOk ? gradcamImagePath(sid, eye, "overlay") : null}
                    size={320}
                    fallbackLabel={gc?.error || "Analyze to generate Grad-CAM"}
                  />
                </div>
              </div>

              <ActionButton variant="primary" size="lg" style={{ width:"100%" }} onClick={onNext} icon={<Ico.ArrowR />}>
                {nextLabel}
              </ActionButton>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Card title="What is AI focusing on?">
                <div style={{ fontSize:12, color:C.slate600, lineHeight:1.65, marginTop:4 }}>
                  {result?.explainability?.disclaimer
                    || "Grad-CAM uses gradients of the predicted DR class w.r.t. DINOv2 patch tokens."}
                </div>
              </Card>

              <Card title="Heatmap Scale">
                <div style={{
                  height:10, borderRadius:99, marginBottom:8, marginTop:8,
                  background:"linear-gradient(90deg, #1e3a5f 0%, #22c55e 25%, #eab308 55%, #f97316 78%, #dc2626 100%)",
                }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.slate500, fontWeight:600 }}>
                  <span>Low Activation</span><span>High Activation</span>
                </div>
                <div style={{ marginTop:16 }}>
                  <ConfBar value={conf} label="Model Confidence" />
                </div>
              </Card>

              <Card title="Findings">
                <div style={{ display:"flex", flexDirection:"column", gap:0, marginTop:6 }}>
                  {findings.map((t,i) => (
                    <div key={t} style={{
                      display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0",
                      borderBottom: i < findings.length - 1 ? `1px solid ${C.borderLight}` : "none",
                    }}>
                      <div style={{
                        width:20, height:20, borderRadius:6, background:C.successLight,
                        display:"flex", alignItems:"center", justifyContent:"center", color:C.success, flexShrink:0, marginTop:1,
                      }}>
                        <Ico.Check />
                      </div>
                      <div style={{ fontSize:12, color:C.slate700, lineHeight:1.5 }}>{t}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


export default function Page() {
  const onNav = useAppNav();
  const flow = useScreeningFlowNav("/screening/gradcam");
  return <GradCamExplainScreen onNav={onNav} onNext={flow.goNext} nextLabel={flow.buttonLabel} />;
}
