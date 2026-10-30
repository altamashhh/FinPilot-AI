"""
Financial Report Generation Routes
====================================
Provides two export endpoints for the authenticated user:

  GET /report/pdf  — Full financial report as a styled PDF (ReportLab)
  GET /report/csv  — All transactions as a plain CSV file

Both endpoints are protected by JWT authentication and follow the same
dependency-injection pattern as every other route in this project.
"""

import csv
import io
import logging
from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

# ── Internal imports (same pattern as all other routes) ─────────────
from database import get_db
from models.budget import Budget
from models.transaction import Transaction
from models.user import User
from services.ai_advisor import get_ai_advice
from services.dashboard import get_dashboard
from utils.security import get_current_user

# ── ReportLab imports ────────────────────────────────────────────────
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/report",
    tags=["Reports"],
)

# ── Brand colour palette (matches WealthAI design language) ──────────
BRAND_DARK_BLUE = colors.HexColor("#00236f")
BRAND_MID_BLUE  = colors.HexColor("#4d7ef2")
BRAND_GREEN     = colors.HexColor("#006c49")
BRAND_LIGHT     = colors.HexColor("#f7f9fb")
BRAND_GREY      = colors.HexColor("#444651")
BRAND_RED       = colors.HexColor("#ba1a1a")
BRAND_ACCENT    = colors.HexColor("#dce1ff")
WHITE           = colors.white
BLACK           = colors.black


# ═══════════════════════════════════════════════════════════════════
# PDF Endpoint
# ═══════════════════════════════════════════════════════════════════

