import React, { useState } from "react";
import {
  Button, Stack, Paper, Typography, TextField, Box, Snackbar, Alert, List, ListItem, IconButton
} from "@mui/material";
import {
  DataGrid, GridColDef, GridActionsCellItem, GridCellParams
} from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const BASE_COLS = ["A", "B", "C", "D"];
const OPERATION_NAMES = ["create", "push", "pop", "size"];

function getColId(idx: number) {
  const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (idx < base.length) return base[idx];
  return base[Math.floor(idx / 26) - 1] + base[idx % 26];
}
function toCellId(col: string, row: number) {
  return `${col}${row + 1}`;
}

function parseSheetToRows(sheet: any[], cols: string[]) {
  return sheet.map((row, idx) => {
    const result: Record<string, any> = { id: idx };
    cols.forEach((col) => {
      const cellId = toCellId(col, idx);
      let cell = row[cellId];
      if (typeof cell === "object" && cell && Object.keys(cell).length === 0)
        cell = "";
      result[col] = cell ?? "";
    });
    return result;
  });
}
export function gridToJSONL(rows: any[], cols: string[]): string {
  return rows
    .map((row, i) => {
      const cells: Record<string, any> = {};
      cols.forEach((col) => {
        const cellId = toCellId(col, i);
        let val = row[col];
        if (col === "A" && (val === "" || val === undefined)) val = {};
        if (
          val !== "" &&
          !(typeof val === "object" && Object.keys(val).length === 0)
        ) {
          if (!isNaN(Number(val)) && val !== "" && col === "A") {
            cells[cellId] = Number(val);
          } else {
            cells[cellId] = val;
          }
        } else if (
          typeof val === "object" &&
          Object.keys(val).length === 0 &&
          col === "A"
        ) {
          cells[cellId] = val;
        } else if (col === "A" && (val === "" || val === undefined)) {
          cells[cellId] = {};
        }
      });
      return JSON.stringify({ cells });
    })
    .join("\n");
}
export function jsonlToRows(
  jsonl: string
): { rows: any[]; cols: string[] } | { error: string } {
  try {
    const lines = jsonl.trim().split("\n");
    const sheetRows: any[] = [];
    let maxCol = 0;
    lines.forEach((line, idx) => {
      const { cells } = JSON.parse(line);
      sheetRows.push(cells);
      const cellCols = Object.keys(cells).map((k) =>
        k.match(/[A-Z]+/g)?.[0] ?? "A"
      );
      if (cellCols.length)
        maxCol = Math.max(
          maxCol,
          ...cellCols.map((c) => c.charCodeAt(0) - "A".charCodeAt(0) + 1)
        );
    });
    const cols =
      maxCol === 0
        ? [...BASE_COLS]
        : Array.from({ length: maxCol }, (_, i) => getColId(i));
    return {
      rows: parseSheetToRows(sheetRows, cols),
      cols,
    };
  } catch (e: any) {
    return { error: e?.message || "Invalid JSONL" };
  }
}
function isOperationValid(input: string) {
  return input === "" || OPERATION_NAMES.includes(input);
}

// --- Types ---
export interface Invocation {
  id: number;
  sequenceSheetName: string;
  signature: string;
  params: string[];
}
export interface SequenceSheetData {
  name: string;
  signature: string;
  columns: string[];
  rows: any[];
  invocations: Invocation[];
}
export interface SequenceSheetDataModel {
  name: string;
  signature: string;
  body: string;
  invocations: Invocation[];
}
export interface SequenceSheetSetModel {
  sheets: SequenceSheetDataModel[];
  interfaceSpecification: string;
}

interface SequenceSheetEditorProps {
  value: SequenceSheetData;
  onChange: (next: SequenceSheetData) => void;
  onRemove?: () => void;
}

