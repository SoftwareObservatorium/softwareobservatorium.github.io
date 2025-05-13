import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Alert,
    Divider,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Link,
    FormControlLabel,
    Checkbox,
    Dialog,
    DialogTitle,
    IconButton,
    DialogContent,
} from '@mui/material';
import * as duckdb from '@duckdb/duckdb-wasm';
import axios from 'axios';
import { CodeVersion, SearchSrmQueryRequest, SearchSrmQueryResponse } from '@site/src/services/models';
import LassoService from '@site/src/services/LassoService';
import { DataGrid, GridColDef, GridRowClassNameParams } from '@mui/x-data-grid';
import { renderHumanOutputValue } from './ClusteredSRMAccordionViewer';
import ActuationSheet from '../Sheet/ActuationSheet';
import SheetService from '../Sheet/SheetService';
import CloseIcon from '@mui/icons-material/Close';
import CodeBlock from '@theme/CodeBlock';

export interface TestClusteredSRMAccordionViewerProps {
    fileName: string;
    executionId: string;
}

type LoadingState = 'unloaded' | 'loading' | 'loaded' | 'error';

function parseDuckDBList(val: any): CodeVersion[] {
    val = JSON.stringify(val)

    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return [parseCodeVersion(val)];
    let str = val.trim();
    // Remove brackets or braces
    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
        str = str.substring(1, str.length - 1);
    }
    // Now, handle possible blank string
    if (!str) return [];
    // Just split by comma and trim; do NOT use quotes
    let myArr = str.split(',').map(s => s.trim()).filter(Boolean);

    return myArr.map(s => parseCodeVersion(s))
}

function parseCodeVersion(str: string): CodeVersion {
    if (str.startsWith('"') && str.endsWith('"')) {
        str = str.substring(1, str.length - 1);
    }
    let ss = str.split('_')
    const cv = new CodeVersion();
    cv.id = ss[0]
    cv.variantId = ss[1]
    cv.adapterId = ss[2]
    cv.oracle = cv.id === 'oracle'
    return cv
}

