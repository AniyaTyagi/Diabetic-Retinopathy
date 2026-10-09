import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { C, DR } from "@/shared/tokens";
import { useAuth } from "@/shared/auth/AuthContext";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

// ─── Icons ────────────────────────────────────────────────────────────────────
const SvgIcon = ({ d, size = 18, stroke = "currentColor", sw = 1.75 }: { d: string | string[]; size?: number; stroke?: string; sw?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const Ico = {
  Eye:      () => <SvgIcon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8","M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"]} />,
  Grid:     () => <SvgIcon d={["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"]} />,
  Plus:     () => <SvgIcon d={["M12 5v14","M5 12h14"]} sw={2} size={16} />,
  Users:    () => <SvgIcon d={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]} />,
  FileText: () => <SvgIcon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]} />,
  BarChart: () => <SvgIcon d={["M18 20V10","M12 20V4","M6 20v-6","M2 20h20"]} />,
  Shield:   () => <SvgIcon d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]} />,
  Zap:      () => <SvgIcon d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  Home:     () => <SvgIcon d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]} />,
  Settings: () => <SvgIcon d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]} />,
  Help:     () => <SvgIcon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01"]} />,
  Bell:     () => <SvgIcon d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]} />,
  Search:   () => <SvgIcon d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35"]} />,
  ChevR:    () => <SvgIcon d="M9 18l6-6-6-6" sw={2} size={14} />,
  ChevD:    () => <SvgIcon d="M6 9l6 6 6-6" sw={2} size={14} />,
  Check:    () => <SvgIcon d="M20 6 9 17l-5-5" sw={2.5} size={14} />,
  Warn:     () => <SvgIcon d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]} size={16} />,
  X:        () => <SvgIcon d={["M18 6 6 18","M6 6l12 12"]} sw={2} size={14} />,
  Info:     () => <SvgIcon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 16v-4","M12 8h.01"]} size={16} />,
  Loader:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="spin" style={{ width: 16, height: 16 }}><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>,
  Upload:   () => <SvgIcon d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />,
  Download: () => <SvgIcon d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} size={16} />,
  ZoomIn:   () => <SvgIcon d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35","M11 8v6","M8 11h6"]} size={16} />,
  ZoomOut:  () => <SvgIcon d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35","M8 11h6"]} size={16} />,
  Layers:   () => <SvgIcon d={["M12 2 2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]} />,
  Camera:   () => <SvgIcon d={["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />,
  Activity: () => <SvgIcon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  MapPin:   () => <SvgIcon d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} size={16} />,
  Calendar: () => <SvgIcon d={["M8 2v4","M16 2v4","M3 10h18","M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"]} size={16} />,
  Cpu:      () => <SvgIcon d={["M9 1v3","M15 1v3","M9 20v3","M15 20v3","M1 9h3","M1 15h3","M20 9h3","M20 15h3","M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z","M9 9h6v6H9z"]} />,
  Sparkles: () => <SvgIcon d={["M12 3l1.88 5.76a1 1 0 0 0 .95.69H21l-5.12 3.72a1 1 0 0 0-.36 1.12L17.4 20l-5.4-3.92L6.6 20l1.88-5.71a1 1 0 0 0-.36-1.12L3 9.45h6.17a1 1 0 0 0 .95-.69z"]} />,
  Atom:     () => <SvgIcon d={["M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0","M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z","M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"]} />,
  Refresh:  () => <SvgIcon d={["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0 1 14.85-3.36L23 10","M1 14l4.64 4.36A9 9 0 0 0 20.49 15"]} size={16} />,
  Trash:    () => <SvgIcon d={["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6","M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"]} size={15} />,
  Maximize: () => <SvgIcon d={["M8 3H5a2 2 0 0 0-2 2v3","M21 8V5a2 2 0 0 0-2-2h-3","M3 16v3a2 2 0 0 0 2 2h3","M16 21h3a2 2 0 0 0 2-2v-3"]} size={15} />,
  Scan:     () => <SvgIcon d={["M3 7V5a2 2 0 0 1 2-2h2","M17 3h2a2 2 0 0 1 2 2v2","M21 17v2a2 2 0 0 1-2 2h-2","M7 21H5a2 2 0 0 1-2-2v-2","M7 12h10"]} />,
  ArrowR:   () => <SvgIcon d={["M5 12h14","M12 5l7 7-7 7"]} sw={2} size={16} />,
  Google:   () => (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  Microsoft: () => (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
      <path d="M11.4 11.4H1V1h10.4v10.4z" fill="#F25022"/>
      <path d="M23 11.4H12.6V1H23v10.4z" fill="#7FBA00"/>
      <path d="M11.4 23H1V12.6h10.4V23z" fill="#00A4EF"/>
      <path d="M23 23H12.6V12.6H23V23z" fill="#FFB900"/>
    </svg>
  ),
};

// ─── Fundus Image ─────────────────────────────────────────────────────────────
export type FundusV = "normal"|"mild"|"moderate"|"severe"|"proliferative"|"gradcam"|"vessels"|"poor"|"enhanced";

export interface VesselData { t:string; l:string; w:string; a:string; o:number; }

export const VESSELS: VesselData[] = [
  { t:"49%", l:"56%", w:"31%", a:"0deg",   o:0.70 },
  { t:"49%", l:"25%", w:"31%", a:"8deg",   o:0.60 },
  { t:"43%", l:"42%", w:"25%", a:"-30deg", o:0.55 },
  { t:"57%", l:"42%", w:"27%", a:"28deg",  o:0.55 },
  { t:"36%", l:"53%", w:"18%", a:"-50deg", o:0.45 },
  { t:"64%", l:"53%", w:"18%", a:"46deg",  o:0.45 },
  { t:"49%", l:"56%", w:"20%", a:"-15deg", o:0.40 },
  { t:"49%", l:"56%", w:"20%", a:"18deg",  o:0.40 },
];

export const LESIONS: Record<string, {t:string;l:string;s:number}[]> = {
  moderate: [
    {t:"38%",l:"35%",s:3},{t:"63%",l:"41%",s:2},{t:"45%",l:"27%",s:2},
    {t:"56%",l:"66%",s:2},{t:"31%",l:"58%",s:2},{t:"70%",l:"55%",s:2},
  ],
  severe: [
    {t:"35%",l:"32%",s:4},{t:"61%",l:"38%",s:3},{t:"43%",l:"24%",s:3},
    {t:"53%",l:"68%",s:3},{t:"29%",l:"54%",s:3},{t:"69%",l:"61%",s:3},
    {t:"41%",l:"72%",s:2},{t:"57%",l:"22%",s:2},{t:"74%",l:"42%",s:2},
  ],
  proliferative: [
    {t:"31%",l:"30%",s:5},{t:"63%",l:"36%",s:4},{t:"41%",l:"21%",s:4},
    {t:"51%",l:"70%",s:4},{t:"27%",l:"52%",s:3},{t:"71%",l:"58%",s:3},
    {t:"37%",l:"73%",s:3},{t:"59%",l:"20%",s:3},{t:"49%",l:"79%",s:3},
    {t:"75%",l:"44%",s:2},{t:"24%",l:"66%",s:2},
  ],
};

export function FundusImg({
  variant = "normal", size = 200, className = "", style = {},
  showDisc = true, showMacula = true,
}: {
  variant?: FundusV; size?: number; className?: string; style?: CSSProperties;
  showDisc?: boolean; showMacula?: boolean;
}) {
  const cssClass: Record<FundusV, string> = {
    normal: "fundus-normal", mild: "fundus-mild", moderate: "fundus-moderate",
    severe: "fundus-severe", proliferative: "fundus-proliferative",
    gradcam: "fundus-gradcam", vessels: "fundus-vessels",
    poor: "fundus-poor", enhanced: "fundus-enhanced",
  };
  const lesions = LESIONS[variant] ?? [];
  const discSize = Math.round(size * 0.135);
  const maculaSize = Math.round(size * 0.075);

  return (
    <div
      className={`${cssClass[variant]} ${className}`}
      style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, ...style }}
    >
      {/* Optic disc */}
      {showDisc && (
        <div style={{
          position:"absolute", top:"47%", left:"56%",
          width: discSize, height: Math.round(discSize * 0.88),
          background: variant === "vessels"
            ? "radial-gradient(ellipse, rgba(255,200,80,0.9) 20%, rgba(220,140,30,0.7) 60%, transparent 100%)"
            : "radial-gradient(ellipse, #ffc870 20%, #d88020 62%, #a85010 100%)",
          borderRadius:"50%",
          boxShadow: variant === "vessels" ? "0 0 10px 3px rgba(255,200,60,0.4)" : "0 0 8px 2px rgba(220,170,50,0.35)",
          transform:"translate(-50%,-50%)",
        }} />
      )}
      {/* Macula */}
      {showMacula && variant !== "vessels" && (
        <div style={{
          position:"absolute", top:"50%", left:"37%",
          width: maculaSize, height: maculaSize,
          background:"radial-gradient(ellipse, rgba(40,8,0,0.75) 25%, transparent 100%)",
          borderRadius:"50%", transform:"translate(-50%,-50%)",
        }} />
      )}
      {/* Blood vessels */}
      {VESSELS.map((v,i) => (
        <div key={i} className="vsl" style={{
          top:v.t, left:v.l, width:v.w, height:"1.5px",
          transform:`rotate(${v.a})`, opacity:v.o,
        }} />
      ))}
      {/* Lesions */}
      {lesions.map((l,i) => (
        <div key={i} style={{
          position:"absolute", top:l.t, left:l.l,
          width: l.s * 2.4, height: l.s * 2.4,
          background:"rgba(160,18,18,0.82)",
          borderRadius:"50%", transform:"translate(-50%,-50%)",
          boxShadow:"0 0 3px rgba(160,18,18,0.5)",
        }} />
      ))}
      {/* Grad-CAM heatmap overlay */}
      {variant === "gradcam" && (
        <>
          <div style={{ position:"absolute", top:"44%", left:"40%", width:"42%", height:"38%",
            background:"radial-gradient(ellipse, rgba(255,50,0,0.58) 0%, rgba(255,150,0,0.38) 42%, rgba(255,220,0,0.15) 72%, transparent 100%)",
            borderRadius:"50%", transform:"translate(-50%,-50%)" }} />
          <div style={{ position:"absolute", top:"56%", left:"62%", width:"28%", height:"25%",
            background:"radial-gradient(ellipse, rgba(255,80,0,0.48) 0%, rgba(255,180,0,0.22) 56%, transparent 100%)",
            borderRadius:"50%", transform:"translate(-50%,-50%)" }} />
        </>
      )}
      {/* Neovascularization marker for PDR */}
      {variant === "proliferative" && (
        <div style={{ position:"absolute", top:"42%", left:"58%",
          fontSize:10, color:"rgba(255,200,100,0.85)", fontFamily:"monospace",
          fontWeight:700, letterSpacing:1, transform:"translate(-50%,-50%)" }}>NV</div>
      )}
      {/* Poor quality fog */}
      {variant === "poor" && (
        <div style={{ position:"absolute", inset:0, background:"rgba(60,32,8,0.22)",
          backdropFilter:"blur(1.2px)", borderRadius:"50%" }} />
      )}
      {/* Vessel-only: pale overlay for contrast */}
      {variant === "vessels" && (
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse at 55% 50%, rgba(140,50,10,0.28) 0%, transparent 70%)" }} />
      )}
      {/* Subtle circular border highlight */}
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 0 1.5px rgba(255,255,255,0.07)" }} />
    </div>
  );
}

