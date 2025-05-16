import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, Chip,
} from "@mui/material";

export interface IdLocationClazz {
  name: string;
}

export interface IdLocation {
  clazz: IdLocationClazz;
  method: string;
  methodDesc: string;
}

export interface Id {
  location: IdLocation;
  indexes: number[];
  mutator: string;
}

export interface MutationModel {
  id: Id;
  filename: string;
  block: number;
  lineNumber: number;
  description: string;
  testsInOrder: string[];
}

interface Props {
  data: MutationModel;
}

const MutationTable: React.FC<Props> = ({ data }) => {
  const { id, filename, block, lineNumber, description, testsInOrder } = data;
  const { location, indexes, mutator } = id;
  const { clazz, method, methodDesc } = location;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Mutant Details
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell variant="head">Class</TableCell>
              <TableCell>{clazz.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">Method</TableCell>
              <TableCell>{method} ({methodDesc})</TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell variant="head">Method Desc</TableCell>
              <TableCell>{methodDesc}</TableCell>
            </TableRow> */}
            {/* <TableRow>
              <TableCell variant="head">Indexes</TableCell>
              <TableCell>
                {indexes.map((idx) => (
                  <Chip key={idx} label={idx} size="small" sx={{mr: 0.5}}/>
                ))}
              </TableCell>
            </TableRow> */}
            <TableRow>
              <TableCell variant="head">Mutator</TableCell>
              <TableCell>{mutator}</TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell variant="head">Filename</TableCell>
              <TableCell>{filename}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">Block</TableCell>
              <TableCell>{block}</TableCell>
            </TableRow> */}
            <TableRow>
              <TableCell variant="head">Line Number</TableCell>
              <TableCell>{lineNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">Description</TableCell>
              <TableCell>{description}</TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell variant="head">Tests In Order</TableCell>
              <TableCell>
                {testsInOrder.length > 0
                  ? testsInOrder.map((test, i) => (
                      <Chip key={i} label={test} size="small" sx={{mr: 0.5}} />
                    ))
                  : <Typography color="text.secondary" variant="caption">(none)</Typography>
                }
              </TableCell>
            </TableRow> */}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MutationTable;