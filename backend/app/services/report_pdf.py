"""Build a clinical screening report PDF (fpdf2)."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fpdf import FPDF

NAVY = (15, 23, 42)
INDIGO = (79, 70, 229)
SLATE = (100, 116, 139)
TEXT = (30, 41, 59)
LINE = (226, 232, 240)
PANEL = (248, 250, 252)
WHITE = (255, 255, 255)
RED = (220, 38, 38)

DR_NAMES = {
    0: "No DR",
    1: "Mild NPDR",
    2: "Moderate NPDR",
    3: "Severe NPDR",
    4: "Proliferative DR",
}
DR_COLORS = {
    0: (22, 163, 74),
    1: (161, 98, 7),
    2: (234, 88, 12),
    3: (220, 38, 38),
    4: (153, 27, 27),
}

# Same wording as the Results page (ICDR severity scale).
RESULT_EXPLAIN: dict[int, dict] = {
    0: {
        "means": "No signs of diabetic retinopathy were found in the uploaded images.",
        "action": "No referral needed. Repeat screening in 12 months.",
        "steps": [
            "Keep blood sugar, blood pressure and cholesterol under control.",
            "Come back sooner if vision changes.",
        ],
    },
    1: {
        "means": "Earliest stage. Only tiny bulges in the retinal blood vessels (microaneurysms) "
        "are present. Vision is usually not affected.",
        "action": "No treatment needed now. Repeat screening in 12 months.",
        "steps": [
            "Tighter control of blood sugar and blood pressure slows progression.",
            "Come back sooner if vision changes.",
        ],
    },
    2: {
        "means": "Blood vessel damage has progressed: small bleeds or leakage (haemorrhages, "
        "exudates) are present, but not yet severe.",
        "action": "Refer to an ophthalmologist within 30 days for a full dilated eye exam.",
        "steps": [
            "The eye doctor will check for swelling at the centre of vision (macular oedema).",
            "Review diabetes, blood pressure and cholesterol control with the treating doctor.",
        ],
    },
    3: {
        "means": "Widespread bleeding and vessel damage in the retina. High risk of progressing "
        "to the sight-threatening proliferative stage.",
        "action": "Refer to an ophthalmologist within 2 to 4 weeks. Do not delay.",
        "steps": [
            "Laser or injection treatment may be advised to protect vision.",
            "Close follow-up every few months is usually needed.",
        ],
    },
    4: {
        "means": "Most advanced stage. Fragile new blood vessels are growing on the retina and "
        "can bleed or pull the retina off, causing sudden vision loss.",
        "action": "Urgent referral to an ophthalmologist, ideally within 1 week.",
        "steps": [
            "Treatment (laser, eye injections or surgery) can prevent blindness if given in time.",
            "Sudden floaters, a dark curtain or loss of vision is an emergency: go the same day.",
        ],
    },
}

MARGIN = 15
PAGE_W = 210
CONTENT_W = PAGE_W - 2 * MARGIN


def _ascii(text: str) -> str:
    """Helvetica core fonts are Latin-1; normalize common unicode."""
    return (
        (str(text) if text is not None else "")
        .replace("—", "-")
        .replace("–", "-")
        .replace("·", "|")
        .replace("×", "x")
        .replace("→", "->")
        .replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
        .encode("latin-1", "replace")
        .decode("latin-1")
    )


def _is_file(path: str | None) -> bool:
    try:
        return bool(path) and Path(path).is_file()
    except OSError:
        return False


def _pct(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value:.1%}" if value <= 1 else f"{value:.1f}"


class ReportPDF(FPDF):
    report_id: str = ""
    patient_line: str = ""

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(8)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*NAVY)
        self.cell(0, 5, "NetraX | Diabetic Retinopathy Screening Report")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*SLATE)
        self.cell(0, 5, _ascii(f"{self.report_id}  |  {self.patient_line}"), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*LINE)
        self.set_line_width(0.3)
        self.line(MARGIN, 15, PAGE_W - MARGIN, 15)
        self.set_y(20)

    def footer(self) -> None:
        self.set_y(-14)
        self.set_draw_color(*LINE)
        self.set_line_width(0.3)
        self.line(MARGIN, self.get_y(), PAGE_W - MARGIN, self.get_y())
        self.set_y(-12)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*SLATE)
        self.cell(0, 5, "AI-assisted screening report. Not a diagnosis. Confidential patient information.")
        self.cell(0, 5, f"Page {self.page_no()} of {{nb}}", align="R")


def build_report_pdf(
    *,
    report_id: str,
    patient_id: str,
    patient_name: str,
    age: int | None,
    gender: str | None,
    center: str | None,
    severity: str,
    date: str,
    status: str,
    screening_id: str | None,
    confidence: float | None,
    referral_needed: bool | None,
    model_used: str | None,
    quality_score: float | None = None,
    quality_status: str | None = None,
    review_status: str | None = None,
    reviewed_by: str | None = None,
    clinician_dr_level: int | None = None,
    clinician_decision: str | None = None,
    review_notes: str | None = None,
    reviewer_override: bool = False,
    od_image_path: str | None = None,
    os_image_path: str | None = None,
    od_gradcam_overlay: str | None = None,
    os_gradcam_overlay: str | None = None,
    od_gradcam_heatmap: str | None = None,
    os_gradcam_heatmap: str | None = None,
    dr_level: int | None = None,
    model_compare: dict | None = None,
    per_eye: list[dict] | None = None,
) -> bytes:
    pdf = ReportPDF(format="A4")
    pdf.report_id = report_id or ""
    pdf.patient_line = f"{patient_name or '-'} ({patient_id or '-'})"
    pdf.alias_nb_pages()
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    level = dr_level if dr_level in DR_NAMES else None
    color = DR_COLORS.get(level, NAVY) if level is not None else NAVY
    mc = model_compare if isinstance(model_compare, dict) else {}

    # ---- helpers -----------------------------------------------------------
    def section(title: str) -> None:
        if pdf.get_y() > 255:
            pdf.add_page()
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10.5)
        pdf.set_text_color(*NAVY)
        pdf.cell(0, 6, _ascii(title.upper()), new_x="LMARGIN", new_y="NEXT")
        y = pdf.get_y()
        pdf.set_draw_color(*INDIGO)
        pdf.set_line_width(0.6)
        pdf.line(MARGIN, y, MARGIN + 18, y)
        pdf.set_draw_color(*LINE)
        pdf.set_line_width(0.2)
        pdf.line(MARGIN + 18, y, PAGE_W - MARGIN, y)
        pdf.ln(3)

    def pair(label: str, value: str, x: float, y: float, w: float) -> None:
        pdf.set_xy(x, y)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(*SLATE)
        pdf.cell(w, 4, _ascii(label.upper()))
        pdf.set_xy(x, y + 4)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*TEXT)
        pdf.cell(w, 5.5, _ascii(value or "-"))

    def paragraph(text: str, size: float = 9.5, style: str = "", rgb: tuple = TEXT, h: float = 4.8) -> None:
        pdf.set_font("Helvetica", style, size)
        pdf.set_text_color(*rgb)
        pdf.set_x(MARGIN)
        pdf.multi_cell(CONTENT_W, h, _ascii(text), new_x="LMARGIN", new_y="NEXT")

    def table(headers: list[str], rows: list[list[str]], widths: list[float], bold_last: bool = False) -> None:
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(*PANEL)
        pdf.set_text_color(*SLATE)
        pdf.set_draw_color(*LINE)
        pdf.set_line_width(0.2)
        pdf.set_x(MARGIN)
        for head, w in zip(headers, widths):
            pdf.cell(w, 7, _ascii(head.upper()), border="TB", fill=True)
        pdf.ln(7)
        for i, r in enumerate(rows):
            last = bold_last and i == len(rows) - 1
            pdf.set_font("Helvetica", "B" if last else "", 9.5)
            pdf.set_text_color(*(NAVY if last else TEXT))
            pdf.set_x(MARGIN)
            for val, w in zip(r, widths):
                pdf.cell(w, 7, _ascii(val), border="B")
            pdf.ln(7)

    # ---- header band -------------------------------------------------------
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, PAGE_W, 34, style="F")
    pdf.set_fill_color(*INDIGO)
    pdf.rect(0, 34, PAGE_W, 1.2, style="F")
    pdf.set_xy(MARGIN, 9)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*WHITE)
    pdf.cell(100, 9, "NetraX")
    pdf.set_xy(MARGIN, 19)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(203, 213, 225)
    pdf.cell(110, 5, "Diabetic Retinopathy Screening Report")
    pdf.set_xy(MARGIN, 24.5)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(110, 4, "AI-assisted clinical decision support")

    right_x = PAGE_W - MARGIN - 70
    pdf.set_xy(right_x, 9)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*WHITE)
    pdf.cell(70, 6, _ascii(f"Report {report_id}"), align="R")
    pdf.set_font("Helvetica", "", 8.5)
    pdf.set_text_color(203, 213, 225)
    pdf.set_xy(right_x, 16)
    pdf.cell(70, 4.5, _ascii(f"Screening {screening_id or '-'}"), align="R")
    pdf.set_xy(right_x, 21)
    pdf.cell(70, 4.5, _ascii(f"Screening date: {date or '-'}"), align="R")
    pdf.set_xy(right_x, 26)
    pdf.cell(70, 4.5, _ascii(f"Generated: {datetime.now().strftime('%d %b %Y %H:%M')}"), align="R")

    # ---- patient panel -----------------------------------------------------
    top = 42
    pdf.set_fill_color(*PANEL)
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.2)
    pdf.rect(MARGIN, top, CONTENT_W, 27, style="DF", round_corners=True, corner_radius=2)
    col = CONTENT_W / 4
    age_gender = " / ".join(p for p in [f"{age} yrs" if age is not None else None, gender or None] if p) or "-"
    pair("Patient name", patient_name or "-", MARGIN + 4, top + 3, col * 2 - 6)
    pair("Patient ID", patient_id or "-", MARGIN + 4 + col * 2, top + 3, col - 4)
    pair("Age / Gender", age_gender, MARGIN + 4 + col * 3, top + 3, col - 6)
    pair("Screening centre", center or "-", MARGIN + 4, top + 15, col * 2 - 6)
    quality = f"{quality_score:.0f}/100" if quality_score is not None else "Not assessed"
    if quality_status and quality_score is not None:
        quality = f"{quality} ({quality_status})"
    pair("Image quality", quality, MARGIN + 4 + col * 2, top + 15, col * 2 - 8)

    # ---- result banner -----------------------------------------------------
    top = 75
    banner_h = 30
    pdf.set_fill_color(*color)
    pdf.rect(MARGIN, top, CONTENT_W, banner_h, style="F", round_corners=True, corner_radius=2.5)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(MARGIN + 6, top + 4)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(100, 4, "AI SCREENING RESULT")
    pdf.set_xy(MARGIN + 6, top + 9.5)
    pdf.set_font("Helvetica", "B", 19)
    headline = f"Level {level}: {DR_NAMES[level]}" if level is not None else (severity or "Result not available")
    pdf.cell(120, 9, _ascii(headline))
    pdf.set_xy(MARGIN + 6, top + 20.5)
    pdf.set_font("Helvetica", "B", 10)
    if referral_needed is None:
        ref_line = "Referral status not available"
    else:
        ref_line = "REFERABLE - ophthalmologist review needed" if referral_needed else "Non-referable - routine follow-up"
    pdf.cell(120, 5, ref_line)

    pdf.set_xy(PAGE_W - MARGIN - 56, top + 4)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(50, 4, "CONFIDENCE", align="R")
    pdf.set_xy(PAGE_W - MARGIN - 56, top + 9.5)
    pdf.set_font("Helvetica", "B", 19)
    pdf.cell(50, 9, _pct(confidence), align="R")
    pdf.set_xy(PAGE_W - MARGIN - 76, top + 20.5)
    pdf.set_font("Helvetica", "", 8.5)
    pdf.cell(70, 5, _ascii(model_used or "-"), align="R")
    pdf.set_y(top + banner_h + 4)

    # ---- explanation -------------------------------------------------------
    if level is not None:
        info = RESULT_EXPLAIN[level]
        section("What this result means")
        paragraph(info["means"])
        pdf.ln(2)
        paragraph("Recommended next step", size=8, rgb=SLATE, h=4)
        paragraph(info["action"], size=10.5, style="B", rgb=NAVY, h=5.5)
        for step in info["steps"]:
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(*TEXT)
            pdf.set_x(MARGIN + 2)
            pdf.cell(4, 4.8, "-")
            pdf.multi_cell(CONTENT_W - 6, 4.8, _ascii(step), new_x="LMARGIN", new_y="NEXT")

        cautions: list[str] = []
        if confidence is not None and confidence < 0.6:
            cautions.append(f"The AI is not very sure of this grade ({_pct(confidence)} confidence).")
        if mc.get("disagree"):
            other = mc.get("qml_label")
            cautions.append(
                "The two AI models disagree"
                + (f" (the second model suggests {other})." if other else ".")
            )
        if cautions:
            pdf.ln(2)
            paragraph("Check carefully: " + " ".join(cautions) + " A clinician should confirm the grade.",
                      size=9, style="B", rgb=RED)

    # ---- model outputs -----------------------------------------------------
    if mc:
        section("AI model outputs")
        rows = [
            ["CNN (DINOv2 classifier)", str(mc.get("cnn_label") or "-"), _pct(mc.get("cnn_confidence"))],
            ["QML (hybrid quantum, 4 qubits)", str(mc.get("qml_label") or "-"), _pct(mc.get("qml_confidence"))],
            ["Final (higher-confidence model)", str(mc.get("ensemble_label") or severity or "-"),
             _pct(mc.get("ensemble_confidence", confidence))],
        ]
        table(["Model", "Grade", "Confidence"], rows, [85, 60, 35], bold_last=True)

    eyes = [e for e in (per_eye or []) if isinstance(e, dict) and e.get("dr_level") is not None]
    if eyes:
        section("Per-eye findings (CNN)")
        eye_names = {"od": "Right eye (OD)", "os": "Left eye (OS)"}
        rows = []
        for e in eyes:
            lv = int(e["dr_level"])
            rows.append([
                eye_names.get(str(e.get("eye") or "").lower(), "Eye"),
                f"Level {lv}: {DR_NAMES.get(lv, '-')}",
                _pct(e.get("confidence")),
            ])
        table(["Eye", "Grade", "Confidence"], rows, [85, 60, 35])
        if len(eyes) > 1:
            pdf.ln(1.5)
            paragraph("The overall grade follows the more severely affected eye.", size=8, rgb=SLATE, h=4)

    # ---- clinical review ---------------------------------------------------
    section("Clinical review")
    if review_status == "completed":
        rows = [["Status", "Verified by clinician"]]
        if reviewed_by:
            rows.append(["Reviewed by", reviewed_by])
        if clinician_decision:
            rows.append(["Decision", clinician_decision.capitalize()])
        if clinician_dr_level is not None:
            rows.append(["Clinician grade",
                         f"Level {clinician_dr_level}: {DR_NAMES.get(clinician_dr_level, '-')}"])
        if reviewer_override:
            rows.append(["Override", "Yes, the clinician changed the AI grade"])
        for label, value in rows:
            pdf.set_x(MARGIN)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*SLATE)
            pdf.cell(42, 5.5, _ascii(label))
            pdf.set_font("Helvetica", "B", 9.5)
            pdf.set_text_color(*TEXT)
            pdf.cell(0, 5.5, _ascii(value), new_x="LMARGIN", new_y="NEXT")
        if review_notes:
            pdf.ln(1)
            paragraph(f"Notes: {review_notes}", size=9)
    else:
        paragraph("Not yet reviewed. This is AI output only and has not been verified by a clinician.",
                  size=9.5, style="B", rgb=RED)

    # ---- images + Grad-CAM -------------------------------------------------
    eye_sets = [
        ("Right eye (OD)", od_image_path, od_gradcam_heatmap, od_gradcam_overlay),
        ("Left eye (OS)", os_image_path, os_gradcam_heatmap, os_gradcam_overlay),
    ]
    eye_sets = [s for s in eye_sets if any(_is_file(p) for p in s[1:])]
    if eye_sets:
        pdf.add_page()
        section("Retinal images and Grad-CAM explainability")
        paragraph(
            "Grad-CAM shows where the CNN looked when it chose the grade. Warm colours (red, orange) "
            "mark the areas that influenced the result most. The map covers the central region of "
            "the photo that the model analyses.",
            size=9, rgb=SLATE, h=4.5,
        )
        pdf.ln(2)
        gap = 5
        tile = (CONTENT_W - 2 * gap) / 3
        for title, original, heatmap, overlay in eye_sets:
            if pdf.get_y() + tile + 22 > 297 - 18:
                pdf.add_page()
            pdf.set_font("Helvetica", "B", 10.5)
            pdf.set_text_color(*NAVY)
            pdf.set_x(MARGIN)
            pdf.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
            y = pdf.get_y()
            for i, (label, path) in enumerate(
                (("Original fundus", original), ("Grad-CAM heatmap", heatmap), ("Grad-CAM overlay", overlay))
            ):
                x = MARGIN + i * (tile + gap)
                pdf.set_fill_color(*NAVY)
                pdf.set_draw_color(*LINE)
                pdf.rect(x, y, tile, tile, style="F")
                drawn = False
                if _is_file(path):
                    try:
                        pdf.image(str(path), x=x + 1, y=y + 1, w=tile - 2, h=tile - 2, keep_aspect_ratio=True)
                        drawn = True
                    except Exception:  # noqa: BLE001 - unreadable image must not break the report
                        drawn = False
                if not drawn:
                    pdf.set_xy(x, y + tile / 2 - 3)
                    pdf.set_font("Helvetica", "", 8)
                    pdf.set_text_color(148, 163, 184)
                    pdf.cell(tile, 6, "Not available", align="C")
                pdf.set_xy(x, y + tile + 1.5)
                pdf.set_font("Helvetica", "B", 8.5)
                pdf.set_text_color(*TEXT)
                pdf.cell(tile, 5, label, align="C")
            pdf.set_y(y + tile + 11)

    # ---- disclaimer + sign-off ---------------------------------------------
    if pdf.get_y() > 225:
        pdf.add_page()
    section("Important information")
    paragraph(
        "This report is generated by NetraX as AI-assisted screening decision support. It is not a "
        "medical diagnosis. Final interpretation, treatment decisions and any referral must be made by "
        "a qualified ophthalmologist after reviewing the retinal images and the patient's history. "
        "Grad-CAM maps are an aid to understanding the model and must be clinically correlated.",
        size=8.5, rgb=SLATE, h=4.3,
    )
    pdf.ln(14)
    y = pdf.get_y()
    pdf.set_draw_color(*SLATE)
    pdf.set_line_width(0.3)
    pdf.line(MARGIN, y, MARGIN + 70, y)
    pdf.line(PAGE_W - MARGIN - 50, y, PAGE_W - MARGIN, y)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*SLATE)
    pdf.set_xy(MARGIN, y + 1.5)
    pdf.cell(70, 4, "Reviewing clinician (name and signature)")
    pdf.set_xy(PAGE_W - MARGIN - 50, y + 1.5)
    pdf.cell(50, 4, "Date")

    return bytes(pdf.output())