// ─── NetraX Logo ──────────────────────────────────────────────────────────────
export function NetraXLogo({ size = "md", dark = false }: { size?: "sm"|"md"|"lg"; dark?: boolean }) {
  const s = { sm:{ icon:26, text:15, sub:9 }, md:{ icon:32, text:20, sub:10 }, lg:{ icon:40, text:26, sub:12 } }[size];
  return (
    <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
      <div style={{
        width: s.icon, height: s.icon, borderRadius: 10,
        background: C.indigo, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        boxShadow: `0 4px 12px rgba(97,41,199,0.35)`,
      }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: s.icon * 0.62, height: s.icon * 0.62 }}>
          <ellipse cx="12" cy="12" rx="10" ry="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"/>
          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="rgba(255,255,255,0.2)" stroke="none"/>
          <circle cx="12" cy="12" r="3.8" fill="rgba(255,255,255,0.95)"/>
          <circle cx="12" cy="12" r="2" fill={C.indigo}/>
          <circle cx="10.8" cy="10.8" r="0.7" fill="rgba(255,255,255,0.95)"/>
        </svg>
      </div>
      <div>
        <div style={{ fontWeight:800, fontSize: s.text, color: dark ? C.white : C.textPrimary, letterSpacing:-0.3, lineHeight:1.15 }}>NetraX</div>
        <div style={{ fontSize: s.sub, color: dark ? "rgba(255,255,255,0.7)" : C.slate500, fontWeight:500, lineHeight:1.2, marginTop:1 }}>Explainable AI for DR Screening</div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export type BadgeV = "normal"|"mild"|"moderate"|"referable"|"severe"|"pdr"|"ungradeable"|"processing"|"completed"|"pending"|"error"|"online"|"offline";
export const BADGES: Record<BadgeV,{bg:string;text:string;dot:string;label:string}> = {
  normal:      {bg:"#E8F7F0",text:"#15803D",dot:"#1AA16B",label:"Normal"},
  mild:        {bg:"#ECFCCB",text:"#4D7C0F",dot:"#65A30D",label:"Mild NPDR"},
  moderate:    {bg:"#FEF4EB",text:"#B45309",dot:"#F57A0F",label:"Moderate NPDR"},
  referable:   {bg:"#FEF4EB",text:"#B45309",dot:"#F57A0F",label:"Referable: Yes"},
  severe:      {bg:"#FEE2D5",text:"#C2410C",dot:"#EA580C",label:"Severe NPDR"},
  pdr:         {bg:"#FDECED",text:"#B91C1C",dot:"#E83340",label:"Proliferative DR"},
  ungradeable: {bg:"#EEF3F8",text:"#475569",dot:"#94A3B8",label:"Ungradeable"},
  processing:  {bg:"#F3EFFC",text:"#6129C7",dot:"#6129C7",label:"In progress"},
  completed:   {bg:"#E8F7F0",text:"#15803D",dot:"#1AA16B",label:"Completed"},
  pending:     {bg:"#FEF4EB",text:"#B45309",dot:"#F57A0F",label:"Awaiting review"},
  error:       {bg:"#FDECED",text:"#B91C1C",dot:"#E83340",label:"Action required"},
  online:      {bg:"#E8F7F0",text:"#15803D",dot:"#1AA16B",label:"Online"},
  offline:     {bg:"#EEF3F8",text:"#475569",dot:"#94A3B8",label:"Offline"},
};

export function Badge({ v, pulse }: { v: BadgeV; pulse?: boolean }) {
  const s = BADGES[v];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 10px", borderRadius:99,
      background:s.bg, color:s.text,
      fontSize:11, fontWeight:600, lineHeight:1.5, flexShrink:0,
    }}>
      <span style={{ position:"relative", display:"flex", flexShrink:0 }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, display:"block" }} />
        {pulse && <span className="pulse-dot" style={{ position:"absolute", inset:0, borderRadius:"50%", background:s.dot, opacity:0.6 }} />}
      </span>
      {s.label}
    </span>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
