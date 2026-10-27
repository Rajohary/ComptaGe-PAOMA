import io
from decimal import Decimal
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from apps.referentiel.models import PeriodeGestion
from apps.comptabilite.models import Mouvement, MouvementEncaisse, SectionComptable
from apps.comptabilite.services import calcul_situation_comptable


def generer_ecritures_g58_excel(periode: PeriodeGestion) -> io.BytesIO:
    """
    Génère le classeur Excel (.xlsx) complet du Journal G58 pour une période de gestion donnée :
      - Feuille 1 : 'Écritures G58' (Mouvements détaillés, montants déclarés, redressements, soldes)
      - Feuille 2 : 'Situation Comptable' (Synthèse balance Débit / Crédit, reports et soldes finaux)
      - Feuille 3 : 'Mouvements Encaisse' (Flux de caisse physique, entrées et sorties)
    """
    wb = openpyxl.Workbook()

    # Palette graphique aux couleurs officielles Paositra Malagasy
    navy_dark = "0B2838"
    blue_header = "1E3A8A"
    blue_sub = "0284C7"
    light_blue = "E0F2FE"
    gray_light = "F8FAFC"
    yellow_light = "FEF3C7"
    green_soft = "DCFCE7"

    font_title = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    font_section = Font(name="Calibri", size=11, bold=True, color=navy_dark)
    font_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=10, bold=True)
    font_regular = Font(name="Calibri", size=10)
    font_italic = Font(name="Calibri", size=9, italic=True, color="475569")

    fill_title = PatternFill(start_color=navy_dark, end_color=navy_dark, fill_type="solid")
    fill_header = PatternFill(start_color=blue_header, end_color=blue_header, fill_type="solid")
    fill_sub_header = PatternFill(start_color=blue_sub, end_color=blue_sub, fill_type="solid")
    fill_total = PatternFill(start_color=yellow_light, end_color=yellow_light, fill_type="solid")
    fill_accent = PatternFill(start_color=light_blue, end_color=light_blue, fill_type="solid")

    thin_border_side = Side(border_style="thin", color="CBD5E1")
    double_bottom_side = Side(border_style="double", color="0F172A")
    thick_top_side = Side(border_style="thin", color="0F172A")

    border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    border_total = Border(left=thin_border_side, right=thin_border_side, top=thick_top_side, bottom=double_bottom_side)

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    num_format_currency = "#,##0.00\\ \"Ar\""
    num_format_date = "YYYY-MM-DD"

    # =========================================================================
    # FEUILLE 1 : Écritures G58
    # =========================================================================
    ws1 = wb.active
    ws1.title = "Écritures G58"
    ws1.views.sheetView[0].showGridLines = True

    # Bannière Titre
    ws1.merge_cells("A1:I1")
    title_cell = ws1["A1"]
    title_cell.value = "PAOSITRA MALAGASY — JOURNAL GÉNÉRAL G58"
    title_cell.font = font_title
    title_cell.fill = fill_title
    title_cell.alignment = align_center
    ws1.row_dimensions[1].height = 32

    # Cartouche Métadonnées
    bureau = periode.bureau
    ws1["A3"] = "Bureau de Poste :"
    ws1["B3"] = f"{bureau.nom_bureau} (NCODIQUE: {bureau.ncodique})"
    ws1["D3"] = "Classe :"
    ws1["E3"] = bureau.classe or "N/A"
    ws1["G3"] = "Province :"
    ws1["H3"] = bureau.province.nom if bureau.province else "N/A"

    ws1["A4"] = "Receveur :"
    ws1["B4"] = periode.nom_receveur
    ws1["D4"] = "Début Période :"
    ws1["E4"] = str(periode.date_debut)
    ws1["G4"] = "Fin Période :"
    ws1["H4"] = str(periode.date_fin) if periode.date_fin else "En cours"

    for r in [3, 4]:
        for c in ["A", "D", "G"]:
            ws1[f"{c}{r}"].font = font_bold
        for c in ["B", "E", "H"]:
            ws1[f"{c}{r}"].font = font_regular

    # En-têtes du tableau
    headers1 = [
        "N° Opération",
        "Date Opération",
        "Sens",
        "Section",
        "Code Compte",
        "Libellé de l'Opération",
        "Montant Déclaré",
        "Augmentation (+)",
        "Diminution (-)",
        "Net Rectifié",
        "Motif de Rectification",
        "Opérateur de Saisie",
    ]

    header_row1 = 6
    ws1.row_dimensions[header_row1].height = 24
    for col_idx, header in enumerate(headers1, start=1):
        cell = ws1.cell(row=header_row1, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = border_cell

    # Données des mouvements
    mouvements = Mouvement.objects.filter(periode_gestion=periode).select_related(
        "ligne_comptable__section", "saisi_par"
    ).order_by("date_operation", "id")

    current_row = 7
    total_declare = Decimal("0.00")
    total_aug = Decimal("0.00")
    total_dim = Decimal("0.00")
    total_rectif = Decimal("0.00")

    for m in mouvements:
        sens_label = "Débit" if m.ligne_comptable.section.sens == 1 else "Crédit" if m.ligne_comptable.section.sens == 2 else "Autre"
        sec_label = f"[{m.ligne_comptable.section.code}] {m.ligne_comptable.section.libelle}"
        compte = m.ligne_comptable.compte or "—"
        libelle = m.ligne_comptable.libelle

        m_dec = m.montant or Decimal("0.00")
        aug_dec = m.augmentation or Decimal("0.00")
        dim_dec = m.diminution or Decimal("0.00")
        rec_dec = m.montant_rectifie or Decimal("0.00")

        total_declare += m_dec
        total_aug += aug_dec
        total_dim += dim_dec
        total_rectif += rec_dec

        row_values = [
            m.id,
            str(m.date_operation),
            sens_label,
            sec_label,
            compte,
            libelle,
            float(m_dec),
            float(aug_dec),
            float(dim_dec),
            float(rec_dec),
            m.motif_rectification or "",
            m.saisi_par.username if m.saisi_par else "Système",
        ]

        ws1.row_dimensions[current_row].height = 19
        for col_idx, val in enumerate(row_values, start=1):
            cell = ws1.cell(row=current_row, column=col_idx, value=val)
            cell.font = font_regular
            cell.border = border_cell

            # Formatage spécifique selon colonne
            if col_idx in [1, 2, 3, 5]:
                cell.alignment = align_center
            elif col_idx in [4, 6, 11, 12]:
                cell.alignment = align_left
            elif col_idx in [7, 8, 9, 10]:
                cell.alignment = align_right
                cell.number_format = num_format_currency

        current_row += 1

    # Ligne Total général
    ws1.row_dimensions[current_row].height = 22
    ws1.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
    tot_label = ws1.cell(row=current_row, column=1, value="TOTAL DES OPÉRATIONS DU JOURNAL G58")
    tot_label.font = font_bold
    tot_label.fill = fill_total
    tot_label.alignment = align_right

    for c in range(1, 7):
        ws1.cell(row=current_row, column=c).border = border_total
        ws1.cell(row=current_row, column=c).fill = fill_total

    totals_vals = [float(total_declare), float(total_aug), float(total_dim), float(total_rectif)]
    for idx, tval in enumerate(totals_vals, start=7):
        tcell = ws1.cell(row=current_row, column=idx, value=tval)
        tcell.font = font_bold
        tcell.fill = fill_total
        tcell.alignment = align_right
        tcell.number_format = num_format_currency
        tcell.border = border_total

    for c in [11, 12]:
        cc = ws1.cell(row=current_row, column=c, value="")
        cc.border = border_total
        cc.fill = fill_total

    # =========================================================================
    # FEUILLE 2 : Situation Comptable (Balance & Synthèse)
    # =========================================================================
    ws2 = wb.create_sheet(title="Situation Comptable")
    ws2.views.sheetView[0].showGridLines = True

    ws2.merge_cells("A1:F1")
    t2 = ws2["A1"]
    t2.value = "SITUATION COMPTABLE & BALANCE DU BORDEREAU G58"
    t2.font = font_title
    t2.fill = fill_title
    t2.alignment = align_center
    ws2.row_dimensions[1].height = 30

    situation = calcul_situation_comptable(periode)
    totaux_sec = situation.get("totaux_sections", {})

    headers2 = ["Sens", "Code Section", "Libellé de la Section", "Total Déclaré", "Total Net Rectifié"]
    ws2.row_dimensions[4].height = 22
    for col_idx, h in enumerate(headers2, start=1):
        c = ws2.cell(row=4, column=col_idx, value=h)
        c.font = font_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_cell

    sections = SectionComptable.objects.filter(actif=True).order_by("sens", "ordre", "code")
    r2 = 5
    for sec in sections:
        sens_str = "DÉBIT" if sec.sens == 1 else "CRÉDIT" if sec.sens == 2 else "NON APPLICABLE"
        sec_data = totaux_sec.get(f"{sec.sens}_{sec.code}", totaux_sec.get(sec.code, {}))
        dec = sec_data.get("total_declare", Decimal("0.00"))
        rect = sec_data.get("total_rectifie", Decimal("0.00"))

        ws2.row_dimensions[r2].height = 19
        ws2.cell(row=r2, column=1, value=sens_str).alignment = align_center
        ws2.cell(row=r2, column=2, value=sec.code).alignment = align_center
        ws2.cell(row=r2, column=3, value=sec.libelle).alignment = align_left
        
        c_dec = ws2.cell(row=r2, column=4, value=float(dec))
        c_dec.alignment = align_right
        c_dec.number_format = num_format_currency

        c_rec = ws2.cell(row=r2, column=5, value=float(rect))
        c_rec.alignment = align_right
        c_rec.number_format = num_format_currency

        for col in range(1, 6):
            ws2.cell(row=r2, column=col).border = border_cell
            ws2.cell(row=r2, column=col).font = font_regular
        r2 += 1

    # Récapitulatif Débits / Crédits / Reports / Soldes
    r2 += 1
    summary_items = [
        ("Total Débits du Mois", float(situation.get("total_debit_mois", 0))),
        ("Total Crédits du Mois", float(situation.get("total_credit_mois", 0))),
        ("Solde Débiteur Reporté (M-1)", float(situation.get("solde_debiteur_reporte", 0))),
        ("Solde Créditeur Reporté (M-1)", float(situation.get("solde_crediteur_reporte", 0))),
        ("Cumul Général Débit", float(situation.get("cumul_debit", 0))),
        ("Cumul Général Crédit", float(situation.get("cumul_credit", 0))),
        ("SOLDE DÉBITEUR FINAL (À REPORTER)", float(situation.get("solde_debiteur_fin", 0))),
        ("SOLDE CRÉDITEUR FINAL (À REPORTER)", float(situation.get("solde_crediteur_fin", 0))),
    ]

    for label, val in summary_items:
        ws2.row_dimensions[r2].height = 20
        ws2.merge_cells(start_row=r2, start_column=1, end_row=r2, end_column=4)
        c_lbl = ws2.cell(row=r2, column=1, value=label)
        c_lbl.font = font_bold
        c_lbl.alignment = align_right
        
        c_val = ws2.cell(row=r2, column=5, value=val)
        c_val.font = font_bold
        c_val.alignment = align_right
        c_val.number_format = num_format_currency

        is_final = "FINAL" in label
        fill_row = fill_total if is_final else fill_accent
        for col in range(1, 6):
            ws2.cell(row=r2, column=col).border = border_total if is_final else border_cell
            ws2.cell(row=r2, column=col).fill = fill_row
        r2 += 1

    # =========================================================================
    # FEUILLE 3 : Mouvements Encaisse
    # =========================================================================
    ws3 = wb.create_sheet(title="Encaisse et Valeurs")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("A1:F1")
    t3 = ws3["A1"]
    t3.value = "SUIVI DE L'ENCAISSE PHYSIQUE ET DU COFFRE-FORT"
    t3.font = font_title
    t3.fill = fill_title
    t3.alignment = align_center
    ws3.row_dimensions[1].height = 30

    headers3 = ["Date", "Sens du Flux", "Catégorie", "Rubrique d'Encaisse", "Montant (Ar)", "Opérateur"]
    ws3.row_dimensions[4].height = 22
    for col_idx, h in enumerate(headers3, start=1):
        c = ws3.cell(row=4, column=col_idx, value=h)
        c.font = font_header
        c.fill = fill_header
        c.alignment = align_center
        c.border = border_cell

    mouvements_enc = MouvementEncaisse.objects.filter(periode_gestion=periode).select_related(
        "rubrique_encaisse__rubrique_parent", "saisi_par"
    ).order_by("date_operation", "id")

    r3 = 5
    tot_entrees = Decimal("0.00")
    tot_sorties = Decimal("0.00")

    for me in mouvements_enc:
        sens_txt = "Entrée (+)" if me.sens == 1 else "Sortie (-)"
        parent_txt = me.rubrique_encaisse.rubrique_parent.libelle if me.rubrique_encaisse and me.rubrique_encaisse.rubrique_parent else "—"
        rub_txt = me.rubrique_encaisse.libelle if me.rubrique_encaisse else "—"
        montant_val = me.montant or Decimal("0.00")

        if me.sens == 1:
            tot_entrees += montant_val
        else:
            tot_sorties += montant_val

        ws3.row_dimensions[r3].height = 19
        ws3.cell(row=r3, column=1, value=str(me.date_operation)).alignment = align_center
        ws3.cell(row=r3, column=2, value=sens_txt).alignment = align_center
        ws3.cell(row=r3, column=3, value=parent_txt).alignment = align_left
        ws3.cell(row=r3, column=4, value=rub_txt).alignment = align_left
        
        c_m = ws3.cell(row=r3, column=5, value=float(montant_val))
        c_m.alignment = align_right
        c_m.number_format = num_format_currency

        ws3.cell(row=r3, column=6, value=me.saisi_par.username if me.saisi_par else "").alignment = align_center

        for col in range(1, 7):
            ws3.cell(row=r3, column=col).border = border_cell
            ws3.cell(row=r3, column=col).font = font_regular
        r3 += 1

    # Résumé Encaisse
    r3 += 1
    encaisse_recap = [
        ("Total des Entrées d'Encaisse (+)", float(tot_entrees)),
        ("Total des Sorties d'Encaisse (-)", float(tot_sorties)),
        ("Variation Nette d'Encaisse", float(tot_entrees - tot_sorties)),
        ("Réserve Numéraire Déclarée à l'Ouverture", float(periode.reserve_numeraire or 0)),
        ("Valeurs Postales Déclarées à l'Ouverture", float(periode.valeurs_postales or 0)),
        ("Timbres Fiscaux Déclarés à l'Ouverture", float(periode.timbres_fiscaux or 0)),
    ]

    for label, val in encaisse_recap:
        ws3.row_dimensions[r3].height = 20
        ws3.merge_cells(start_row=r3, start_column=1, end_row=r3, end_column=4)
        c_lbl = ws3.cell(row=r3, column=1, value=label)
        c_lbl.font = font_bold
        c_lbl.alignment = align_right
        
        c_val = ws3.cell(row=r3, column=5, value=val)
        c_val.font = font_bold
        c_val.alignment = align_right
        c_val.number_format = num_format_currency

        for col in range(1, 7):
            ws3.cell(row=r3, column=col).border = border_cell
            ws3.cell(row=r3, column=col).fill = fill_accent
        r3 += 1

    # Ajustement automatique de la largeur des colonnes pour toutes les feuilles
    for ws in [ws1, ws2, ws3]:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                # Ignorer les cellules fusionnées de titre (ligne 1)
                if cell.row == 1:
                    continue
                val_str = str(cell.value or "")
                if len(val_str) > max_len:
                    max_len = len(val_str)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # Sauvegarde dans le buffer en mémoire
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
