import type { TrackingMediaType } from "@/src/lib/tracking/types";

const MAX_IMPORT_ITEMS = 1_000;

export type ImdbImportItem = {
  imdbId: string;
  mediaType: TrackingMediaType | null;
};

type CsvParseResult = {
  rows: string[][];
  malformed: boolean;
};

function parseCsv(source: string): CsvParseResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) return { rows, malformed: true };
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return { rows, malformed: false };
}

function normaliseHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function mediaTypeFor(titleType: string | undefined): TrackingMediaType | null {
  const value = titleType?.trim().toLowerCase() ?? "";
  if (!value) return null;
  if (value.includes("tv") || value.includes("series") || value.includes("episode")) {
    return "tv";
  }
  if (value.includes("movie") || value.includes("film")) return "movie";
  return null;
}

export function parseImdbImport(source: string): {
  items: ImdbImportItem[];
  invalid: number;
  overLimit: boolean;
  validFormat: boolean;
} {
  const { rows, malformed } = parseCsv(source);
  const [header = [], ...entries] = rows;
  const constIndex = header.findIndex((value) => normaliseHeader(value) === "const");
  const titleTypeIndex = header.findIndex((value) => normaliseHeader(value) === "title type");

  if (malformed || constIndex === -1) {
    return { items: [], invalid: 0, overLimit: false, validFormat: false };
  }
  if (entries.length > MAX_IMPORT_ITEMS) {
    return { items: [], invalid: 0, overLimit: true, validFormat: true };
  }

  const items = new Map<string, ImdbImportItem>();
  let invalid = 0;
  for (const entry of entries) {
    if (entry.every((value) => value.trim().length === 0)) continue;
    const imdbId = entry[constIndex]?.trim();
    if (!imdbId || !/^tt\d{5,12}$/i.test(imdbId)) {
      invalid += 1;
      continue;
    }

    const normalizedId = imdbId.toLowerCase();
    if (!items.has(normalizedId)) {
      items.set(normalizedId, {
        imdbId: normalizedId,
        mediaType: mediaTypeFor(entry[titleTypeIndex]),
      });
    }
  }

  return { items: [...items.values()], invalid, overLimit: false, validFormat: true };
}
