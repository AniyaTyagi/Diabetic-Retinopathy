import { useNavigate } from "react-router-dom";
import { useAppNav } from "@/shared/hooks/useAppNav";
import { useActiveScreening } from "@/shared/screening/useActiveScreening";
import { PatientContextBar } from "@/shared/screening/PatientContextBar";
import { screeningPath } from "@/shared/screening/session";
import { uploadScreeningImages } from "@/shared/api/screenings";
import {
  C, Ico, Sidebar, Header,
  Card, ActionButton,
  type NavKey,
} from "@/shared/ui";
import { useEffect, useRef, useState } from "react";

function UploadCard({
  eye,
  file,
  previewUrl,
  active,
  onSelect,
  onPick,
  onClear,
}: {
  eye: "RIGHT EYE" | "LEFT EYE";
  file: File | null;
  previewUrl: string | null;
  active: boolean;
  onSelect: () => void;
  onPick: () => void;
  onClear: () => void;
}) {
  const abbr = eye === "RIGHT EYE" ? "OD" : "OS";
  const uploaded = !!file;

  return (
    <div style={{
      background: C.white, borderRadius: 16, border: `1.5px solid ${active && uploaded ? C.indigo : C.slate200}`,
      overflow: "hidden", transition: "border-color 0.15s",
      boxShadow: active && uploaded ? `0 0 0 3px ${C.indigo}18` : "none",
      cursor: "pointer",
    }} onClick={onSelect}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${C.slate100}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: uploaded ? C.success : C.slate300 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{eye}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{abbr} · Fundus Photography</div>
          </div>
        </div>
        {uploaded && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); onPick(); }} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.slate50, color: C.slate600, cursor: "pointer" }}>Replace</button>
            <button onClick={e => { e.stopPropagation(); onClear(); }} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${C.dangerLight}`, background: C.dangerLight, color: C.danger, cursor: "pointer" }}>
              <Ico.Trash />
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        {uploaded && previewUrl ? (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0, width: 160, height: 160, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.slate200}`, background: C.slate50 }}>
              <img src={previewUrl} alt={`${abbr} fundus`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: C.slate400, fontWeight: 500, marginBottom: 3 }}>FILENAME</div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: C.navy, fontWeight: 600 }}>
                  {file.name}
                </div>
              </div>
              {[
                { label: "EYE", value: abbr },
                { label: "SIZE", value: `${(file.size / (1024 * 1024)).toFixed(2)} MB` },
                { label: "STATUS", value: "Local file selected" },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: 9, color: C.slate400, fontWeight: 600, letterSpacing: "0.08em" }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: C.navy, fontWeight: 500, marginTop: 1 }}>{r.value}</div>
                </div>
              ))}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99,
                background: C.successLight, color: C.success, fontSize: 11, fontWeight: 600,
              }}>
                <Ico.Check /> File ready to upload
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            border: `2px dashed ${C.slate300}`, borderRadius: 12, padding: 32,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            background: C.slate50, cursor: "pointer",
          }}
            onClick={e => { e.stopPropagation(); onPick(); }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.white, border: `1.5px solid ${C.slate200}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.slate400 }}>
              <Ico.Upload />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Upload {eye} image</div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 3 }}>Click to browse · JPG/PNG</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function ImageUploadScreen({ onNav }: { onNav: (k: NavKey) => void }) {
  const navigate = useNavigate();
  const { screeningId, patient, result, error: ctxError } = useActiveScreening();
  const [activeNav] = useState<NavKey>("new-screening");
  const [odFile, setOdFile] = useState<File | null>(null);
  const [osFile, setOsFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const odInput = useRef<HTMLInputElement>(null);
  const osInput = useRef<HTMLInputElement>(null);
  const [activeThumb, setActiveThumb] = useState<"od" | "os" | null>(null);
  const odPreview = useObjectUrl(odFile);
  const osPreview = useObjectUrl(osFile);

  const STEPS = ["Patient Info", "Image Upload", "Quality Check", "AI Analysis", "Results"];
  const bothReady = !!odFile && !!osFile;

  async function continueNext() {
    if (!screeningId) {
      setError("No active screening — start from Patient Info.");
      return;
    }
    if (!odFile || !osFile) {
      setError("Upload both OD and OS fundus images to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uploadScreeningImages(screeningId, { od: odFile, os: osFile });
      navigate(screeningPath("/screening/quality", screeningId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Sidebar active={activeNav} onSelect={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title="Upload Fundus Images" breadcrumbs={["NetraX", "New Screening", "Image Upload"]} />
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, maxWidth: 720 }}>
            {STEPS.map((s, i) => {
              const done = i === 0; const active = i === 1;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                      background: done || active ? C.indigo : C.slate100,
                      color: done || active ? C.white : C.slate400,
                    }}>{done ? <Ico.Check /> : i + 1}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: done || active ? C.navy : C.slate400 }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: done ? C.indigo : C.slate200, margin: "0 10px", borderRadius: 1 }} />}
                </div>
              );
            })}
          </div>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
          {(error || ctxError) && <div style={{ marginBottom: 12, fontSize: 12, color: C.danger }}>{error || ctxError}</div>}
          <PatientContextBar patient={patient} result={result} screeningId={screeningId} badge="processing" pulse />

          <input ref={odInput} type="file" accept="image/*" hidden onChange={e => {
            setOdFile(e.target.files?.[0] || null);
            e.target.value = "";
          }} />
          <input ref={osInput} type="file" accept="image/*" hidden onChange={e => {
            setOsFile(e.target.files?.[0] || null);
            e.target.value = "";
          }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <UploadCard
              eye="RIGHT EYE" file={odFile} previewUrl={odPreview}
              active={activeThumb === "od"}
              onSelect={() => setActiveThumb("od")}
              onPick={() => odInput.current?.click()}
              onClear={() => setOdFile(null)}
            />
            <UploadCard
              eye="LEFT EYE" file={osFile} previewUrl={osPreview}
              active={activeThumb === "os"}
              onSelect={() => setActiveThumb("os")}
              onPick={() => osInput.current?.click()}
              onClear={() => setOsFile(null)}
            />
          </div>

          <Card title="Capture Guidelines" style={{ marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 8 }}>
              {[
                { icon: <Ico.Scan />, title: "Focus Well", desc: "Ensure sharp focus on the optic disc and macula", ok: bothReady },
                { icon: <Ico.Zap />, title: "Proper Illumination", desc: "Even, adequate retinal illumination without glare", ok: bothReady },
                { icon: <Ico.Layers />, title: "Full Field of View", desc: "Capture 45° or wider retinal field centered on disc", ok: bothReady },
                { icon: <Ico.Eye />, title: "Avoid Reflections", desc: "Minimize corneal and lens artefact reflections", ok: bothReady },
              ].map(g => (
                <div key={g.title} style={{
                  padding: 14, borderRadius: 12, background: g.ok ? C.successLight + "80" : C.bg,
                  border: `1px solid ${g.ok ? C.success + "40" : C.borderLight}`,
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: g.ok ? `${C.success}15` : C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: g.ok ? C.success : C.slate500 }}>
                    {g.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: C.slate500, marginTop: 3, lineHeight: 1.5 }}>{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <ActionButton variant="secondary" onClick={() => navigate("/screening/new")}>← Back</ActionButton>
            <ActionButton
              variant="primary"
              onClick={() => void continueNext()}
              disabled={!bothReady || busy || !screeningId}
              icon={<Ico.ArrowR />}
            >
              {busy ? "Uploading…" : "Continue to Quality Check"}
            </ActionButton>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const onNav = useAppNav();
  return <ImageUploadScreen onNav={onNav} />;
}