export function ConfBar({ value, label = "Confidence", accent = C.indigo }: { value: number; label?: string; accent?: string }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? C.success : value >= 0.7 ? C.warning : C.danger;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:500, color:C.slate500 }}>{label}</span>
        <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:12, fontWeight:700, color }}>{pct}%</span>
      </div>
      <div style={{ height:5, borderRadius:99, background:C.slate200, overflow:"hidden" }}>
        <div className="fill-bar" style={{ height:"100%", borderRadius:99, background:color, width:`${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export type NavKey = "dashboard"|"new-screening"|"patients"|"screenings"|"reports"|"analytics"|"quality"|"simulation"|"users"|"centers"|"devices"|"settings";

export const NAV: { key: NavKey; label: string; icon: ReactNode; badge?: string }[] = [
  { key:"dashboard",     label:"Dashboard",         icon:<Ico.Home /> },
  { key:"new-screening", label:"New Screening",     icon:<Ico.Plus />, badge:"New" },
  { key:"patients",      label:"Patient Queue",     icon:<Ico.Users /> },
  { key:"screenings",    label:"Review & Verify",   icon:<Ico.Eye /> },
  { key:"reports",       label:"Reports",           icon:<Ico.FileText /> },
  { key:"analytics",     label:"Performance",      icon:<Ico.BarChart /> },
];
export const NAV2: { key: NavKey; label: string; icon: ReactNode }[] = [
  { key:"centers",  label:"Telemedicine & Centers", icon:<Ico.Home /> },
  { key:"devices",  label:"Devices",                icon:<Ico.Camera /> },
  { key:"users",    label:"User Management",        icon:<Ico.Users /> },
  { key:"settings", label:"Settings",               icon:<Ico.Settings /> },
];

export function Sidebar({ active, onSelect }: { active: NavKey; onSelect: (k: NavKey) => void }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const role = auth.role;
  const user = auth.user;
  const navPrimary = NAV.filter(item => auth.canNav(item.key));
  const navSecondary = NAV2.filter(item => auth.canNav(item.key));
  const initials = (user?.full_name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join("") || "U";

  return (
    <aside style={{
      width:246, display:"flex", flexDirection:"column",
      background:C.navy, flexShrink:0, height:"100%", userSelect:"none",
      borderRight: `1px solid rgba(255,255,255,0.06)`,
    }}>
      {/* Logo */}
      <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }} onClick={() => navigate("/dashboard")}>
        <NetraXLogo size="md" dark />
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:"14px 12px", overflowY:"auto", display:"flex", flexDirection:"column", gap:3 }}>
        {navPrimary.map(item => {
          const isA = active === item.key;
          return (
            <button key={item.key} onClick={() => onSelect(item.key)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                borderRadius:10, cursor:"pointer", border:"none", textAlign:"left", width:"100%",
                background: isA ? C.indigo : "transparent",
                color: isA ? C.white : "rgba(255,255,255,0.72)", transition:"all 0.15s",
                boxShadow: isA ? `0 2px 8px rgba(97,41,199,0.35)` : "none",
              }}
              onMouseEnter={e => { if (!isA) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!isA) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ color: isA ? C.white : "rgba(255,255,255,0.65)", flexShrink:0, display:"flex" }}>{item.icon}</span>
              <span style={{ fontSize:13, fontWeight: isA ? 600 : 500, flex:1 }}>{item.label}</span>
              {item.badge && !isA && (
                <span style={{ fontSize:9, fontWeight:700, background:C.indigo, color:C.white, padding:"2px 7px", borderRadius:99 }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {navSecondary.length > 0 && <div style={{ margin:"10px 6px", height:1, background:"rgba(255,255,255,0.08)" }} />}
        {navSecondary.map(item => {
          const isA = active === item.key;
          return (
            <button key={item.key} onClick={() => onSelect(item.key)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                borderRadius:10, cursor:"pointer", border:"none", textAlign:"left", width:"100%",
                background: isA ? C.indigo : "transparent",
                color: isA ? C.white : "rgba(255,255,255,0.72)", transition:"all 0.15s",
                boxShadow: isA ? `0 2px 8px rgba(97,41,199,0.35)` : "none",
              }}
              onMouseEnter={e => { if (!isA) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!isA) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ color: isA ? C.white : "rgba(255,255,255,0.65)", flexShrink:0, display:"flex" }}>{item.icon}</span>
              <span style={{ fontSize:13, fontWeight: isA ? 600 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Profile */}
      <div style={{ padding:"12px 12px", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", flexDirection:"column", gap:2 }}>
        <button
          type="button"
          onClick={() => navigate("/help")}
          style={{
            display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
            borderRadius:10, cursor:"pointer", border:"none", background:"transparent",
            color:"rgba(255,255,255,0.7)", width:"100%",
          }}
        >
          <Ico.Help /><span style={{ fontSize:13, fontWeight:500 }}>Help Center</span>
        </button>
        <div style={{
          display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
          borderRadius:10, cursor:"pointer",
        }}
          onClick={() => navigate("/settings")}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
        >
          <div style={{
            width:32, height:32, borderRadius:9, background:`${C.indigo}55`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:C.white, fontSize:11, fontWeight:700, flexShrink:0,
          }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {user?.full_name || "NetraX User"}
            </div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
              {role || user?.center || "Signed in"}
            </div>
          </div>
          <Ico.ChevD />
        </div>
      </div>
    </aside>
  );
}
// ─── Top Header ───────────────────────────────────────────────────────────────
function ConnectionBadge() {
  const online = useOnlineStatus();
  const bg = online ? C.successLight : C.dangerLight;
  const fg = online ? C.success : C.danger;
  return (
    <div
      title={online ? "Connected to the network" : "No network — API calls may fail"}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: bg }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: fg }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: fg }}>{online ? "Online" : "Offline"}</span>
    </div>
  );
}

export function Header({ title, breadcrumbs, actions }: {
  title: string; breadcrumbs?: string[]; actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header style={{
      height:68, display:"flex", alignItems:"center", padding:"0 28px",
      background:C.white, borderBottom:`1px solid ${C.slate200}`,
      flexShrink:0, gap:16,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <h1 style={{ fontSize:18, fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>{title}</h1>
          <span style={{ fontSize:12, color:C.slate500, fontWeight:400 }}>•</span>
          <span style={{ fontSize:12, color:C.slate500, fontWeight:500 }}>PHC Kothapally</span>
        </div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            {breadcrumbs.map((b,i) => (
              <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                {i > 0 && <span style={{ color:C.slate300, fontSize:10 }}><Ico.ChevR /></span>}
                <span
                  onClick={() => { if (i === 0) navigate("/dashboard"); }}
                  style={{ fontSize:11, color: i === breadcrumbs.length-1 ? C.slate600 : C.slate400, fontWeight:500, cursor: i === 0 ? "pointer" : "default" }}
                >{b}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {actions}

      <ConnectionBadge />

      {/* Search */}
      <div style={{ position:"relative", display:"flex", alignItems:"center" }} className="no-print">
        <span style={{ position:"absolute", left:12, color:C.slate400, display:"flex" }}><Ico.Search /></span>
        <input
          placeholder="Search patient ID or name"
          defaultValue=""
          onKeyDown={e => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              navigate(q ? `/patients?q=${encodeURIComponent(q)}` : "/patients");
            }
          }}
          style={{
            paddingLeft:34, paddingRight:14, paddingTop:8, paddingBottom:8,
            fontSize:12, background:C.white, border:`1px solid ${C.slate200}`,
            borderRadius:10, width:220, outline:"none", color:C.textPrimary, fontFamily:"var(--font-inter)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => navigate("/notifications")}
        style={{
          position:"relative", width:38, height:38, borderRadius:10,
          border:`1px solid ${C.slate200}`, background:C.white,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:C.slate500,
          transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = C.indigo;
          (e.currentTarget as HTMLElement).style.color = C.indigo;
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = C.slate200;
          (e.currentTarget as HTMLElement).style.color = C.slate500;
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <Ico.Bell />
        <span style={{ position:"absolute", top:8, right:8, width:7, height:7, borderRadius:"50%", background:C.danger, border:`1.5px solid ${C.white}` }} />
      </button>

      <div
        onClick={() => navigate("/settings")}
        style={{
          width:34, height:34, borderRadius:10, background:C.indigo,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:C.white, fontSize:12, fontWeight:700, cursor:"pointer",
          boxShadow:`0 2px 8px rgba(97,41,199,0.3)`,
          transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >AR</div>
    </header>
  );
}


// ─── Quality Arc Meter ────────────────────────────────────────────────────────
export function QualityArc({ score }: { score: number }) {
  const r = 52, cx = 70, cy = 72;
  const startAngle = Math.PI * 0.78;
  const endAngle   = Math.PI * 2.22;
  const range = endAngle - startAngle;
  const fillAngle = startAngle + (score / 100) * range;
  const toXY = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const s = toXY(startAngle), f = toXY(fillAngle), e = toXY(endAngle);
  const color = score >= 80 ? C.success : score >= 55 ? C.warning : C.danger;
  const trackArc  = `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 1 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
  const fillLarge = (fillAngle - startAngle) > Math.PI ? 1 : 0;
  const fillArc   = score > 0 ? `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${fillLarge} 1 ${f.x.toFixed(1)} ${f.y.toFixed(1)}` : "";
  return (
    <svg width={140} height={110} viewBox="0 0 140 110">
      <path d={trackArc} fill="none" stroke={C.slate200} strokeWidth={10} strokeLinecap="round"/>
      {fillArc && <path d={fillArc} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"/>}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={26} fontWeight={800} fill={color}
        style={{ fontFamily:"var(--font-jetbrains)" }}>{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={10} fill={C.slate400}
        style={{ fontFamily:"var(--font-inter)" }}>/ 100</text>
    </svg>
  );
}

// ─── Lesion Map ───────────────────────────────────────────────────────────────
export type LesionType = "ma" | "hm" | "ex" | "nv";

export const LESION_META: Record<LesionType,{ label:string; color:string; strokeColor:string; dotR:number; count:number; positions:{x:number;y:number}[] }> = {
  ma: {
    label:"Microaneurysms", color:"rgba(220,60,60,0.88)", strokeColor:"#dc3c3c",
    dotR:2.2, count:23,
    positions:[
      {x:38,y:42},{x:55,y:35},{x:28,y:55},{x:65,y:48},{x:32,y:65},{x:72,y:38},
      {x:45,y:72},{x:78,y:60},{x:20,y:48},{x:60,y:78},{x:35,y:30},{x:80,y:72},
      {x:52,y:25},{x:18,y:35},{x:68,y:25},{x:42,y:82},{x:25,y:70},{x:82,y:45},
      {x:58,y:88},{x:12,y:58},{x:75,y:82},{x:48,y:15},{x:88,y:30},
    ],
  },
  hm: {
    label:"Hemorrhages", color:"rgba(180,20,20,0.80)", strokeColor:"#b41414",
    dotR:5.5, count:7,
    positions:[
      {x:30,y:50},{x:62,y:38},{x:48,y:68},{x:72,y:62},{x:22,y:68},{x:55,y:82},{x:78,y:28},
    ],
  },
  ex: {
    label:"Exudates", color:"rgba(240,200,40,0.85)", strokeColor:"#f0c828",
    dotR:4.0, count:12,
    positions:[
      {x:40,y:38},{x:52,y:30},{x:65,y:42},{x:35,y:55},{x:75,y:35},{x:28,y:45},
      {x:60,y:68},{x:45,y:75},{x:70,y:72},{x:32,y:72},{x:58,y:22},{x:80,y:55},
    ],
  },
  nv: {
    label:"Neovascularization", color:"rgba(255,140,0,0.85)", strokeColor:"#ff8c00",
    dotR:3.5, count:1,
    positions:[
      {x:58,y:42},{x:63,y:38},{x:55,y:38},{x:60,y:45},{x:65,y:44},
    ],
  },
};

export function LesionMapImg({ type, size = 128 }: { type: LesionType; size?: number }) {
  const m = LESION_META[type];
  const scale = size / 100;
  return (
    <div style={{ position:"relative", width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:"radial-gradient(ellipse 80% 80% at 50% 50%, #1a0604 0%, #0c0302 55%, #040101 80%, #000000 100%)",
    }}>
      {/* Faint vessel traces */}
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox="0 0 100 100">
        <path d="M50,50 L80,50" stroke="rgba(80,12,2,0.5)" strokeWidth="0.8" fill="none"/>
        <path d="M50,50 L22,50" stroke="rgba(80,12,2,0.5)" strokeWidth="0.8" fill="none"/>
        <path d="M50,50 L35,25" stroke="rgba(80,12,2,0.4)" strokeWidth="0.7" fill="none"/>
        <path d="M50,50 L65,28" stroke="rgba(80,12,2,0.4)" strokeWidth="0.7" fill="none"/>
        <path d="M50,50 L35,74" stroke="rgba(80,12,2,0.4)" strokeWidth="0.7" fill="none"/>
        <path d="M50,50 L65,72" stroke="rgba(80,12,2,0.4)" strokeWidth="0.7" fill="none"/>
      </svg>
      {/* Lesion dots */}
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox="0 0 100 100">
        {type === "nv" ? (
          /* Neovascularization — branching pattern near disc */
          <>
            {m.positions.map((p,i) => (
              <circle key={i} cx={p.x} cy={p.y} r={m.dotR} fill={m.color} />
            ))}
            <path d="M58,42 C62,38 66,35 70,32" stroke={m.strokeColor} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <path d="M58,42 C55,37 53,33 52,28" stroke={m.strokeColor} strokeWidth="1.0" fill="none" strokeLinecap="round"/>
            <path d="M60,44 C64,42 68,42 72,40" stroke={m.strokeColor} strokeWidth="0.9" fill="none" strokeLinecap="round"/>
          </>
        ) : m.positions.map((p,i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={m.dotR * 1.8} fill={m.color} opacity={0.18}/>
            <circle cx={p.x} cy={p.y} r={m.dotR} fill={m.color}/>
          </g>
        ))}
      </svg>
      {/* Disc hint */}
      <div style={{ position:"absolute", top:"47%", left:"56%", width:size*0.13, height:size*0.11,
        background:"radial-gradient(ellipse, rgba(255,180,60,0.35) 0%, transparent 100%)",
        borderRadius:"50%", transform:"translate(-50%,-50%)" }}/>
      {/* Circular vignette */}
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 20px 8px rgba(0,0,0,0.7)" }}/>
    </div>
  );
}

// ─── Vessel Segmentation Map ──────────────────────────────────────────────────
export function VesselMapImg({ size = 160 }: { size?: number }) {
  return (
    <div style={{ position:"relative", width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"#020408" }}>
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox="0 0 100 100">
        {/* Main vessel tree from disc */}
        <line x1="56" y1="48" x2="84" y2="48" stroke="rgba(220,80,20,0.85)" strokeWidth="1.8"/>
        <line x1="56" y1="48" x2="24" y2="48" stroke="rgba(220,80,20,0.80)" strokeWidth="1.6"/>
        <line x1="56" y1="48" x2="40" y2="24" stroke="rgba(220,80,20,0.75)" strokeWidth="1.4"/>
        <line x1="56" y1="48" x2="68" y2="26" stroke="rgba(220,80,20,0.75)" strokeWidth="1.4"/>
        <line x1="56" y1="48" x2="40" y2="72" stroke="rgba(220,80,20,0.75)" strokeWidth="1.4"/>
        <line x1="56" y1="48" x2="68" y2="70" stroke="rgba(220,80,20,0.75)" strokeWidth="1.4"/>
        {/* Second-order branches */}
        <line x1="40" y1="24" x2="28" y2="16" stroke="rgba(200,60,12,0.6)" strokeWidth="1.0"/>
        <line x1="40" y1="24" x2="46" y2="14" stroke="rgba(200,60,12,0.6)" strokeWidth="0.9"/>
        <line x1="68" y1="26" x2="78" y2="16" stroke="rgba(200,60,12,0.6)" strokeWidth="1.0"/>
        <line x1="40" y1="72" x2="28" y2="82" stroke="rgba(200,60,12,0.6)" strokeWidth="1.0"/>
        <line x1="68" y1="70" x2="78" y2="80" stroke="rgba(200,60,12,0.6)" strokeWidth="1.0"/>
        <line x1="24" y1="48" x2="14" y2="40" stroke="rgba(200,60,12,0.55)" strokeWidth="0.9"/>
        <line x1="24" y1="48" x2="14" y2="56" stroke="rgba(200,60,12,0.55)" strokeWidth="0.9"/>
        <line x1="84" y1="48" x2="88" y2="40" stroke="rgba(200,60,12,0.5)" strokeWidth="0.8"/>
        <line x1="84" y1="48" x2="88" y2="56" stroke="rgba(200,60,12,0.5)" strokeWidth="0.8"/>
        {/* Third-order */}
        <line x1="28" y1="16" x2="20" y2="10" stroke="rgba(180,40,8,0.45)" strokeWidth="0.7"/>
        <line x1="78" y1="16" x2="86" y2="10" stroke="rgba(180,40,8,0.45)" strokeWidth="0.7"/>
        <line x1="28" y1="82" x2="20" y2="90" stroke="rgba(180,40,8,0.45)" strokeWidth="0.7"/>
        <line x1="78" y1="80" x2="86" y2="88" stroke="rgba(180,40,8,0.45)" strokeWidth="0.7"/>
        {/* Disc glow */}
        <ellipse cx="56" cy="47" rx="8" ry="7" fill="rgba(255,180,60,0.22)" stroke="rgba(255,180,60,0.4)" strokeWidth="0.8"/>
        {/* Macula hint */}
        <circle cx="37" cy="50" r="4" fill="rgba(140,40,10,0.18)" stroke="rgba(140,40,10,0.3)" strokeWidth="0.5"/>
      </svg>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 18px 6px rgba(0,0,0,0.8)" }}/>
    </div>
  );
}

// ─── Optic Disc Map ───────────────────────────────────────────────────────────
export function DiscMapImg({ size = 128 }: { size?: number }) {
  return (
    <div style={{ position:"relative", width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:"radial-gradient(ellipse at 50% 50%, #0e0408 0%, #040208 60%, #000000 100%)" }}>
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox="0 0 100 100">
        {/* Outer boundary */}
        <ellipse cx="50" cy="50" rx="28" ry="24" fill="none" stroke="rgba(255,180,60,0.55)" strokeWidth="1.2" strokeDasharray="3 2"/>
        {/* Inner cup */}
        <ellipse cx="50" cy="50" rx="14" ry="12" fill="rgba(255,200,80,0.18)" stroke="rgba(255,200,80,0.6)" strokeWidth="0.9"/>
        {/* Disc fill glow */}
        <ellipse cx="50" cy="50" rx="28" ry="24" fill="rgba(255,160,40,0.10)"/>
        {/* Cup/disc ratio label area */}
        <circle cx="50" cy="50" r="5" fill="rgba(255,220,100,0.85)"/>
        {/* Vessel exit points */}
        {[0, 90, 180, 270].map((deg,i) => {
          const rad = deg * Math.PI / 180;
          const x = 50 + 28 * Math.cos(rad), y = 50 + 24 * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r={1.5} fill="rgba(200,80,20,0.7)"/>;
        })}
        {/* Measurement lines */}
        <line x1="22" y1="50" x2="78" y2="50" stroke="rgba(100,200,255,0.4)" strokeWidth="0.6" strokeDasharray="2 2"/>
        <line x1="50" y1="26" x2="50" y2="74" stroke="rgba(100,200,255,0.4)" strokeWidth="0.6" strokeDasharray="2 2"/>
      </svg>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 16px 6px rgba(0,0,0,0.8)" }}/>
    </div>
  );
}

// ─── Fovea Map ────────────────────────────────────────────────────────────────
export function FoveaMapImg({ size = 128 }: { size?: number }) {
  return (
    <div style={{ position:"relative", width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:"radial-gradient(ellipse at 50% 50%, #0a0408 0%, #040208 60%, #000000 100%)" }}>
      <svg style={{ position:"absolute", inset:0 }} width={size} height={size} viewBox="0 0 100 100">
        {/* Avascular zone */}
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(200,100,220,0.5)" strokeWidth="1.2" strokeDasharray="3 2"/>
        {/* Foveal pit */}
        <circle cx="50" cy="50" r="8" fill="rgba(180,80,220,0.15)" stroke="rgba(200,120,240,0.65)" strokeWidth="1.0"/>
        {/* Foveola */}
        <circle cx="50" cy="50" r="3" fill="rgba(220,150,255,0.75)"/>
        {/* Radial measurement */}
        <line x1="32" y1="50" x2="68" y2="50" stroke="rgba(180,100,255,0.35)" strokeWidth="0.6" strokeDasharray="2 2"/>
        <line x1="50" y1="32" x2="50" y2="68" stroke="rgba(180,100,255,0.35)" strokeWidth="0.6" strokeDasharray="2 2"/>
        {/* Concentric rings */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(180,100,255,0.2)" strokeWidth="0.5"/>
      </svg>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 16px 6px rgba(0,0,0,0.8)" }}/>
    </div>
  );
}

// ─── Grad-CAM heatmap / overlay ───────────────────────────────────────────────
export const GRADCAM_HOTSPOTS = [
  { t:"42%", l:"38%", w:"44%", h:"40%", c:"rgba(255,40,0,0.72)" },
  { t:"55%", l:"60%", w:"30%", h:"28%", c:"rgba(255,120,0,0.55)" },
  { t:"35%", l:"58%", w:"22%", h:"20%", c:"rgba(255,200,0,0.42)" },
  { t:"62%", l:"32%", w:"18%", h:"16%", c:"rgba(255,160,0,0.38)" },
];

export function GradCamHeatmapImg({ size = 280, mode = "heatmap" }: { size?: number; mode?: "heatmap"|"overlay" }) {
  return (
    <div style={{ position:"relative", width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0 }}>
      {mode === "overlay" ? (
        <FundusImg variant="gradcam" size={size} />
      ) : (
        <>
          <div style={{
            position:"absolute", inset:0,
            background:"radial-gradient(ellipse 80% 80% at 50% 50%, #120808 0%, #060202 55%, #000 100%)",
          }} />
          {VESSELS.slice(0,6).map((v,i) => (
            <div key={i} className="vsl" style={{
              top:v.t, left:v.l, width:v.w, height:"1.2px",
              transform:`rotate(${v.a})`, opacity:0.25,
              background:"rgba(120,40,20,0.5)",
            }} />
          ))}
          {GRADCAM_HOTSPOTS.map((h,i) => (
            <div key={i} style={{
              position:"absolute", top:h.t, left:h.l, width:h.w, height:h.h,
              background:`radial-gradient(ellipse, ${h.c} 0%, transparent 70%)`,
              borderRadius:"50%", transform:"translate(-50%,-50%)",
              filter: i === 0 ? "blur(1px)" : "blur(2px)",
            }} />
          ))}
          <div style={{
            position:"absolute", inset:0, borderRadius:"50%",
            background:"radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }} />
        </>
      )}
      <div style={{ position:"absolute", inset:0, borderRadius:"50%",
        boxShadow:"inset 0 0 18px 6px rgba(0,0,0,0.55)" }}/>
    </div>
  );
}

export function ArchStep({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{
      padding:"10px 14px", borderRadius:10, textAlign:"center",
      background:`${accent}12`, border:`1.5px solid ${accent}40`,
      fontSize:11, fontWeight:700, color:C.navy, lineHeight:1.35,
    }}>
      {label}
    </div>
  );
}

export function ArchArrow() {
  return (
    <div style={{ display:"flex", justifyContent:"center", color:C.slate400, padding:"2px 0" }}>
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
        <path d="M7 1v12M3 9l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}


// ─── Filters / charts ─────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        background: active ? C.indigo : C.white,
        color: active ? C.white : C.slate600,
        border: `1px solid ${active ? C.indigo : C.slate200}`,
        boxShadow: active ? "0 2px 6px rgba(97,41,199,0.22)" : "0 1px 2px rgba(18,28,46,0.02)",
        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "#EFF6FB";
          (e.currentTarget as HTMLElement).style.color = C.textPrimary;
          (e.currentTarget as HTMLElement).style.borderColor = C.slate300;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = C.white;
          (e.currentTarget as HTMLElement).style.color = C.slate600;
          (e.currentTarget as HTMLElement).style.borderColor = C.slate200;
        }
      }}
    >
      {label}
    </button>
  );
}

export function MiniBarChart({ data, color = C.indigo, height = 90 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height, width:"100%" }}>
      {data.map((v,i) => (
        <div key={i} style={{
          flex:1, height:`${(v/max)*100}%`, minHeight:4, borderRadius:"6px 6px 2px 2px",
          background: color, opacity: 0.45 + (v/max)*0.55,
        }} />
      ))}
    </div>
  );
}