export const TestClusteredSRMAccordionViewer: React.FC<TestClusteredSRMAccordionViewerProps> = ({
    fileName, executionId
}) => {
    const [abstractions, setAbstractions] = useState<string[]>([]);
    const [selectedAbstraction, setSelectedAbstraction] = useState<string>('');
    const [clusters, setClusters] = useState<any[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('unloaded');
    const [error, setError] = useState<string | null>(null);

    // ----------- DIALOG STATES -----------
    const [openTestCase, setOpenTestCase] = useState<any | null>(null);

    const [limitOracles, setLimitOracles] = useState(false);

    const [queryResponse, setQueryResponse] = useState<SearchSrmQueryResponse>()

    const dbRef = useRef<duckdb.AsyncDuckDB>();
    const isParquetLoaded = useRef(false);

    const queryScript = () => {
        const request = new SearchSrmQueryRequest()
        request.executionId = executionId
        request.forAction = ""

        return LassoService.queryScript(request)
            .then(
                (response) => {
                    let queryResponse: SearchSrmQueryResponse = response.data
                    //console.log("queryScript successful " + JSON.stringify(queryResponse))

                    //
                    setQueryResponse(queryResponse)

                    return queryResponse;
                },
                (error) => {
                    const resMessage =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString();

                    // FIXME
                    console.log("queryScript attempt failed " + error)

                    return null;
                }
            )
    };

    const getCodeCandidate = (id: string) => {
        if (!queryResponse) {
            return {};
        }

        const codeUnits = queryResponse.abstractions.find((ab) => ab.name === selectedAbstraction).codeUnits
        const cu = codeUnits.find((c) => c.id === id)

        return cu;
    }

    // DuckDB init & Parquet registration
    const ensureDuckDbReady = useCallback(async () => {
        if (dbRef.current && isParquetLoaded.current) return dbRef.current;
        setLoadingState('loading');
        setError(null);
        try {
            const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
            const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
            const worker_url = URL.createObjectURL(
                new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
            );
            const worker = new Worker(worker_url);
            URL.revokeObjectURL(worker_url);

            const logger = new duckdb.ConsoleLogger();
            const db = new duckdb.AsyncDuckDB(logger, worker);
            await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
            await db.open({ query: { castBigIntToDouble: true } });

            // Register Parquet
            const { data } = await axios.get(fileName, { responseType: 'arraybuffer' });
            await db.registerFileBuffer('tdse_srm.parquet', new Uint8Array(data));

            dbRef.current = db;
            isParquetLoaded.current = true;
            setLoadingState('loaded');
            return db;
        } catch (e: any) {
            setError(`Initialization failed: ${e?.message ?? e}`);
            setLoadingState('error');
            throw e;
        }
    }, [fileName]);

    const getTestCase = (testCaseName: string) => {
        if (!queryResponse) {
            return null;
        }

        console.log("test case name " + testCaseName);

        const tests = queryResponse.abstractions.find((ab) => ab.name === selectedAbstraction)
            .specification.tests;
        const test = tests.find((t) => t.signature === testCaseName)

        return test;
    }

    // Load abstractions for dropdown
    const loadAbstractions = useCallback(async () => {
        setLoadingState('loading');
        setError(null);
        try {
            const db = await ensureDuckDbReady();
            if (!db) throw new Error('DuckDB/Parquet not loaded');
            const conn = await db.connect();

            const res = await conn.query(
                `SELECT DISTINCT ABSTRACTIONID FROM tdse_srm.parquet WHERE ABSTRACTIONID IS NOT NULL ORDER BY ABSTRACTIONID`
            );
            const list = res.toArray().map((r: any) => r.toJSON()['ABSTRACTIONID']);
            setAbstractions(list);
            setLoadingState('loaded');
            await conn.close();

            // query code units
            await queryScript();
        } catch (e: any) {
            setError(`DuckDB Abstraction query failed: ${e?.message ?? e}`);
            setLoadingState('error');
        }
    }, [ensureDuckDbReady]);

    // Clustering query (with abstraction filter)
    const runClusteringQuery = useCallback(
        async (abstractionFilter: string, limitOracles: boolean) => {
            setLoadingState('loading');
            setError(null);
            try {
                const db = await ensureDuckDbReady();
                if (!db) throw new Error('DuckDB/Parquet not loaded');
                const conn = await db.connect();

                let baseSQL = ''
                if (limitOracles) {
                    baseSQL = `
SELECT 
    SHEETID,
    X,
    Y,
    MODE(VALUE) as test_based_oracle,
    list(DISTINCT VALUE) as unique_values,
    (select list(CONCAT(SYSTEMID, '_', VARIANTID, '_', ADAPTERID) ORDER BY SYSTEMID, VARIANTID, ADAPTERID) from tdse_srm.parquet where VALUE = test_based_oracle and TYPE = 'value' and ABSTRACTIONID = tbl1.ABSTRACTIONID and SHEETID = tbl1.SHEETID and X = tbl1.X and Y=tbl1.Y) as cluster_implementations
from tdse_srm.parquet as tbl1 where TYPE = 'value' ${abstractionFilter ? `AND ABSTRACTIONID = '${abstractionFilter.replace("'", "''")}'` : ''} and SYSTEMID != 'oracle' GROUP BY ABSTRACTIONID, SHEETID, X, Y ORDER BY SHEETID, X, Y
`
                } else {
                    baseSQL = `
SELECT 
    SHEETID,
    X,
    Y,
    MODE(VALUE) as test_based_oracle,
    list(DISTINCT VALUE) as unique_values,
    (select list(CONCAT(SYSTEMID, '_', VARIANTID, '_', ADAPTERID) ORDER BY SYSTEMID, VARIANTID, ADAPTERID) from tdse_srm.parquet where VALUE = test_based_oracle and TYPE = 'value' and SYSTEMID != 'oracle' and ABSTRACTIONID = tbl1.ABSTRACTIONID and SHEETID = tbl1.SHEETID and X = tbl1.X and Y=tbl1.Y) as cluster_implementations
from tdse_srm.parquet as tbl1 where TYPE = 'value' ${abstractionFilter ? `AND ABSTRACTIONID = '${abstractionFilter.replace("'", "''")}'` : ''} and SYSTEMID != 'oracle' GROUP BY ABSTRACTIONID, SHEETID, X, Y ORDER BY SHEETID, X, Y
`
                }

                const arrowResult = await conn.query(baseSQL);
                const array = arrowResult.toArray().map((row: any, idx: number) => {
                    const base = row.toJSON();
                    // Generate id for react keys if needed:
                    base.id =
                        (abstractionFilter ?? '') +
                        '_' +
                        (base['SHEETID'] ?? '') +
                        '_' +
                        (base['X'] ?? '') +
                        '_' +
                        (base['Y'] ?? '') +
                        '_' +
                        idx;
                    return base;
                });
                setClusters(array);
                setLoadingState('loaded');
                await conn.close();
            } catch (e: any) {
                setError(`DuckDB clustering query failed: ${e?.message ?? e}`);
                setLoadingState('error');
            }
        },
        [ensureDuckDbReady]
    );

    // Initial load: get abstraction options, then load data
    useEffect(() => {
        loadAbstractions();
        // eslint-disable-next-line
    }, []);

    // Rerun cluster query on abstraction change
    useEffect(() => {
        if (abstractions.length === 0) return;
        if (!selectedAbstraction) {
            setSelectedAbstraction(abstractions[0]);
        } else {
            runClusteringQuery(selectedAbstraction, limitOracles);
        }
        // eslint-disable-next-line
    }, [abstractions, selectedAbstraction, limitOracles]);

    // Handler for abstraction change
    const handleAbstractionChange = (event: any) => {
        setSelectedAbstraction(event.target.value);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" mb={2}>
                Test Clustering (by Abstraction)
                <Typography variant="h6" component="div">Identifies most frequent outputs that may serve as oracle values (based on output SRM)</Typography>
            </Typography>

            <CardContent>
                {abstractions.length > 0 && (
                    <FormControl sx={{ minWidth: 220 }}>
                        <InputLabel id="abstraction-select-label">Abstraction</InputLabel>
                        <Select
                            labelId="abstraction-select-label"
                            value={selectedAbstraction}
                            label="Abstraction"
                            onChange={handleAbstractionChange}
                            disabled={loadingState === 'loading'}
                        >
                            {abstractions.map((abs) => (
                                <MenuItem key={abs} value={abs}>
                                    {abs}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={limitOracles}
                                    onChange={(e) => setLimitOracles(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Include Specified Oracle Values"
                        />
                    </FormControl>
                )}
            </CardContent>
            <Divider sx={{ my: 2 }} />

            {loadingState === 'loading' && (
                <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography mt={1}>Loading SRM clustering data...</Typography>
                </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Box>
                {clusters.length === 0 && loadingState !== 'loading' && (
                    <Alert severity="info">No clusters found for this abstraction.</Alert>
                )}

                {clusters.length > 0 && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <DataGrid
                            rows={clusters.map((cluster, idx) => ({
                                id: cluster.id ?? idx,
                                sheetId: cluster.SHEETID,
                                invocation: cluster.Y,
                                output: cluster.test_based_oracle,
                                outputCount: parseDuckDBList(cluster.cluster_implementations).length,
                                uniqueValues: parseDuckDBList(cluster.unique_values),
                                implementations: parseDuckDBList(cluster.cluster_implementations),
                            }))}
                            columns={[
                                { field: 'sheetId', headerName: 'Sheet ID', width: 120,
                                    renderCell: (params) => (
                        
                                        <Box
                                            sx={{
                                                fontWeight: 'bold',
                                                width: '100%',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                color: 'primary.main'
                                            }}
                                            onClick={() => setOpenTestCase(params.value)}
                                            title={`Show details for test case "${params.value}"`}
                                        >
                                            {params.value}
                                        </Box>
                        
                                    ), },
                                { field: 'invocation', headerName: 'Test Invocation', width: 170,
                                    renderCell: (params) => (
                                        Number(params.value) + 1
                                    ),
                                 },
                                {
                                    field: 'output',
                                    headerName: 'Most Frequent Output',
                                    width: 220,
                                    renderCell: (params) => (
                                        <Chip
                                            label={renderHumanOutputValue(String(params.value))}
                                            color="primary"
                                            variant="filled"
                                            size="small"
                                        />
                                    ),
                                },
                                {
                                    field: 'outputCount',
                                    headerName: 'Count',
                                    type: 'number',
                                    width: 100,
                                },
                                {
                                    field: 'implementations',
                                    headerName: 'Implementations',
                                    width: 325,
                                    flex: 1,
                                    sortable: false,
                                    renderCell: (params) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {Array.isArray(params.value) &&
                                                params.value.map((impl: any, i: number) => {
                                                    // Try to resolve code candidate for link (safe check)
                                                    let cand;
                                                    try {
                                                        cand = getCodeCandidate(impl.id); // "getCodeCandidate" in scope
                                                    } catch {
                                                        cand = undefined;
                                                    }
                                                    if (
                                                        cand &&
                                                        cand.id &&
                                                        cand.dataSource &&
                                                        cand.name
                                                    ) {
                                                        return (
                                                            <Link
                                                                key={impl.id + i}
                                                                href={`/web/lasso/search?query=*:*&filter=id:${cand.id}&ds=${cand.dataSource}`}
                                                                target="_blank"
                                                                rel="noopener"
                                                                underline="hover"
                                                                sx={{ mr: 0.7 }}
                                                            >
                                                                <Chip label={cand.name} size="small" />
                                                            </Link>
                                                        );
                                                    }
                                                    return (
                                                        <Chip
                                                            key={impl.id + i}
                                                            label={impl.id}
                                                            size="small"
                                                            sx={{ mr: 0.7 }}
                                                        />
                                                    );
                                                })}
                                        </Box>
                                    ),
                                },
                                {
                                    field: 'uniqueValues',
                                    headerName: 'All Outputs',
                                    width: 180,
                                    renderCell: (params) => (
                                        <Box>
                                            {Array.isArray(params.value) &&
                                                params.value.map((val: any, idx: number) => (
                                                    <Chip
                                                        key={val.id ?? val + idx}
                                                        label={val.id ?? String(val)}
                                                        size="small"
                                                        sx={{ m: 0.2 }}
                                                    />
                                                ))}
                                        </Box>
                                    ),
                                },
                            ] as GridColDef[]}
                            pageSize={8}
                            autoHeight
                            disableSelectionOnClick
                            getRowClassName={(params: GridRowClassNameParams) => {
                                // Highlight the row(s) with the maximum outputCount (most agreed cluster)
                                const maxCount = Math.max(
                                    ...clusters.map(c =>
                                        parseDuckDBList(c.cluster_implementations).length
                                    )
                                );
                                return params.row.outputCount === maxCount
                                    ? 'highlighted-row'
                                    : '';
                            }}
                            sx={{
                                '& .highlighted-row': {
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'light' ? '#e3f2fd' : '#17407b',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                        <Typography variant="body2" mt={2}>
                            The most frequent output (oracle candidate) is highlighted, showing code implementations linking to their detail pages.
                        </Typography>
                    </Box>
                )}

            <Dialog open={!!openTestCase} onClose={() => setOpenTestCase(null)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Test Case: {openTestCase}
                    <IconButton aria-label="close" onClick={() => setOpenTestCase(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {openTestCase && [0].map((e) => {
                        const test = getTestCase(openTestCase);
                        return <React.Fragment>
                            <Typography
                                component="span"
                                variant="body2"
                                sx={{ color: 'text.primary', display: 'inline' }}
                            >
                                <small>{test.ssn ? "SSN" : "Code"}</small>
                            </Typography>
                            {test.ssn ?
                                <ActuationSheet sheetSignature={test.signature} sheetData={SheetService.parseActuationSheet(test)} implementation={""} />
                                : <CodeBlock language="java">{test.body}</CodeBlock>}
                        </React.Fragment>
                    })}
                </DialogContent>
            </Dialog>

            </Box>
        </Box>
    );
};

export default TestClusteredSRMAccordionViewer;