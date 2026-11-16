import {
  isDateString,
  isNonEmptyString,
  isRecord,
} from '../../../utils/guards';

/** Forma de `ExportView` en la API (`src/exports/exports.types.ts`). */
export interface ProductExport {
  id: string;
  evaluationId: string;
  acceptedInvalidCount: number;
  acceptedExcludedCount: number;
  /** Productos válidos escritos en `productos.tsv`. */
  rowCount: number;
  byteSize: number;
  tsvChecksum: string;
  createdAt: string;
}

/**
 * Lo que la persona confirma al exportar: la evaluación y lo que vio en ella.
 * La API lo compara con lo guardado (D2 de su plan).
 */
export interface ExportApproval {
  evaluationId: string;
  resultChecksum: string;
  acceptedInvalidCount: number;
  acceptedExcludedCount: number;
}

export function isProductExport(value: unknown): value is ProductExport {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.evaluationId) &&
    Number.isInteger(value.acceptedInvalidCount) &&
    Number.isInteger(value.acceptedExcludedCount) &&
    Number.isInteger(value.rowCount) &&
    Number.isInteger(value.byteSize) &&
    typeof value.tsvChecksum === 'string' &&
    isDateString(value.createdAt)
  );
}