export function DonutMini({ slices, size = 120 }: { slices: { value:number; color:string; label:string }[]; size?: number }) {
  const total = slices.reduce((a,b) => a+b.value, 0) || 1;
  const r = 42, circ = 2*Math.PI*r;
  let offset = 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <g transform="rotate(-90 60 60)">
          {slices.map((s,i) => {
            const dash = (s.value/total)*circ;
            const el = (
              <circle key={i} cx={60} cy={60} r={r} fill="none" stroke={s.color} strokeWidth={14}
                strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} />
            );
            offset += dash;
            return el;
          })}
        </g>
        <text x={60} y={56} textAnchor="middle" fontSize={14} fontWeight={800} fill={C.navy}
          style={{ fontFamily:"var(--font-jetbrains)" }}>{total}</text>
        <text x={60} y={72} textAnchor="middle" fontSize={9} fill={C.slate500}>total</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {slices.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color }}/>
            <span style={{ fontSize:11, color:C.slate600 }}>{s.label}</span>
            <span style={{ fontFamily:"var(--font-jetbrains)", fontSize:11, fontWeight:700, color:C.navy }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Device silhouette visual ─────────────────────────────────────────────────
export function FundusDeviceVisual({ size = 180 }: { size?: number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:20, background:`linear-gradient(160deg, ${C.slate100} 0%, ${C.slate200} 100%)`,
      border:`1px solid ${C.slate200}`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden",
    }}>
      <div style={{
        width:size*0.55, height:size*0.72, borderRadius:14, background:C.navy,
        boxShadow:"0 12px 28px rgba(15,23,42,0.25)", position:"relative",
      }}>
        <div style={{
          position:"absolute", top:"18%", left:"50%", transform:"translateX(-50%)",
          width:size*0.28, height:size*0.28, borderRadius:"50%",
          background:`radial-gradient(circle at 40% 35%, #64748B 0%, #1E293B 55%, #020617 100%)`,
          border:`3px solid ${C.slate600}`,
        }} />
        <div style={{
          position:"absolute", bottom:"14%", left:"50%", transform:"translateX(-50%)",
          width:size*0.22, height:10, borderRadius:6, background:C.indigo,
        }} />
        <div style={{
          position:"absolute", top:"8%", right:"10%", width:8, height:8, borderRadius:"50%", background:C.success,
          boxShadow:`0 0 8px ${C.success}`,
        }} />
      </div>
      <div style={{
        position:"absolute", bottom:12, left:12, right:12, fontSize:10, fontWeight:700, color:C.slate500, textAlign:"center",
      }}>Non-mydriatic fundus camera</div>
    </div>
  );
}