@router.get("/pdf", summary="Generate full financial report as PDF")
def generate_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and stream a comprehensive PDF financial report for the
    authenticated user.  Includes:
      - WealthAI branding header
      - Report generation date & user email
      - Financial summary (income, expenses, savings, savings rate)
      - Budget summary table
      - Full transaction history table
      - AI-generated financial insights (with fallback)
    """
    try:
        # ── Gather data ──────────────────────────────────────────────
        dashboard = get_dashboard(db, current_user.id)

        transactions: List[Transaction] = (
            db.query(Transaction)
            .filter(Transaction.user_id == current_user.id)
            .order_by(Transaction.transaction_date.desc())
            .all()
        )

        budgets: List[Budget] = (
            db.query(Budget)
            .filter(Budget.user_id == current_user.id)
            .all()
        )

        # AI insights with graceful fallback
        try:
            ai_advice: List[str] = get_ai_advice(db, current_user.id)
        except Exception as ai_err:
            logger.warning("AI advice generation failed: %s", ai_err)
            ai_advice = [
                "Review your spending patterns and compare against monthly budgets.",
                "Aim to save at least 20% of your monthly income.",
                "Consider setting budgets for your top spending categories.",
            ]

        # ── Build PDF in memory ──────────────────────────────────────
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
            title="WealthAI Financial Report",
            author="WealthAI",
        )

        styles = _build_styles()
        story = []

        # ── Section 1: Branding Header ───────────────────────────────
        story.append(Paragraph("WealthAI", styles["BrandTitle"]))
        story.append(Paragraph("Personal Financial Report", styles["BrandSubtitle"]))
        story.append(Spacer(1, 4 * mm))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_DARK_BLUE))
        story.append(Spacer(1, 4 * mm))

        # ── Section 2: Report Metadata ───────────────────────────────
        report_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        story.append(Paragraph(f"<b>Report Generated:</b> {report_date}", styles["MetaText"]))
        story.append(Paragraph(f"<b>Account:</b> {current_user.email}", styles["MetaText"]))
        story.append(Spacer(1, 8 * mm))

        # ── Section 3: Financial Summary ─────────────────────────────
        story.append(Paragraph("Financial Summary", styles["SectionHeader"]))
        story.append(Spacer(1, 3 * mm))

        savings_rate = 0.0
        if dashboard.total_income > 0:
            savings_rate = round(
                (dashboard.savings / dashboard.total_income) * 100, 2
            )

        summary_data = [
            ["Metric", "Amount"],
            ["Total Income",   f"Rs. {dashboard.total_income:,.2f}"],
            ["Total Expenses", f"Rs. {dashboard.total_expense:,.2f}"],
            ["Net Savings",    f"Rs. {dashboard.savings:,.2f}"],
            ["Savings Rate",   f"{savings_rate}%"],
        ]
        story.append(_build_summary_table(summary_data, styles))
        story.append(Spacer(1, 8 * mm))

        # ── Section 4: Budget Summary ────────────────────────────────
        story.append(Paragraph("Budget Summary", styles["SectionHeader"]))
        story.append(Spacer(1, 3 * mm))

        if budgets:
            # Build a lookup from the dashboard budget_utilization list
            utilization_map = {
                bu.category: bu for bu in dashboard.budget_utilization
            }

            budget_rows = [["Category", "Budget Limit", "Amount Spent", "Remaining"]]
            for b in budgets:
                bu = utilization_map.get(b.category)
                spent = bu.spent if bu else 0.0
                remaining = b.limit_amount - spent
                budget_rows.append([
                    b.category,
                    f"Rs. {b.limit_amount:,.2f}",
                    f"Rs. {spent:,.2f}",
                    f"Rs. {remaining:,.2f}",
                ])
            story.append(_build_data_table(budget_rows, styles))
        else:
            story.append(Paragraph("No budgets configured.", styles["BodyText"]))

        story.append(Spacer(1, 8 * mm))

        # ── Section 5: Transaction History ───────────────────────────
        story.append(Paragraph("Transaction History", styles["SectionHeader"]))
        story.append(Spacer(1, 3 * mm))

        if transactions:
            tx_rows = [["Date", "Description", "Category", "Type", "Amount"]]
            for tx in transactions:
                tx_date = (
                    tx.transaction_date.strftime("%d %b %Y")
                    if isinstance(tx.transaction_date, (date, datetime))
                    else str(tx.transaction_date)
                )
                amount_str = f"Rs. {abs(tx.amount):,.2f}"
                tx_rows.append([
                    tx_date,
                    tx.description[:40],          # cap width for PDF layout
                    tx.category,
                    tx.transaction_type.capitalize(),
                    amount_str,
                ])
            story.append(_build_transaction_table(tx_rows, styles))
        else:
            story.append(Paragraph("No transactions recorded.", styles["BodyText"]))

        story.append(Spacer(1, 8 * mm))

        # ── Section 6: AI Financial Insights ────────────────────────
        story.append(Paragraph("AI Financial Insights", styles["SectionHeader"]))
        story.append(Spacer(1, 2 * mm))
        story.append(
            Paragraph(
                "The following personalised recommendations were generated by the WealthAI intelligence engine:",
                styles["BodyText"],
            )
        )
        story.append(Spacer(1, 3 * mm))

        for i, tip in enumerate(ai_advice, start=1):
            story.append(
                Paragraph(f"{i}. {tip}", styles["InsightBullet"])
            )
            story.append(Spacer(1, 2 * mm))

        story.append(Spacer(1, 6 * mm))
        story.append(HRFlowable(width="100%", thickness=1, color=BRAND_GREY))
        story.append(Spacer(1, 3 * mm))
        story.append(
            Paragraph(
                "This report is generated automatically by WealthAI. For personalised advice, consult a licensed financial advisor.",
                styles["FooterText"],
            )
        )

        # ── Build & return ────────────────────────────────────────────
        doc.build(story)
        buffer.seek(0)

        filename = f"wealthai_report_{date.today().isoformat()}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except Exception as exc:
        logger.error("PDF generation failed for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF report. Please try again.",
        )


# ═══════════════════════════════════════════════════════════════════
# CSV Endpoint
# ═══════════════════════════════════════════════════════════════════

@router.get("/csv", summary="Export all transactions as CSV")
def generate_csv_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export all transactions for the authenticated user as a plain CSV file.
    Columns: Date, Description, Category, Type, Amount
    """
    try:
        transactions: List[Transaction] = (
            db.query(Transaction)
            .filter(Transaction.user_id == current_user.id)
            .order_by(Transaction.transaction_date.desc())
            .all()
        )

        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        writer.writerow(["Date", "Description", "Category", "Type", "Amount (Rs.)"])

        # Data rows
        for tx in transactions:
            tx_date = (
                tx.transaction_date.strftime("%Y-%m-%d")
                if isinstance(tx.transaction_date, (date, datetime))
                else str(tx.transaction_date)
            )
            writer.writerow([
                tx_date,
                tx.description,
                tx.category,
                tx.transaction_type,
                f"{abs(tx.amount):.2f}",
            ])

        output.seek(0)
        filename = f"wealthai_transactions_{date.today().isoformat()}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except Exception as exc:
        logger.error("CSV generation failed for user %s: %s", current_user.id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate CSV report. Please try again.",
        )


# ═══════════════════════════════════════════════════════════════════
# PDF Style Helpers (kept private to this module)
# ═══════════════════════════════════════════════════════════════════

