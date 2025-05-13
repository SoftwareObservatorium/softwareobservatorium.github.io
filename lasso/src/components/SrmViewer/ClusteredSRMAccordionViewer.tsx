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
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    FormControlLabel,
    Checkbox,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton
} from '@mui/material';
import * as duckdb from '@duckdb/duckdb-wasm';
import axios from 'axios';
import { CodeVersion, SearchSrmQueryRequest, SearchSrmQueryResponse } from '@site/src/services/models';
import LassoService from '@site/src/services/LassoService';
import { CodeSnippetCard } from '../CodeSnippet/CodeSnippetCard';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import ActuationSheet from '../Sheet/ActuationSheet';
import SheetService from '../Sheet/SheetService';
import CodeBlock from '@theme/CodeBlock';

// ---- CLUSTER COLORS & TAGS ----
// const CLUSTER_COLORS = [
//     "#90caf9", "#c5e1a5", "#ffcc80", "#f8bbd0", "#fff59d", "#a5d6a7", "#bcaaa4", "#bdbdbd", "#ffb3ba", "#baffc9"
// ];
// function getClusterColor(clusterIdx: number): string {
//     return CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length];
// }
function getClusterColor(clusterIdx: number): string {
    // Generates a visually distinct color for each integer
    // 360 = one full turn of the hue wheel, 53% saturation, 80% lightness for pastel
    const hue = (clusterIdx * 137.508) % 360; // 137.508 is the golden angle to maximize separation
    return `hsl(${hue}, 53%, 80%)`;
}

function parseDuckDBList(val: any): CodeVersion[] {
    val = JSON.stringify(val)
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return [parseCodeVersion(val)];
    let str = val.trim();
    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
        str = str.substring(1, str.length - 1);
    }
    if (!str) return [];
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

export const renderHumanOutputValue = (value: string) => {
    if (value.startsWith('$CUT@')) {
        return value.substring('$CUT@'.length);
    }

    if (value.startsWith('$EXCEPTION@')) {
        return <><ErrorIcon />{value.substring('$EXCEPTION@'.length)}</>;
    }

    return value;
};

// --- Helper to separate testCase and statement
function splitTestCaseAndStatement(statement: string): { testCase: string, testStmt: string } {
    const atIdx = statement.indexOf('@');
    if (atIdx === -1) return { testCase: statement, testStmt: '' };
    const stIdx = statement.substring(atIdx).indexOf(',');
    const stId = Number(statement.substring(atIdx).substring(stIdx + 1)) + 1;
    return { testCase: statement.substring(0, atIdx), testStmt: `...${stId}` };
}

function getCoordinates(statement: string): number {
    // str is like "...X"
    if (!statement.startsWith('...')) return 0;
    const atIdx = statement.indexOf('...');
    const stId = Number(statement.substring(atIdx + 3)) + 1;
    return stId;
}

export const ClusteredSRMAccordionViewer: React.FC<any> = ({
    fileName, executionId
}) => {
    const [abstractions, setAbstractions] = useState<string[]>([]);
    const [selectedAbstraction, setSelectedAbstraction] = useState<string>('');
    const [clusters, setClusters] = useState<any[]>([]);
    const [loadingState, setLoadingState] = useState<'unloaded' | 'loading' | 'loaded' | 'error'>('unloaded');
    const [error, setError] = useState<string | null>(null);

    const [limitOracles, setLimitOracles] = useState(false);

    const [queryResponse, setQueryResponse] = useState<SearchSrmQueryResponse>()

    // ----------- DIALOG STATES -----------
    const [openTestCase, setOpenTestCase] = useState<any | null>(null);
    // Holds the CodeVersion, not just key, for rich dialog
    const [openImpl, setOpenImpl] = useState<CodeVersion | null>(null);

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
                    baseSQL = `WITH excluded_statements AS (
  SELECT SHEETID, X, Y
  FROM tdse_srm.parquet
  WHERE type = 'value'
    AND value = '$*'
    ${abstractionFilter ? `AND ABSTRACTIONID = '${abstractionFilter.replace("'", "''")}'` : ''}
)
SELECT count(*) AS cluster_size, list(SYSTEMID) AS cluster_implementations, * EXCLUDE (SYSTEMID) FROM (
    PIVOT (
        SELECT
            CONCAT(SHEETID,'@',X, ',', Y) as statement,
            CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) as SYSTEMID,
            value from tdse_srm.parquet t
            WHERE type = 'value' AND NOT EXISTS (
                SELECT 1 FROM excluded_statements e
                WHERE t.SHEETID = e.SHEETID AND t.X = e.X AND t.Y = e.Y)
            ${abstractionFilter ? `AND ABSTRACTIONID = '${abstractionFilter.replace("'", "''")}'` : ''})
    ON STATEMENT USING first(VALUE) ORDER BY SYSTEMID) as mypiv group by all order by cluster_size DESC`
                } else {
                    baseSQL = `