export function PipelineNode({ label, icon, accent }: { label: string; icon: ReactNode; accent: string }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:100,
    }}>
      <div style={{
        width:56, height:56, borderRadius:16, background:`${accent}14`, border:`1.5px solid ${accent}45`,
        display:"flex", alignItems:"center", justifyContent:"center", color:accent,
      }}>{icon}</div>
      <div style={{ fontSize:11, fontWeight:700, color:C.navy, textAlign:"center", lineHeight:1.3, maxWidth:110 }}>{label}</div>
    </div>
  );
}

export function PipelineArrow() {
  return (
    <div style={{ display:"flex", alignItems:"center", color:C.slate400, padding:"0 4px", marginTop:-18 }}>
      <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
        <path d="M1 7h22M18 2l6 5-6 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}


export function RoleBadge({ role }: { role: string }) {
  const map: Record<string,{bg:string;color:string}> = {
    Ophthalmologist: { bg:C.indigoLight, color:C.indigo },
    "Screening Operator": { bg:C.successLight, color:C.success },
    Administrator: { bg:C.purpleLight, color:C.purple },
    Reviewer: { bg:C.warningLight, color:C.warning },
  };
  const s = map[role] ?? { bg:C.slate100, color:C.slate600 };
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99, background:s.bg, color:s.color }}>{role}</span>
  );
}