export const SequenceSheetEditor: React.FC<SequenceSheetEditorProps> = ({
  value, onChange, onRemove,
}) => {
  // Local state for imported/exported text and snackbar
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  // For invocations import/export
  const [invocationImport, setInvocationImport] = useState("");

  // For assigning invocation ids
  const nextInvId =
    value.invocations.length > 0
      ? Math.max(...value.invocations.map(v => v.id)) + 1
      : 0;

  // --- Basic Sheet Handlers ---
  const handleChangeField = (field: keyof SequenceSheetData, v: any) => {
    onChange({ ...value, [field]: v });
  };
  const handleAddRow = () => {
    const nextRows = [
      ...value.rows,
      { id: value.rows.length, ...Object.fromEntries(value.columns.map((c) => [c, ""])) },
    ];
    handleChangeField("rows", nextRows);
  };
  const handleAddCol = () => {
    const n = value.columns.length;
    const id = getColId(n);
    const nextCols = [...value.columns, id];
    const nextRows = value.rows.map((row) => ({ ...row, [id]: "" }));
    onChange({ ...value, columns: nextCols, rows: nextRows });
  };
  const handleRemoveCol = () => {
    if (value.columns.length <= 1) return;
    const removed = value.columns[value.columns.length - 1];
    const newCols = value.columns.slice(0, -1);
    const newRows = value.rows.map((row) => {
      const copy = { ...row };
      delete copy[removed];
      return copy;
    });
    onChange({ ...value, columns: newCols, rows: newRows });
  };
  const handleDeleteRow = (rowId: number) => {
    const nextRows = value.rows.filter((row) => row.id !== rowId);
    handleChangeField("rows", nextRows);
  };
  const processRowUpdate = (newRow: any, oldRow: any) => {
    const nextRows = value.rows.map((row) =>
      row.id === newRow.id ? { ...newRow } : row
    );
    handleChangeField("rows", nextRows);
    return newRow;
  };
  const handleExportJSONL = () => {
    const jsonl = gridToJSONL(value.rows, value.columns);

    // const sheet1 = {
    //   name: value.name,
    //   jsonl: jsonl
    // };
    // const arr = sequenceSheetsToGroovyDSL([sheet1])

    // //setExportText(jsonl);
    // setExportText(arr)

    const blob = new Blob([jsonl], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sequence-sheet.jsonl";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setSnackMsg("Exported as file.");
  };

  const handleImport = (text: string) => {
    const model: SequenceSheetDataModel = JSON.parse(text);

    const result = jsonlToRows(model.body);
    if ("error" in result) {
      setSnackMsg(result.error);
    } else {
      const importedRows = result.rows.map((row, idx) => ({
        ...row,
        id: idx,
      }));

      const newValue: SequenceSheetData = {
        name: model.name,
        signature: model.signature,
        columns: result.cols,
        rows: importedRows,
        invocations: model.invocations
      };

      onChange(newValue);
      setSnackMsg("Imported!");
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gridToJSONL(value.rows, value.columns));
      setSnackMsg("Copied sheet to clipboard!");
    } catch {
      setSnackMsg("Failed to copy");
    }
  };
  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim().startsWith("{")) {
        const result = jsonlToRows(clip);
        if ("error" in result) setSnackMsg(result.error);
        else {
          const importedRows = result.rows.map((row, idx) => ({
            ...row,
            id: idx,
          }));
          onChange({
            ...value,
            columns: result.cols,
            rows: importedRows,
          });
          setSnackMsg("Pasted sheet!");
        }
      }
    } catch {
      setSnackMsg("Paste failed or not supported!");
    }
  };

  // --- Invocations Logic ---
  const handleAddInvocation = (sequenceSheetName: string) => {
    handleChangeField("invocations", [
      ...value.invocations,
      {
        id: nextInvId,
        sequenceSheetName: sequenceSheetName,
        signature: "",
        params: [""],
      },
    ]);
  };
  const handleRemoveInvocation = (id: number) => {
    handleChangeField(
      "invocations",
      value.invocations.filter((v) => v.id !== id)
    );
  };
  const handleInvocationFieldChange = (
    invId: number,
    field: "sequenceSheetName" | "signature",
    val: string
  ) => {
    handleChangeField(
      "invocations",
      value.invocations.map((inv) =>
        inv.id === invId ? { ...inv, [field]: val } : inv
      )
    );
  };
  const handleInvocationParamChange = (
    invId: number,
    paramIdx: number,
    paramVal: string
  ) => {
    handleChangeField(
      "invocations",
      value.invocations.map((inv) =>
        inv.id === invId
          ? {
            ...inv,
            params: inv.params.map((v, idx) => (idx === paramIdx ? paramVal : v)),
          }
          : inv
      )
    );
  };
  const handleAddParam = (invId: number) => {
    handleChangeField(
      "invocations",
      value.invocations.map((inv) =>
        inv.id === invId ? { ...inv, params: [...inv.params, ""] } : inv
      )
    );
  };
  const handleRemoveParam = (invId: number, paramIdx: number) => {
    handleChangeField(
      "invocations",
      value.invocations.map((inv) =>
        inv.id === invId
          ? { ...inv, params: inv.params.filter((_, idx) => idx !== paramIdx) }
          : inv
      )
    );
  };

  // // --- Export/Import for invocations
  // const handleExportInvocations = () => {
  //   const jsonl = value.invocations.map((inv) => JSON.stringify(inv)).join("\n");
  //   const blob = new Blob([jsonl], { type: "text/plain" });
  //   const a = document.createElement("a");
  //   a.href = URL.createObjectURL(blob);
  //   a.download = "sequence-sheet-invocations.jsonl";
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  //   setSnackMsg("Exported invocations as file.");
  // };
  // const handleImportInvocations = () => {
  //   try {
  //     const lines = invocationImport
  //       .split("\n")
  //       .map((l) => l.trim())
  //       .filter(Boolean);
  //     const parsed = lines.map((line) => JSON.parse(line));
  //     handleChangeField(
  //       "invocations",
  //       parsed.map((p, idx) => ({
  //         id: nextInvId + idx,
  //         sequenceSheetName: p.sequenceSheetName,
  //         signature: p.signature,
  //         params: Array.isArray(p.params) ? p.params : [],
  //       }))
  //     );
  //     setSnackMsg("Imported invocations!");
  //   } catch (e) {
  //     setSnackMsg("Failed to import invocations.");
  //   }
  // };

  // -------- Render
  const gridCols: GridColDef[] = value.columns.map((col) => ({
    field: col,
    headerName: col,
    width: 140,
    editable: true,
    resizable: true,
    headerAlign: "center",
    align: "center",
    cellClassName: (params: GridCellParams) => {
      // if (col === "B" && params.value && !isOperationValid(params.value as string))
      //   return "invalid-operation";
      // if (col === "B" && !params.value) return "missing-required";
      // if (col === "A" && !params.value) return "missing-required";
      return "";
    },
  }));

  return (
    <Box sx={{ p: 2, border: "1px solid #ddd", borderRadius: 2, mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sequence Sheet
        </Typography>
        {onRemove && (
          <Button
            variant="contained"
            color="error"
            onClick={onRemove}
            sx={{ ml: 2, height: 40 }}
            size="small"
          >
            Remove
          </Button>
        )}
      </Stack>
      {/* Name/signature */}
      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <TextField
          label="Sequence Sheet Name"
          value={value.name}
          onChange={(e) => handleChangeField("name", e.target.value)}
        />
        <TextField
          label="Sequence Sheet Signature"
          value={value.signature}
          onChange={(e) => handleChangeField("signature", e.target.value)}
        />
      </Stack>
      {/* Controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={handleAddRow}>Add Row</Button>
        <Button variant="contained" onClick={handleAddCol} color="secondary">
          Add Column
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<RemoveCircleOutlineIcon />}
          onClick={handleRemoveCol}
          disabled={value.columns.length <= 1}
        >
          Remove Last Column
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportJSONL}
        >
          Export JSONL
        </Button>
        <Button
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
        >
          Copy
        </Button>
        <Button variant="outlined" onClick={handlePaste}>Paste</Button>
      </Stack>
      <Paper sx={{ height: 340, width: "100%", mb: 2 }}>
        <DataGrid
          rows={value.rows}
          columns={[
            ...gridCols,
            {
              field: "actions",
              type: "actions",
              width: 70,
              getActions: (params) => [
                <GridActionsCellItem
                  icon={<DeleteIcon />}
                  label="Delete"
                  onClick={() => handleDeleteRow(params.id as number)}
                  color="inherit"
                />,
              ],
            },
          ]}
          processRowUpdate={processRowUpdate}
          disableColumnMenu
          hideFooter
          experimentalFeatures={{ newEditingApi: true }}
          sx={{
            ".invalid-operation": { background: "#ffcdd2" },
            ".missing-required": { background: "#fff9c4" },
          }}
        />
      </Paper>
      <Stack direction="row" alignItems="start" spacing={2} sx={{ mb: 2 }}>
        {/* <TextField
          label="Exported LSL Block"
          multiline
          rows={3}
          value={exportText}
          InputProps={{ readOnly: true }}
          sx={{ minWidth: 280 }}
        /> */}
        {/* <TextField
          label="Paste JSONL to import"
          multiline
          rows={3}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Button onClick={handleImport} variant="contained" sx={{ height: 56 }}>
          Import
        </Button> */}
      </Stack>

      {/* --- INVOCATIONS List View --- */}
      <Typography variant="h6" sx={{ mt: 6 }}>Invocations of Sequence Sheets</Typography>
      <Button
        startIcon={<AddIcon />}
        onClick={(e) => handleAddInvocation(value.name)}
        sx={{ mt: 1, mb: 2 }}
        variant="contained"
      >
        Add Invocation
      </Button>
      <Paper sx={{ mb: 1 }}>
        <List>
          {value.invocations.length === 0 && (
            <ListItem>
              <Typography color="text.secondary">No invocations added yet.</Typography>
            </ListItem>
          )}
          {value.invocations.map((inv) => (
            <ListItem key={inv.id} alignItems="flex-start" sx={{ display: "block" }}>
              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <TextField
                  label="Sequence Sheet Name"
                  value={inv.sequenceSheetName}
                  disabled={true}
                  onChange={e =>
                    handleInvocationFieldChange(inv.id, "sequenceSheetName", e.target.value)
                  }
                  sx={{ minWidth: 180 }}
                />
                {/* 
                <TextField
                  label="Signature"
                  value={inv.signature}
                  onChange={e =>
                    handleInvocationFieldChange(inv.id, "signature", e.target.value)
                  }
                  sx={{ minWidth: 180 }}
                /> */}
                <IconButton onClick={() => handleRemoveInvocation(inv.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography sx={{ mt: 2 }} color="text.secondary">
                  Parameters:
                </Typography>
                {inv.params.map((param, idx) => (
                  <React.Fragment key={idx}>
                    <TextField
                      label={`Param #${idx + 1}`}
                      value={param}
                      onChange={e => handleInvocationParamChange(inv.id, idx, e.target.value)}
                      sx={{ width: 120 }}
                    />
                    <IconButton
                      sx={{ mt: 1 }}
                      disabled={inv.params.length === 1}
                      onClick={() => handleRemoveParam(inv.id, idx)}
                      size="small"
                    >
                      <RemoveIcon />
                    </IconButton>
                  </React.Fragment>
                ))}
                <IconButton sx={{ mt: 1 }} onClick={() => handleAddParam(inv.id)}>
                  <AddIcon />
                </IconButton>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>
      {/* <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          onClick={handleExportInvocations}
          startIcon={<DownloadIcon />}
        >
          Export Invocations
        </Button>
        <TextField
          label="Paste JSONL Invocations to Import"
          multiline
          rows={3}
          value={invocationImport}
          onChange={e => setInvocationImport(e.target.value)}
          sx={{ minWidth: 350 }}
        />
        <Button
          variant="contained"
          onClick={handleImportInvocations}
        >
          Import
        </Button>
      </Stack> */}

      <Snackbar
        open={snackMsg != null}
        autoHideDuration={2200}
        onClose={() => setSnackMsg(null)}
      >
        <Alert severity="info">{snackMsg}</Alert>
      </Snackbar>
    </Box>
  );
};