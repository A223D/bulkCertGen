import type {
  BatchPdfTemplate,
  BatchPdfWarning,
  CsvRow,
  FieldMapping,
  MappedDocumentData,
  Result,
} from "./types.ts";

function getHeaderLookup(headers: string[]): Map<string, string[]> {
  const lookup = new Map<string, string[]>();

  for (const header of headers) {
    const normalized = normalizeMappingText(header);
    const existing = lookup.get(normalized) ?? [];
    existing.push(header);
    lookup.set(normalized, existing);
  }

  return lookup;
}

function getSingleHeaderMatch(
  lookup: Map<string, string[]>,
  normalizedCandidate: string,
): string | null {
  const matches = lookup.get(normalizedCandidate) ?? [];

  return matches.length === 1 ? matches[0] : null;
}

function getLooseHeaderMatch(headers: string[], candidates: string[]): string | null {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeMappingText(header),
  }));
  const normalizedCandidates = candidates.map((candidate) =>
    normalizeMappingText(candidate),
  );
  const matches = normalizedHeaders.filter(({ normalized }) =>
    normalizedCandidates.some(
      (candidate) =>
        normalized.includes(candidate) || candidate.includes(normalized),
    ),
  );

  return matches.length === 1 ? matches[0].original : null;
}

export function normalizeMappingText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoMapFields(
  template: BatchPdfTemplate,
  headers: string[],
): FieldMapping {
  const mapping: FieldMapping = {};
  const lookup = getHeaderLookup(headers);

  for (const field of template.fields) {
    const candidates = [field.key, ...field.aliases];
    const keyMatch = getSingleHeaderMatch(lookup, normalizeMappingText(field.key));

    if (keyMatch) {
      mapping[field.key] = keyMatch;
      continue;
    }

    const aliasMatch = field.aliases
      .map((alias) => getSingleHeaderMatch(lookup, normalizeMappingText(alias)))
      .find((match): match is string => Boolean(match));

    if (aliasMatch) {
      mapping[field.key] = aliasMatch;
      continue;
    }

    const looseMatch = getLooseHeaderMatch(headers, candidates);

    if (looseMatch) {
      mapping[field.key] = looseMatch;
    }
  }

  return mapping;
}

export function validateMapping(
  template: BatchPdfTemplate,
  headers: string[],
  mapping: FieldMapping,
): Result<FieldMapping> {
  const errors = [];
  const headerSet = new Set(headers);
  const validated: FieldMapping = {};
  const templateFieldKeys = new Set(template.fields.map((field) => field.key));

  for (const [fieldKey, header] of Object.entries(mapping)) {
    if (!templateFieldKeys.has(fieldKey) || header === "") {
      continue;
    }

    if (!headerSet.has(header)) {
      errors.push({
        code: "mapping_unknown_column",
        message: "The selected CSV column no longer exists. Choose another column.",
        fieldKey,
      });
      continue;
    }

    validated[fieldKey] = header;
  }

  for (const field of template.fields) {
    if (field.required && !validated[field.key]) {
      errors.push({
        code: "mapping_required_field_missing",
        message: `${field.label} is required. Choose a CSV column for this field.`,
        fieldKey: field.key,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: validated };
}

export function mapRowToTemplateData(
  row: CsvRow,
  mapping: FieldMapping,
  template: BatchPdfTemplate,
): MappedDocumentData {
  return template.fields.reduce<MappedDocumentData>((data, field) => {
    const mappedHeader = mapping[field.key];
    data[field.key] = mappedHeader ? row[mappedHeader] ?? "" : "";
    return data;
  }, {});
}

export function getMissingValueWarnings(
  rows: CsvRow[],
  mapping: FieldMapping,
  template: BatchPdfTemplate,
): BatchPdfWarning[] {
  const warnings: BatchPdfWarning[] = [];

  for (const field of template.fields.filter((candidate) => candidate.required)) {
    const mappedHeader = mapping[field.key];

    if (!mappedHeader) {
      continue;
    }

    const missingCount = rows.filter((row) => {
      const value = row[mappedHeader];
      return value === undefined || value.trim() === "";
    }).length;

    if (missingCount === 0) {
      continue;
    }

    if (missingCount === rows.length) {
      warnings.push({
        code: "mapping_required_field_all_empty",
        message: `${field.label} is empty for every row. Choose a different column before exporting.`,
        fieldKey: field.key,
      });
      continue;
    }

    warnings.push({
      code: "mapping_required_field_missing_values",
      message: `${field.label} is empty in ${missingCount} rows.`,
      fieldKey: field.key,
    });
  }

  return warnings;
}