// ─── Figma Design System Card Components ─────────────────────────────────────
export function Card({
  children, title, subtitle, badge, action, style = {}, className = "", onClick, noPadding = false,
}: {
  children: ReactNode; title?: ReactNode; subtitle?: ReactNode; badge?: ReactNode; action?: ReactNode;
  style?: CSSProperties; className?: string; onClick?: () => void; noPadding?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.slate200}`,
        boxShadow: "0 1px 3px rgba(18, 28, 46, 0.04)",
        padding: noPadding ? 0 : 20,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease",
        ...style,
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(18, 28, 46, 0.08)";
          (e.currentTarget as HTMLElement).style.borderColor = C.indigoLight === C.slate200 ? C.slate300 : "#C7D4E5";
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(18, 28, 46, 0.04)";
          (e.currentTarget as HTMLElement).style.borderColor = C.slate200;
        }
      }}
    >
      {(title || subtitle || action || badge) && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: noPadding ? 0 : 16,
          padding: noPadding ? "16px 20px" : 0,
          borderBottom: noPadding ? `1px solid ${C.slate200}` : "none",
        }}>
          <div>
            {title && (
              <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.25, display: "flex", alignItems: "center", gap: 8 }}>
                {title}
                {badge}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: C.slate500, marginTop: 3 }}>
                {subtitle}
              </div>
            )}
          </div>
          {action && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  title, value, delta, up, icon, accent = C.indigo, sublabel = "vs last month",
}: {
  title: string; value: string | number; delta?: string; up?: boolean; icon?: ReactNode; accent?: string; sublabel?: string;
}) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.slate200}`,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 1px 3px rgba(18, 28, 46, 0.04)",
        transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(18, 28, 46, 0.06)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(18, 28, 46, 0.04)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.slate500 }}>{title}</span>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center",
            color: accent, flexShrink: 0,
            transition: "transform 0.15s ease",
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 28, fontWeight: 700, color: C.textPrimary, letterSpacing: -0.5, lineHeight: 1 }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 11, fontWeight: 600, color: up ? C.success : C.danger, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{up ? "↑" : "↓"} {delta}</span>
          <span style={{ color: C.slate400, fontWeight: 400 }}>{sublabel}</span>
        </div>
      )}
    </div>
  );
}