def _build_styles() -> dict:
    """Build and return a custom style dictionary for the WealthAI PDF."""
    base = getSampleStyleSheet()

    styles = {
        # ── Title / Branding ─────────────────────────────────────────
        "BrandTitle": ParagraphStyle(
            "BrandTitle",
            parent=base["Title"],
            fontSize=28,
            textColor=BRAND_DARK_BLUE,
            spaceAfter=2,
            fontName="Helvetica-Bold",
            alignment=TA_LEFT,
        ),
        "BrandSubtitle": ParagraphStyle(
            "BrandSubtitle",
            parent=base["Normal"],
            fontSize=12,
            textColor=BRAND_GREY,
            spaceAfter=6,
            fontName="Helvetica",
            alignment=TA_LEFT,
        ),
        # ── Metadata row ──────────────────────────────────────────────
        "MetaText": ParagraphStyle(
            "MetaText",
            parent=base["Normal"],
            fontSize=9,
            textColor=BRAND_GREY,
            spaceAfter=2,
            fontName="Helvetica",
        ),
        # ── Section headers ───────────────────────────────────────────
        "SectionHeader": ParagraphStyle(
            "SectionHeader",
            parent=base["Heading2"],
            fontSize=13,
            textColor=BRAND_DARK_BLUE,
            fontName="Helvetica-Bold",
            spaceAfter=2,
            borderPad=4,
        ),
        # ── Body text ─────────────────────────────────────────────────
        "BodyText": ParagraphStyle(
            "BodyText",
            parent=base["Normal"],
            fontSize=9,
            textColor=BLACK,
            fontName="Helvetica",
            spaceAfter=4,
        ),
        # ── AI insight bullet ─────────────────────────────────────────
        "InsightBullet": ParagraphStyle(
            "InsightBullet",
            parent=base["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#1e3a8a"),
            fontName="Helvetica",
            leftIndent=10,
            spaceAfter=2,
        ),
        # ── Footer ────────────────────────────────────────────────────
        "FooterText": ParagraphStyle(
            "FooterText",
            parent=base["Normal"],
            fontSize=7,
            textColor=BRAND_GREY,
            fontName="Helvetica-Oblique",
            alignment=TA_CENTER,
        ),
        # ── Table header cell text ─────────────────────────────────────
        "TableHeader": ParagraphStyle(
            "TableHeader",
            parent=base["Normal"],
            fontSize=9,
            textColor=WHITE,
            fontName="Helvetica-Bold",
            alignment=TA_LEFT,
        ),
        # ── Table cell text ────────────────────────────────────────────
        "TableCell": ParagraphStyle(
            "TableCell",
            parent=base["Normal"],
            fontSize=8,
            textColor=BLACK,
            fontName="Helvetica",
        ),
    }
    return styles


def _build_summary_table(data: list, styles: dict) -> Table:
    """Build a two-column key/value summary table."""
    col_widths = [90 * mm, 70 * mm]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",   (0, 0), (-1, 0), BRAND_DARK_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0), WHITE),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0), 9),
        ("ALIGN",        (0, 0), (-1, 0), "LEFT"),
        ("BOTTOMPADDING",(0, 0), (-1, 0), 6),
        ("TOPPADDING",   (0, 0), (-1, 0), 6),
        # Data rows alternating shading
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_ACCENT]),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 9),
        ("TOPPADDING",   (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 1), (-1, -1), 5),
        # Grid
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#c5c5d3")),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def _build_data_table(data: list, styles: dict) -> Table:
    """Build a generic multi-column data table (budget summary)."""
    n_cols = len(data[0])
    col_width = (170 * mm) / n_cols
    col_widths = [col_width] * n_cols

    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), BRAND_DARK_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0), WHITE),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0), 9),
        ("ALIGN",        (0, 0), (-1, 0), "LEFT"),
        ("TOPPADDING",   (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING",(0, 0), (-1, 0), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_ACCENT]),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 8),
        ("TOPPADDING",   (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 1), (-1, -1), 4),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#c5c5d3")),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def _build_transaction_table(data: list, styles: dict) -> Table:
    """Build the transaction history table with 5 columns."""
    # Date | Description | Category | Type | Amount
    col_widths = [22 * mm, 62 * mm, 32 * mm, 22 * mm, 32 * mm]

    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header
        ("BACKGROUND",   (0, 0), (-1, 0), BRAND_DARK_BLUE),
        ("TEXTCOLOR",    (0, 0), (-1, 0), WHITE),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0), 8),
        ("ALIGN",        (0, 0), (-1, 0), "LEFT"),
        ("TOPPADDING",   (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING",(0, 0), (-1, 0), 6),
        # Alternating rows
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, BRAND_LIGHT]),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 7.5),
        ("TOPPADDING",   (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 1), (-1, -1), 4),
        # Right-align amount column
        ("ALIGN",        (4, 1), (4, -1), "RIGHT"),
        # Grid
        ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#e6e8ea")),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table
