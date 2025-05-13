// src/components/TestTable.tsx
import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Box, Typography
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import Code from "@mui/icons-material/Code";
import CodeBlock from "@theme/CodeBlock";
import ActuationSheet from "@site/src/components/Sheet/ActuationSheet";
import SheetService from "@site/src/components/Sheet/SheetService";

interface TestItem {
  signature: string;
  ssn?: boolean;
  body?: string;
  /* ... */
}

type Props = {
  tests: TestItem[];
};

export const TestTable: React.FC<Props> = ({ tests }) => {
  const [openRow, setOpenRow] = useState<number | null>(null);

  return (
    <TableContainer component={Paper} sx={{ my: 2 }}>
      <Table size="small" aria-label="Tests Table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Signature</TableCell>
            <TableCell>Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((test, idx) => (
            <React.Fragment key={test.signature + idx}>
              <TableRow hover>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setOpenRow(openRow === idx ? null : idx)}
                  >
                    {openRow === idx ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>
                </TableCell>
                <TableCell>{test.signature}</TableCell>
                <TableCell>{test.ssn ? "SSN" : "Code"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} style={{ padding: 0, border: 0 }}>
                  <Collapse in={openRow === idx} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {test.ssn ? "Actuation Sheet" : "Test Implementation"}
                      </Typography>
                      {test.ssn
                        ? <ActuationSheet sheetSignature={test.signature} sheetData={SheetService.parseActuationSheet(test)} implementation="" />
                        : <CodeBlock language="java">{test.body}</CodeBlock>
                      }
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}