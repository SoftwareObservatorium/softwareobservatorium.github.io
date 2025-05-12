import { Invocation } from "./SequenceSheetEditor";

type SequenceSheetJsonLRow = {
    cells: Record<string, any>
};

/** Converts a sequence sheet JSONL (one sheet, multi-row) to Groovy DSL rows as string[] */
function sequenceSheetRowsJsonlToGroovyRows(jsonl: string, columns?: string[]): string[] {
    const lines = jsonl.trim().split(/\r?\n/);
    const rows: SequenceSheetJsonLRow[] = lines.map(line => JSON.parse(line));
    // Determine columns automatically if not given
    let cols = columns;
    if (!cols) {
        // Find max column set over all lines
        const colSet = new Set<string>();
        for (const rowObj of rows) {
            Object.keys(rowObj.cells).forEach(cellId => {
                const match = cellId.match(/^([A-Z]+)/);
                if (match) colSet.add(match[1]);
            });
        }
        cols = Array.from(colSet).sort(); // generally ["A","B","C",...]
    }
    // for each row, gather the values for each column (by line number)
    return rows.map((rowObj, idx) => {
        const cellValues = cols!.map((col, colIdx) => {
            const cellId = `${col}${idx + 1}`; // +1 as sheet is 1-indexed
            let value = rowObj.cells[cellId];
            // For col 'A', turn {} into ''
            if (col === 'A' && value && typeof value === 'object' && Object.keys(value).length === 0) {
                value = '';
            }
            // wrap non-numeric, non-object as Groovy single quoted string, except for something already quoted
            if (
                typeof value === "string"
                && !/^-?\d+(\.\d+)?$/.test(value)
                && !(value.startsWith("'") && value.endsWith("'")) // already Groovy quoted
                //&& !(value.startsWith("\"") && value.endsWith("\"")) // JS string literal - leave as is (for "Hello World!")
                && value !== ''
            ) {
                return `'${value}'`;
            }
            // For empty string, still wrap as ''
            if (value === '') return `''`;
            if (typeof value === 'number') return value;
            // For quoted JS string keep as is
            if (typeof value === "string") return value;
            return "''"; // fallback for null/undefined/object
        });

        console.log(cellValues)

        const filtered = cellValues.filter((s, i) => {
            if(i > 0 && s === `''`) {
                return false
            } else {
                return true
            }
        }) // remaining cells are not allowed to have ''

        return `row ${filtered.join(', ')}`;
    });
}

export function extractParamNames(input: string): string[] {
  // Remove leading/trailing whitespace and any surrounding parentheses
  const cleaned = input.trim().replace(/^\(|\)$/g, '');

  // If the string is empty after cleaning, return []
  if (!cleaned) return [];

  // Split on commas to get individual key-value pairs
  const pairs = cleaned.split(',');

  // Extract key names
  const keys = pairs.map(pair => {
    const match = /^\s*([^=]+)\s*=/.exec(pair);
    return match ? match[1].trim() : null;
  }).filter((key): key is string => !!key); // Filters out any nulls

  return keys;
}

/**
 * Converts a list of sequence sheets in JSONL to Groovy DSL.
 * @param sheets Array of { name: string, jsonl: string, columns: string[] }
 * @returns String of Groovy DSL representing all sheets.
 */
export function sequenceSheetsToGroovyDSL(
    sheets: { name: string; signature: string; jsonl: string; invocations: Invocation[]; columns?: string[] }[]
): string {
    const sheetBlocks = sheets.flatMap(sheet => {
        const paramNames = extractParamNames(sheet.signature);
        const title = sheet.name.replace(/'/g, "\\'") + sheet.signature; // Escape any single quote in name
        const bodyRows = sequenceSheetRowsJsonlToGroovyRows(sheet.jsonl, sheet.columns);

        console.log(paramNames)

        if(sheet.invocations.length > 0) {
            // array
            return sheet.invocations.map((inv, index) => {
                const parameters = inv.params.map((p, pIndex) => `${paramNames[pIndex]}:'${p}'`).join(', ');

                if(index == 0) {
                    // declare entire sheet
                    return `  test(name: '${title}', ${parameters}) {\n    ${bodyRows.join('\n    ')}\n  }`;
                } else {
                    // just invocation
                    return `  test(name: '${title}', ${parameters})`;
                }
            });
        } else {
            // array
            return [`  test(name: '${title}') {\n    ${bodyRows.join('\n    ')}\n  }`];
        }
    });
    // Output as a Groovy list
    return '[\n' + sheetBlocks.join(',\n') + '\n]';
}

