// src/components/CodeUnitTable.tsx
import React, { useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Box, Typography,
    Stack,
    Chip
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { CodeSnippetCard } from "@site/src/components/CodeSnippet/CodeSnippetCard";
import { CodeSnippet } from "@site/src/services/models";
import CodeIcon from "@mui/icons-material/Code";
import PackageIcon from "@mui/icons-material/Archive";

// Accept codeUnits as prop
type Props = {
    codeUnits: CodeSnippet[]
}

export const CodeUnitTable: React.FC<Props> = ({ codeUnits }) => {
    const [openRow, setOpenRow] = useState<number | null>(null);

    return (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="Code Units table">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell>Name</TableCell>
                        {/* Add more TableCell for extra fields */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {codeUnits.map((unit, idx) => (
                        <React.Fragment key={unit.id}>
                            <TableRow hover>
                                <TableCell width={48}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setOpenRow(openRow === idx ? null : idx)}
                                    >
                                        {openRow === idx ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                    </IconButton>
                                </TableCell>
                                <TableCell><Typography sx={{ fontWeight: 'bold' }}>
                                    {unit.name}
                                </Typography><Stack direction="row" spacing={1}>
                                        <Chip icon={<PackageIcon />} size="small" label={unit.packagename} />
                                        <Chip
                                            icon={<CodeIcon />}
                                            size="small"
                                            color="primary"
                                            label={unit.groupId + ":" + unit.artifactId}
                                        />
                                        <Chip size="small" label={unit.version} />
                                        {/* <Chip
                        label={snippet.dataSource?.toUpperCase()}
                        size="small" /> */}
                                    </Stack></TableCell>
                                {/* More fields */}
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} style={{ padding: 0, border: 0 }}>
                                    <Collapse in={openRow === idx} timeout="auto" unmountOnExit>
                                        <Box sx={{ margin: 2 }}>
                                            <CodeSnippetCard snippet={unit} />
                                            {/* You can add more content here */}
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