SELECT count(*) AS cluster_size, list(SYSTEMID) AS cluster_implementations, * EXCLUDE (SYSTEMID) FROM (
    PIVOT (
        SELECT
            CONCAT(SHEETID,'@',X, ',', Y) as statement,
            CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) as SYSTEMID,
            value from tdse_srm.parquet t
            WHERE type = 'value' and SYSTEMID != 'oracle' ${abstractionFilter ? `AND ABSTRACTIONID = '${abstractionFilter.replace("'", "''")}'` : ''})
    ON STATEMENT USING first(VALUE) ORDER BY SYSTEMID) as mypiv group by all order by cluster_size DESC`
                }

                const arrowResult = await conn.query(baseSQL);
                const array = arrowResult.toArray().map((row: any, idx: number) => {
                    const base = row.toJSON();
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

    // ------------ CLUSTER MATRIX ORACLE TAGGING LOGIC ------------
    const [gridRows, setGridRows] = useState<any[]>([]);
    const [gridCols, setGridCols] = useState<GridColDef[]>([]);
    const [implDisplayMeta, setImplDisplayMeta] = useState<Record<string, { isOracle: boolean, isClusterOracle: boolean, color: string }>>({});

    useEffect(() => {
        if (clusters.length === 0) {
            setGridRows([]);
            setGridCols([]);
            setImplDisplayMeta({});
            return;
        }
        // 1. Gather all unique implementation IDs and map them to clusters
        const implToClusterIdx: Record<string, number> = {};
        const allImpls: CodeVersion[] = [];
        clusters.forEach((cluster, clusterIdx) => {
            const impls = parseDuckDBList(cluster.cluster_implementations);
            impls.forEach((impl) => {
                const key = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
                if (!allImpls.find(i =>
                    i.id === impl.id && i.variantId === impl.variantId && i.adapterId === impl.adapterId
                )) {
                    allImpls.push(impl);
                }
                implToClusterIdx[key] = clusterIdx;
            });
        });

        // sort
        // After allImpls computed:
        const oracleImpls = allImpls.filter(i => i.id === 'oracle');
        const nonOracleImpls = allImpls.filter(i => i.id !== 'oracle');
        const sortedImpls = [...oracleImpls, ...nonOracleImpls];

        // 2. Marking: find the cluster with the most members
        let clusterBasedOracleImpls: CodeVersion[] = [];
        let largestClusterIdx = -1;
        if (clusters.length > 0) {
            let maxSize = -1;
            clusters.forEach((cluster, i) => {
                const impls = parseDuckDBList(cluster.cluster_implementations);
                if (impls.length > maxSize) {
                    maxSize = impls.length;
                    clusterBasedOracleImpls = impls;
                    largestClusterIdx = i;
                }
            });
        }

        // 3. Marking: set isOracle (id === 'oracle'), isClusterOracle (in largest cluster) for all implementations
        const implMeta: Record<string, { isOracle: boolean, isClusterOracle: boolean, color: string }> = {};
        allImpls.forEach((impl) => {
            const key = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
            const isOracle = impl.id === 'oracle';
            const isClusterOracle = !!clusterBasedOracleImpls.find(i =>
                i.id === impl.id && i.variantId === impl.variantId && i.adapterId === impl.adapterId
            );
            const color = getClusterColor(implToClusterIdx[key]);
            implMeta[key] = { isOracle, isClusterOracle, color };
        });
        setImplDisplayMeta(implMeta);

        // 4. Row grouping by test-case:
        const allStatements = new Set<string>();
        clusters.forEach(cluster => {
            Object.keys(cluster).forEach(key => {
                if (!['id', 'cluster_implementations', 'cluster_size', 'ABSTRACTIONID', 'unique_values'].includes(key)) {
                    allStatements.add(key);
                }
            });
        });
        // 5. Sort/group rows by testCase
        const parsedStmts = Array.from(allStatements).map(stmt => {
            const { testCase, testStmt } = splitTestCaseAndStatement(stmt);
            return { fullKey: stmt, testCase, testStmt };
        });

        //parsedStmts.sort((a, b) => a.testCase.localeCompare(b.testCase) || a.testStmt.localeCompare(b.testStmt));
        parsedStmts.sort((a, b) => {
            // sort by testCase (string) first
            const g = a.testCase.localeCompare(b.testCase);
            if (g !== 0) return g;
            // then numerically by [x,y]
            const ax = getCoordinates(a.testStmt);
            const bx = getCoordinates(b.testStmt);
            return ax - bx;
        });
        const rows: any[] = [];
        let lastTestCase = '';

        parsedStmts.forEach(({ fullKey, testCase, testStmt }, idx) => {
            if (testCase !== lastTestCase) {
                rows.push({
                    id: `header_${testCase}_${idx}`,
                    statement: testCase,
                    testCase,
                    isCaseHeader: true,
                });
                lastTestCase = testCase;
            }
            const row: any = {
                id: fullKey,
                statement: fullKey,
                testCase,
            };
            allImpls.forEach((impl) => {
                let value = "";
                for (let cIdx = 0; cIdx < clusters.length; ++cIdx) {
                    const cluster = clusters[cIdx];
                    const impls = parseDuckDBList(cluster.cluster_implementations);
                    if (impls.find(i =>
                        i.id === impl.id && i.variantId === impl.variantId && i.adapterId === impl.adapterId
                    )) {
                        if (Object.prototype.hasOwnProperty.call(cluster, fullKey)) {
                            value = cluster[fullKey];
                        }
                        break;
                    }
                }
                row[`${impl.id}_${impl.variantId}_${impl.adapterId}`] = value ?? "";
            });
            rows.push(row);
        });

        // 6. Columns with header tags/chips!
        const columns: GridColDef[] = [
            {
                field: 'statement',
                headerName: 'Test Invocation',
                minWidth: 160,
                maxWidth: 250,
                flex: 1,
                renderCell: (params: GridRenderCellParams) => {
                    if (params.row.isCaseHeader) {
                        return (
                            <Box
                                sx={{
                                    fontWeight: 'bold',
                                    width: '100%',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    color: 'primary.main'
                                }}
                                onClick={() => setOpenTestCase(params.row.statement)}
                                title={`Show details for test case "${params.row.statement}"`}
                            >
                                {params.value}
                            </Box>
                        );
                    }
                    const { testStmt } = splitTestCaseAndStatement(params.value as string || '');
                    return testStmt || params.value;
                },
            },
            ...sortedImpls.map((impl) => {
                const implKey = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
                const meta = implMeta[implKey];
                // Try to resolve code candidate for link (safe check)
                let cand;
                try {
                    cand = getCodeCandidate(impl.id); // "getCodeCandidate" in scope
                } catch {
                    cand = undefined;
                }

                return {
                    field: implKey,
                    headerName: impl.id,
                    width: 140,
                    renderHeader: () => (
                        <Stack direction="column" alignItems="center" spacing={0.5} sx={{ width: 1 }}>
                            <Box
                                sx={{
                                    fontWeight: meta.isOracle || meta.isClusterOracle ? 'bold' : undefined,
                                    cursor: "pointer",
                                    color: "primary.main",
                                    textDecoration: "underline"
                                }}
                                // Clicking header opens impl dialog!
                                onClick={e => {
                                    e.stopPropagation();
                                    setOpenImpl(impl); // needs codeVersion in meta
                                }}
                                title="Show details for this implementation"
                            >
                                {cand ? cand.name : impl.id}
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                                {meta.isOracle && (
                                    <Chip size="small" color="info" label="specified oracle" sx={{ fontSize: '0.7em' }} />
                                )}
                                {meta.isClusterOracle && (
                                    <Chip size="small" color="success" label="cluster-based oracle" sx={{ fontSize: '0.7em' }} />
                                )}
                            </Stack>
                        </Stack>
                    ),
                    renderCell: (params: GridRenderCellParams) => {
                        if (params.row.isCaseHeader) return '';
                        return (
                            <Box sx={{
                                bgcolor: meta.color,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                minHeight: "32px",
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}>{params.value ? renderHumanOutputValue(params.value) : ""}</Box>
                        );
                    },
                    description: `Variant: ${impl.variantId}, Adapter: ${impl.adapterId}`
                } as GridColDef;
            }),
        ];

        setGridRows(rows);
        setGridCols(columns);

    }, [clusters, queryResponse]);

    // ----------- END ORACLE CLUSTER MATRIX LOGIC -----------
    // ----------- RENDER -----------
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" mb={2}>
                Behavioral Clustering (by Abstraction)
                <Typography variant="h6" component="div">Clusters implementations by their exhibited run-time behavior (based on output SRM)</Typography>
            </Typography>
            {/* <Typography>
                The cluster with the highest number of implementations is ranked first (i.e., may serve as an oracle using cluster-based voting)
            </Typography> */}
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


            {/* --- COLORED CLUSTER MATRIX GRID + LEGEND --- */}
            {gridRows.length > 0 && (
                <Box sx={{ width: '100%', mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Clustered Output SRM</Typography>
                    <Typography variant="subtitle2" mb={1}>
                        <b>Legend</b><br />
                        <span>
                            <strong>Columns:</strong> Implementations (colored by cluster, tagged below if "oracle" or part of cluster-based oracle)<br />
                            <strong>Rows:</strong> Test Invocations (statement), grouped by test case
                        </span>
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Chip size="small" color="success" label="cluster-based oracle" />
                        <Chip size="small" color="info" label="specified oracle" />
                        <Box>Column color: indicates cluster membership</Box>
                    </Stack>
                    <Box sx={{ height: 500 }}>
                        <DataGrid
                            rows={gridRows}
                            columns={gridCols}
                            density="compact"
                            getRowId={row => row.id}
                            getRowClassName={params =>
                                params.row.isCaseHeader ? 'testcase-header-row' : ''
                            }
                            sx={{
                                '.MuiDataGrid-columnHeaders .MuiDataGrid-columnHeader': {
                                    backgroundColor: '#ececec',

                                    pt: 1, pb: 1,
                                    whiteSpace: 'normal',
                                    overflow: 'visible !important',
                                    minHeight: '64px',
                                    alignItems: 'flex-start',
                                    lineHeight: 1.3
                                },
                                '& .testcase-header-row': {
                                    backgroundColor: '#dcdcdc',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1.5px solid #bbb',
                                    }
                                }
                            }}
                        />
                    </Box>
                </Box>
            )}
            {/* --- END CLUSTER MATRIX --- */}

            {/* --- Cluster Statistics Panel --- */}
            {clusters.length > 0 && (
                <Box mb={2}>
                    <Typography variant="h6" gutterBottom>Cluster Statistics</Typography>
                    <Table size="small" sx={{ width: 'auto', mb: 1 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Color</TableCell>
                                <TableCell>Cluster #</TableCell>
                                <TableCell>Number of Implementations</TableCell>
                                <TableCell>Implementations</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clusters.map((cluster, idx) => {
                                const clusterColor = getClusterColor(idx);
                                const implementations = parseDuckDBList(cluster.cluster_implementations);
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Box sx={{
                                                background: clusterColor,
                                                width: 28, height: 18, borderRadius: '4px', border: '1px solid #bbb'
                                            }} />
                                        </TableCell>
                                        <TableCell>Cluster {idx + 1}</TableCell>
                                        <TableCell>{implementations.length}</TableCell>
                                        <TableCell>
                                            {implementations.map(i => i.id).join(", ")}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Typography variant="body2">
                        Total number of test cases: <b>{
                            (() => {
                                // All test invocation labels from all clusters
                                const set = new Set();
                                clusters.forEach(cluster => {
                                    Object.keys(cluster).forEach(key => {
                                        if (!['id', 'cluster_implementations', 'cluster_size', 'ABSTRACTIONID', 'unique_values'].includes(key)) {
                                            const testCase = key.split('@')[0];
                                            set.add(testCase);
                                        }
                                    });
                                });
                                return set.size;
                            })()
                        }</b>
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

            <Dialog open={!!openImpl} onClose={() => setOpenImpl(null)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Implementation: {openImpl?.id} (Variant '{openImpl?.variantId}', Adapter '{openImpl?.adapterId}')
                    <IconButton aria-label="close" onClick={() => setOpenImpl(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {openImpl && openImpl.id != "oracle" && <CodeSnippetCard snippet={getCodeCandidate(openImpl?.id)} />}

                </DialogContent>
            </Dialog>

        </Box>
    );
};

export default ClusteredSRMAccordionViewer;