export function CardRow({
  children, style = {}, onClick, active = false,
}: {
  children: ReactNode; style?: CSSProperties; onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? C.indigoLight : C.slate50,
        borderRadius: 10,
        border: active ? `1px solid ${C.indigoDim}` : `1px solid transparent`,
        padding: "12px 16px",
        display: "grid",
        alignItems: "center",
        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={e => {
        if (!active && onClick) {
          (e.currentTarget as HTMLElement).style.background = "#EFF6FB";
          (e.currentTarget as HTMLElement).style.borderColor = "#D0DDEC";
          (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
        }
      }}
      onMouseLeave={e => {
        if (!active && onClick) {
          (e.currentTarget as HTMLElement).style.background = C.slate50;
          (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
        }
      }}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  children, variant = "primary", size = "md", icon, onClick, disabled = false, style = {}, type = "button",
}: {
  children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg"; icon?: ReactNode; onClick?: () => void; disabled?: boolean; style?: CSSProperties; type?: "button" | "submit" | "reset";
}) {
  const paddings = { sm: "6px 14px", md: "10px 20px", lg: "13px 26px" };
  const fontSizes = { sm: 11, md: 13, lg: 14 };

  const baseStyles: Record<string, CSSProperties> = {
    primary: {
      background: C.indigo,
      color: C.white,
      border: "none",
      boxShadow: `0 2px 8px rgba(97,41,199,0.28)`,
    },
    secondary: {
      background: C.white,
      color: C.textPrimary,
      border: `1px solid ${C.slate200}`,
      boxShadow: "0 1px 2px rgba(18,28,46,0.04)",
    },
    outline: {
      background: "transparent",
      color: C.indigo,
      border: `1.5px solid ${C.indigo}`,
    },
    danger: {
      background: C.danger,
      color: C.white,
      border: "none",
      boxShadow: `0 2px 8px rgba(232,51,64,0.22)`,
    },
    ghost: {
      background: "transparent",
      color: C.slate600,
      border: "none",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: paddings[size],
        fontSize: fontSizes[size],
        fontWeight: 600,
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "var(--font-inter)",
        ...baseStyles[variant],
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          if (variant === "primary") {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(97,41,199,0.4)";
          } else if (variant === "secondary") {
            (e.currentTarget as HTMLElement).style.background = "#F8FAFC";
            (e.currentTarget as HTMLElement).style.borderColor = C.slate300;
          } else if (variant === "outline") {
            (e.currentTarget as HTMLElement).style.background = `${C.indigo}10`;
          }
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          if (variant === "primary") {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(97,41,199,0.28)";
          } else if (variant === "secondary") {
            (e.currentTarget as HTMLElement).style.background = C.white;
            (e.currentTarget as HTMLElement).style.borderColor = C.slate200;
          } else if (variant === "outline") {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }
      }}
    >
      {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
}
