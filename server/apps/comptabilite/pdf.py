import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

from apps.referentiel.models import PeriodeGestion
from apps.comptabilite.models import Mouvement, MouvementEncaisse, SectionComptable
from apps.comptabilite.services import calcul_situation_comptable


def format_montant(val):
    if val is None or val == "":
        return "0,00"
    try:
        d = Decimal(str(val))
        return f"{d:,.2f}".replace(",", " ").replace(".", ",")
    except Exception:
        return str(val)


def generer_bordereau_g58_pdf(periode: PeriodeGestion) -> io.BytesIO:
    """
    Génère le bordereau officiel Journal G58 de Paositra Malagasy au format PDF.
    Présentation fidèle au formulaire officiel papier :
      - En-tête officiel Paositra Malagasy & Titre G58
      - Cartouche du Bureau de poste, Receveur et Période
      - Tableau de Situation Comptable récapitulative (Sections Débit & Crédit, Reports & Soldes)
      - Détail des opérations du Journal G58 (Mouvements comptables imputés)
      - Situation de l'Encaisse physique et du coffre
      - Zone d'émargement et visa légal (Receveur et Inspecteur)
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    story = []
    styles = getSampleStyleSheet()

    # Styles personnalisés
    color_primary = colors.HexColor("#0B2838")   # Bleu marine Paoma
    color_accent = colors.HexColor("#0284C7")    # Bleu accent
    color_gold = colors.HexColor("#F59E0B")      # Doré postal
    color_light_bg = colors.HexColor("#F8FAFC")
    color_border = colors.HexColor("#CBD5E1")

    title_style = ParagraphStyle(
        "G58Title",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        textColor=color_primary,
        alignment=1, # Centré
    )
    subtitle_style = ParagraphStyle(
        "G58SubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=color_gold,
        alignment=1,
    )
    section_title = ParagraphStyle(
        "G58SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=color_primary,
    )
    cell_style = ParagraphStyle(
        "G58Cell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.black,
    )
    cell_bold = ParagraphStyle(
        "G58CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=color_primary,
    )
    cell_right = ParagraphStyle(
        "G58CellRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.black,
        alignment=2, # Aligné à droite
    )
    cell_right_bold = ParagraphStyle(
        "G58CellRightBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=color_primary,
        alignment=2,
    )

    # 1. En-tête officiel
    header_data = [
        [
            Paragraph("<b>REPOBLIKAN'I MADAGASIKARA</b><br/><i>Fitiavana - Tanindrazana - Fandrosoana</i><br/><b>PAOSITRA MALAGASY</b>", cell_style),
            Paragraph("<b>JOURNAL GÉNÉRAL G58</b><br/><font color='#0284C7'>BORDEREAU MENSUEL DE GESTION</font>", title_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[6.5 * cm, 11.5 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=color_primary, spaceAfter=8))

    # 2. Cartouche du Bureau & Période
    bureau = periode.bureau
    date_fin_str = str(periode.date_fin) if periode.date_fin else "En cours (Non clôturée)"
    bureau_info = [
        [
            Paragraph(f"<b>Bureau :</b> {bureau.nom_bureau} (NCODIQUE: {bureau.ncodique})", cell_style),
            Paragraph(f"<b>Classe :</b> {bureau.classe or 'N/A'}", cell_style),
            Paragraph(f"<b>Province :</b> {bureau.province.nom if bureau.province else 'N/A'}", cell_style),
        ],
        [
            Paragraph(f"<b>Receveur :</b> {periode.nom_receveur}", cell_style),
            Paragraph(f"<b>Période du :</b> {periode.date_debut}", cell_style),
            Paragraph(f"<b>Au :</b> {date_fin_str}", cell_style),
        ],
    ]
    info_table = Table(bureau_info, colWidths=[8.0 * cm, 4.5 * cm, 5.5 * cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color_light_bg),
        ('BOX', (0,0), (-1,-1), 0.5, color_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, color_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.4 * cm))

    # 3. Tableau de Situation Comptable Synthétique (Balance G58)
    situation = calcul_situation_comptable(periode)
    totaux_sec = situation.get("totaux_sections", {})

    story.append(Paragraph("I. BALANCE ET SITUATION COMPTABLE RÉCAPITULATIVE (EN ARIARY)", section_title))
    story.append(Spacer(1, 0.15 * cm))

    # Récupération des sections actives
    sections = SectionComptable.objects.filter(actif=True).order_by("sens", "ordre", "code")
    sections_debit = [s for s in sections if s.sens == SectionComptable.Sens.DEBIT]
    sections_credit = [s for s in sections if s.sens == SectionComptable.Sens.CREDIT]

    max_rows = max(len(sections_debit), len(sections_credit))
    balance_rows = [
        [
            Paragraph("<b>DÉBIT (RECETTES)</b>", cell_bold),
            Paragraph("<b>Montant Rectifié</b>", cell_right_bold),
            Paragraph("<b>CRÉDIT (DÉPENSES)</b>", cell_bold),
            Paragraph("<b>Montant Rectifié</b>", cell_right_bold),
        ]
    ]

    for i in range(max_rows):
        # Colonne Débit
        if i < len(sections_debit):
            sec_d = sections_debit[i]
            val_d = totaux_sec.get(f"1_{sec_d.code}", {}).get("total_rectifie", Decimal("0.00"))
            cell_d_label = Paragraph(f"Section {sec_d.code} : {sec_d.libelle}", cell_style)
            cell_d_val = Paragraph(format_montant(val_d), cell_right)
        else:
            cell_d_label = Paragraph("", cell_style)
            cell_d_val = Paragraph("", cell_right)

        # Colonne Crédit
        if i < len(sections_credit):
            sec_c = sections_credit[i]
            val_c = totaux_sec.get(f"2_{sec_c.code}", {}).get("total_rectifie", Decimal("0.00"))
            cell_c_label = Paragraph(f"Section {sec_c.code} : {sec_c.libelle}", cell_style)
            cell_c_val = Paragraph(format_montant(val_c), cell_right)
        else:
            cell_c_label = Paragraph("", cell_style)
            cell_c_val = Paragraph("", cell_right)

        balance_rows.append([cell_d_label, cell_d_val, cell_c_label, cell_c_val])

    # Lignes de totaux du mois
    balance_rows.append([
        Paragraph("<b>Total Débits du mois</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('total_debit_mois'))}</b>", cell_right_bold),
        Paragraph("<b>Total Crédits du mois</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('total_credit_mois'))}</b>", cell_right_bold),
    ])

    # Reports
    balance_rows.append([
        Paragraph("<b>Solde Débiteur Reporté</b>", cell_style),
        Paragraph(format_montant(situation.get("solde_debiteur_reporte")), cell_right),
        Paragraph("<b>Solde Créditeur Reporté</b>", cell_style),
        Paragraph(format_montant(situation.get("solde_crediteur_reporte")), cell_right),
    ])

    # Cumuls
    balance_rows.append([
        Paragraph("<b>Cumul Général Débit</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('cumul_debit'))}</b>", cell_right_bold),
        Paragraph("<b>Cumul Général Crédit</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('cumul_credit'))}</b>", cell_right_bold),
    ])

    # Solde de fin
    balance_rows.append([
        Paragraph("<b>SOLDE DÉBITEUR FINAL</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('solde_debiteur_fin'))}</b>", cell_right_bold),
        Paragraph("<b>SOLDE CRÉDITEUR FINAL</b>", cell_bold),
        Paragraph(f"<b>{format_montant(situation.get('solde_crediteur_fin'))}</b>", cell_right_bold),
    ])

    balance_table = Table(balance_rows, colWidths=[6.0 * cm, 3.0 * cm, 6.0 * cm, 3.0 * cm])
    balance_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
        ('BOX', (0,0), (-1,-1), 0.5, color_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.5, color_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0, -4), (-1, -4), 1, color_primary),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#FEF3C7")), # Jaune clair pour le solde final
    ]))
    story.append(balance_table)
    story.append(Spacer(1, 0.4 * cm))

    # 4. Détail des Mouvements enregistrés
    story.append(Paragraph("II. DÉTAIL DES OPÉRATIONS DU JOURNAL G58", section_title))
    story.append(Spacer(1, 0.15 * cm))

    mouvements = Mouvement.objects.filter(periode_gestion=periode).select_related(
        "ligne_comptable__section", "saisi_par"
    ).order_by("date_operation", "ligne_comptable__section__sens", "ligne_comptable__compte")

    mvt_headers = [
        Paragraph("<b>Date</b>", cell_bold),
        Paragraph("<b>Sens</b>", cell_bold),
        Paragraph("<b>Compte</b>", cell_bold),
        Paragraph("<b>Libellé de l'opération</b>", cell_bold),
        Paragraph("<b>Montant Initial</b>", cell_right_bold),
        Paragraph("<b>Augm. (+)</b>", cell_right_bold),
        Paragraph("<b>Dim. (-)</b>", cell_right_bold),
        Paragraph("<b>Net Rectifié</b>", cell_right_bold),
    ]
    mvt_rows = [mvt_headers]

    for m in mouvements:
        sens_label = "Débit" if m.ligne_comptable.section.sens == 1 else "Crédit" if m.ligne_comptable.section.sens == 2 else "Autre"
        mvt_rows.append([
            Paragraph(str(m.date_operation), cell_style),
            Paragraph(sens_label, cell_style),
            Paragraph(m.ligne_comptable.compte or "—", cell_style),
            Paragraph(m.ligne_comptable.libelle[:35], cell_style),
            Paragraph(format_montant(m.montant), cell_right),
            Paragraph(format_montant(m.augmentation) if m.augmentation > 0 else "—", cell_right),
            Paragraph(format_montant(m.diminution) if m.diminution > 0 else "—", cell_right),
            Paragraph(f"<b>{format_montant(m.montant_rectifie)}</b>", cell_right_bold),
        ])

    if len(mouvements) == 0:
        mvt_rows.append([
            Paragraph("<i>Aucune écriture comptable enregistrée pour cette période.</i>", cell_style),
            "", "", "", "", "", "", ""
        ])

    mvt_table = Table(
        mvt_rows,
        colWidths=[2.0 * cm, 1.4 * cm, 1.8 * cm, 5.0 * cm, 2.2 * cm, 1.8 * cm, 1.8 * cm, 2.0 * cm]
    )
    mvt_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
        ('BOX', (0,0), (-1,-1), 0.5, color_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.5, color_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]
    if len(mouvements) == 0:
        mvt_style.append(('SPAN', (0, 1), (-1, 1)))

    mvt_table.setStyle(TableStyle(mvt_style))
    story.append(mvt_table)
    story.append(Spacer(1, 0.4 * cm))

    # 5. Situation de l'Encaisse et Valeurs
    story.append(Paragraph("III. SITUATION DE L'ENCAISSE ET VALEURS EN COFFRE", section_title))
    story.append(Spacer(1, 0.15 * cm))

    encaisse_data = [
        [
            Paragraph("<b>Désignation de la réserve</b>", cell_bold),
            Paragraph("<b>Montant à l'ouverture (Ariary)</b>", cell_right_bold),
            Paragraph("<b>Arrêté au constat (Ariary)</b>", cell_right_bold),
        ],
        [
            Paragraph("Réserve en Numéraire (Espèces physiques)", cell_style),
            Paragraph(format_montant(periode.reserve_numeraire), cell_right),
            Paragraph(format_montant(periode.reserve_numeraire), cell_right),
        ],
        [
            Paragraph("Valeurs Postales en coffre", cell_style),
            Paragraph(format_montant(periode.valeurs_postales), cell_right),
            Paragraph(format_montant(periode.valeurs_postales), cell_right),
        ],
        [
            Paragraph("Timbres Fiscaux", cell_style),
            Paragraph(format_montant(periode.timbres_fiscaux), cell_right),
            Paragraph(format_montant(periode.timbres_fiscaux), cell_right),
        ],
        [
            Paragraph("<b>TOTAL GÉNÉRAL DE L'ENCAISSE ET VALEURS</b>", cell_bold),
            Paragraph(
                f"<b>{format_montant(periode.reserve_numeraire + periode.valeurs_postales + periode.timbres_fiscaux)}</b>",
                cell_right_bold
            ),
            Paragraph(
                f"<b>{format_montant(periode.reserve_numeraire + periode.valeurs_postales + periode.timbres_fiscaux)}</b>",
                cell_right_bold
            ),
        ],
    ]
    encaisse_table = Table(encaisse_data, colWidths=[9.0 * cm, 4.5 * cm, 4.5 * cm])
    encaisse_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
        ('BOX', (0,0), (-1,-1), 0.5, color_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.5, color_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
    ]))
    story.append(encaisse_table)
    story.append(Spacer(1, 0.6 * cm))

    # 6. Zone de signatures et visas
    signatures = [
        [
            Paragraph("<b>Le Receveur des Postes</b><br/><br/><br/><i>Nom, date et signature</i>", cell_style),
            Paragraph("<b>L'Inspecteur / Vérificateur des Postes</b><br/><br/><br/><i>Visa, observations et signature</i>", cell_style),
        ]
    ]
    sig_table = Table(signatures, colWidths=[9.0 * cm, 9.0 * cm])
    sig_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, color_primary),
        ('INNERGRID', (0,0), (-1,-1), 0.5, color_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 18),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(KeepTogether(sig_table))

    doc.build(story)
    buffer.seek(0)
    return buffer
