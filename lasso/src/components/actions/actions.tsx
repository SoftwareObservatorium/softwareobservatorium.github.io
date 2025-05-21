import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Container,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LassoService from '@site/src/services/LassoService';

// --- Types ---

type ActionConfig = {
    [key: string]: {
        description: string;
        optional: boolean;
        type: string;
    };
};
type Action = {
    distributable: boolean;
    disablePartitioning: boolean;
    configuration: ActionConfig;
    description: string;
    state: string;
    type: string;
};
type ActionsResponse = {
    actions: {
        [actionName: string]: Action;
    };
};

// --- Component ---

const ActionList: React.FC = () => {
    const [data, setData] = useState<ActionsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        LassoService.getActions()
            .then(response => setData(response.data))
            .catch((e) => setError('Failed to load actions'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return null;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box>
                {/* <Typography variant="h4" mb={2}>
                    Available Actions
                </Typography> */}
                {Object.entries(data.actions).map(([actionName, action]) => (
                    <Accordion key={actionName}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">{actionName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </Box>
                            <Box ml={2}>
                                <Chip
                                    label={action.state}
                                    color={action.state === 'stable' ? 'success' : 'default'}
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                                {action.distributable && (
                                    <Chip label="Distributable" color="primary" size="small" sx={{ mr: 1 }} />
                                )}
                                {action.disablePartitioning && (
                                    <Chip label="No Partitioning" color="warning" size="small" />
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="subtitle1" mb={1}>
                                Configuration
                            </Typography>
                            {Object.keys(action.configuration).length === 0 ? (
                                <Typography color="text.secondary">
                                    No configuration required.
                                </Typography>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Key</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Optional</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(action.configuration).map(
                                                ([key, conf]) => (
                                                    <TableRow key={key}>
                                                        <TableCell>{key}</TableCell>
                                                        <TableCell>{conf.description}</TableCell>
                                                        <TableCell>
                                                            <Chip label={conf.type} size="small" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell>
                                                            {conf.optional ? (
                                                                <Chip label="Yes" size="small" color="success" />
                                                            ) : (
                                                                <Chip label="No" size="small" color="error" />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Container>
    );
};

export default ActionList;