/**
 * Fonctions utilitaires pures de formatage pour ComptaGeWeb.
 * Conforme à DESIGN.md (règles typographiques, tabular-nums pour montants,
 * format Ariary MGA sans séparateurs ambigus).
 */

/**
 * Formate un montant en Ariary (MGA) avec séparateurs de milliers (espaces insécables).
 * Exemple : "1500000.00" -> "1 500 000,00 Ar".
 * Par convention comptable institutionnelle, les montants sont toujours affichés avec 2 décimales.
 */
export function formatAriary(amount: string | number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined || amount === '') {
    return showDecimals ? '0,00 Ar' : '0 Ar';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) {
    return showDecimals ? '0,00 Ar' : '0 Ar';
  }

  const formatted = num.toLocaleString('fr-FR', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

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

/**
 * Nettoie une chaîne numérique en supprimant les espaces (séparateurs de milliers)
 * et en remplaçant la virgule décimale éventuelle par un point.
 */
export function cleanNumericString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, '').replace(',', '.');
}

/**
 * Convertit une chaîne potentiellement formatée avec espaces de milliers en nombre flottant.
 */
export function parseNumber(value: string | number | null | undefined, defaultValue = 0): number {
  const clean = cleanNumericString(value);
  if (!clean) return defaultValue;
  const num = Number(clean);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Formate une saisie en temps réel en insérant des espaces comme séparateurs de milliers.
 * Préserve le signe négatif éventuel et les décimales avec virgule ou point.
 */
export function formatThousandsInput(value: string): string {
  if (!value) return '';

  const isNegative = value.startsWith('-');
  // Retirer les caractères non autorisés sauf chiffres, virgule ou point
  let raw = value.replace(/[^0-9.,]/g, '');

  // Harmoniser le premier séparateur décimal (point ou virgule)
  let decimalChar = '';
  const firstComma = raw.indexOf(',');
  const firstDot = raw.indexOf('.');
  let decimalIndex = -1;

  if (firstComma !== -1 && firstDot !== -1) {
    decimalIndex = Math.min(firstComma, firstDot);
    decimalChar = raw[decimalIndex];
  } else if (firstComma !== -1) {
    decimalIndex = firstComma;
    decimalChar = ',';
  } else if (firstDot !== -1) {
    decimalIndex = firstDot;
    decimalChar = '.';
  }

  let integerDigits = '';
  let decimalDigits = '';

  if (decimalIndex !== -1) {
    integerDigits = raw.slice(0, decimalIndex).replace(/[^0-9]/g, '');
    decimalDigits = raw.slice(decimalIndex + 1).replace(/[^0-9]/g, '');
  } else {
    integerDigits = raw.replace(/[^0-9]/g, '');
  }

  // Insérer des espaces tous les 3 chiffres dans la partie entière
  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  let result = formattedInteger;
  if (decimalIndex !== -1) {
    result += decimalChar + decimalDigits;
  }

  return isNegative ? `-${result}` : result;
}
