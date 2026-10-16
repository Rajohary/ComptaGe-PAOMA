/**
 * Fonctions utilitaires pures de formatage pour ComptaGeWeb.
 * Conforme à DESIGN.md (règles typographiques, tabular-nums pour montants,
 * format Ariary MGA sans séparateurs ambigus).
 */

/**
 * Formate un montant en Ariary (MGA) avec séparateurs de milliers (espaces insécables).
 * Exemple : "1500000.00" -> "1 500 000,00 Ar" (ou entier "1 500 000 Ar" si pas de centimes significatifs).
 */
export function formatAriary(amount: string | number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0 Ar';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) {
    return '0 Ar';
  }

  const hasDecimals = showDecimals && num % 1 !== 0;

  const formatted = new Intl.NumberFormat('fr-MG', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num);

  return `${formatted} Ar`;
}

/**
 * Formate une date ISO (YYYY-MM-DD ou horodatage) en date locale lisible (DD/MM/YYYY).
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formate un horodatage ISO en date et heure (DD/MM/YYYY à HH:mm).
 */
export function formatDateTime(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateTimeStr;
  }
}

/**
 * Formate un pourcentage avec une décimale.
 * Exemple : 42.5 -> "42.5 %"
 */
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0 %';
  return `${val.toFixed(1)} %`;
}
