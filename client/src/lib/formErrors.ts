import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import type { ApiError } from '../types';

/**
 * Associe de façon générique les erreurs de validation renvoyées par le backend Django
 * (format DRF : { field: ["message", ...], detail: "message" }) aux champs correspondants
 * d'un formulaire React Hook Form.
 *
 * @param apiErrors L'objet d'erreurs retourné par l'API (ApiError)
 * @param setError La fonction setError fournie par useForm
 * @param allowedFields Liste ou ensemble des noms de champs valides du formulaire
 */
export function applyServerValidationErrors<T extends FieldValues>(
  apiErrors: ApiError | undefined,
  setError: UseFormSetError<T>,
  allowedFields: (keyof T)[] | Set<string>
): void {
  if (!apiErrors) return;

  const fieldSet = allowedFields instanceof Set ? allowedFields : new Set(allowedFields as string[]);

  Object.entries(apiErrors).forEach(([field, messages]) => {
    if (field === 'detail') return;

    const messageText = Array.isArray(messages) ? messages[0] : (messages as string);

    if (fieldSet.has(field)) {
      setError(field as Path<T>, {
        type: 'server',
        message: messageText,
      });
    }
  });
}
