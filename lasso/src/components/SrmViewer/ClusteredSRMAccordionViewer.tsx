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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ActuationSheet from '../Sheet/ActuationSheet';
import SheetService from '../Sheet/SheetService';
import CodeBlock from '@theme/CodeBlock';

function getClusterColor(clusterIdx: number): string {
    const hue = (clusterIdx * 137.508) % 360;
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

function splitTestCaseAndStatement(statement: string): { testCase: string, testStmt: string } {
    const atIdx = statement.indexOf('@');
    if (atIdx === -1) return { testCase: statement, testStmt: '' };
    const stIdx = statement.substring(atIdx).indexOf(',');
    const stId = Number(statement.substring(atIdx).substring(stIdx + 1)) + 1;
    return { testCase: statement.substring(0, atIdx), testStmt: `...${stId}` };
}

function getCoordinates(statement: string): number {
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
    const [mutants, setMutants] = useState<CodeVersion[]>([]);
    const [mutantsKilled, setMutantsKilled] = useState<number>(0);
    const [queryResponse, setQueryResponse] = useState<SearchSrmQueryResponse>()

    // ----------- DIALOG STATES -----------
    const [openTestCase, setOpenTestCase] = useState<any | null>(null);
    const [openImpl, setOpenImpl] = useState<CodeVersion | null>(null);

    const dbRef = useRef<duckdb.AsyncDuckDB>();
    const isParquetLoaded = useRef(false);

    // --- COLLAPSE PATCH: Collapsible row/column state ---
    const [expandedTestCases, setExpandedTestCases] = useState<string[]>([]);
    const [visibleClusters, setVisibleClusters] = useState<number[]>([]);
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>({});
    const [showFirstPerCluster, setShowFirstPerCluster] = useState(false);
    const [collapseAllRows, setCollapseAllRows] = useState(false);

    // Load CLUSTER DATA/ABSTRACTIONS/...
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

    const handleAbstractionChange = (event: any) => {
        setSelectedAbstraction(event.target.value);
    };

    // --- COLLAPSE PATCH: Expand/collapse ALL groups on cluster reload ---
    useEffect(() => {
        const testCaseSet = new Set<string>();
        clusters.forEach(cluster => {
            Object.keys(cluster).forEach(key => {
                if (!['id', 'cluster_implementations', 'cluster_size', 'ABSTRACTIONID', 'unique_values'].includes(key)) {
                    const testCase = key.split('@')[0];
                    testCaseSet.add(testCase);
                }
            });
        });
        setExpandedTestCases(Array.from(testCaseSet));
        setVisibleClusters(clusters.map((_, i) => i));
    }, [clusters]);

    // ------------ CLUSTER MATRIX ORACLE TAGGING + COLLAPSIBLE UI LOGIC ------------
    const [gridRows, setGridRows] = useState<any[]>([]);
    const [gridCols, setGridCols] = useState<GridColDef[]>([]);
    const [implDisplayMeta, setImplDisplayMeta] = useState<Record<string, { isOracle: boolean, isClusterOracle: boolean, color: string }>>({});
    // Needed for columns grouping
    const [implToClusterIdx, setImplToClusterIdx] = useState<Record<string, number>>({});
    const [sortedImpls, setSortedImpls] = useState<CodeVersion[]>([]);

    useEffect(() => {
        if (clusters.length === 0) {
            setGridRows([]);
            setGridCols([]);
            setImplDisplayMeta({});
            setImplToClusterIdx({});
            setSortedImpls([]);
            return;
        }
        // 1. Gather all unique implementation IDs and map them to clusters
        const implToClusterIdxLocal: Record<string, number> = {};
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
                implToClusterIdxLocal[key] = clusterIdx;
            });
        });

        // Sort by "original"
        const originalImpls = allImpls.filter(i => i.variantId === 'original');
        const nonOriginalImpls = allImpls.filter(i => i.variantId !== 'original');
        const sortedImplsOriginal = [...originalImpls, ...nonOriginalImpls];

        // identify if mutants are present
        const mutantImpls = allImpls.filter(i => i.variantId.startsWith('mutant'));
        if (mutantImpls && mutantImpls.length > 0) {
            setMutants(mutantImpls);

            if (clusters.length > 0) {
                const clusterImpls = clusters.map((cluster) => parseDuckDBList(cluster.cluster_implementations)).find((impls) => {
                    return impls.find((impl) => impl.variantId === 'original');
                });
                setMutantsKilled(mutantImpls.length - clusterImpls.length - 1);
            }
        }

        const oracleImpls = sortedImplsOriginal.filter(i => i.id === 'oracle');
        const nonOracleImpls = sortedImplsOriginal.filter(i => i.id !== 'oracle');
        const sortedImplsCombined = [...oracleImpls, ...nonOracleImpls];
        setSortedImpls(sortedImplsCombined);

        // 2. Marking: cluster-based oracles, colors
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
        const implMeta: Record<string, { isOracle: boolean, isClusterOracle: boolean, color: string }> = {};
        allImpls.forEach((impl) => {
            const key = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
            const isOracle = impl.id === 'oracle';
            const isClusterOracle = !!clusterBasedOracleImpls.find(i =>
                i.id === impl.id && i.variantId === impl.variantId && i.adapterId === impl.adapterId
            );
            const color = getClusterColor(implToClusterIdxLocal[key]);
            implMeta[key] = { isOracle, isClusterOracle, color };
        });
        setImplDisplayMeta(implMeta);
        setImplToClusterIdx(implToClusterIdxLocal);

        // 4. Row grouping and collapse logic
        const allStatements = new Set<string>();
        clusters.forEach(cluster => {
            Object.keys(cluster).forEach(key => {
                if (!['id', 'cluster_implementations', 'cluster_size', 'ABSTRACTIONID', 'unique_values'].includes(key)) {
                    allStatements.add(key);
                }
            });
        });
        const parsedStmts = Array.from(allStatements).map(stmt => {
            const { testCase, testStmt } = splitTestCaseAndStatement(stmt);
            return { fullKey: stmt, testCase, testStmt };
        });
        parsedStmts.sort((a, b) => {
            const g = a.testCase.localeCompare(b.testCase);
            if (g !== 0) return g;
            const ax = getCoordinates(a.testStmt);
            const bx = getCoordinates(b.testStmt);
            return ax - bx;
        });

        // --- COLLAPSE PATCH: rows only for expanded test cases ---
        const rows: any[] = [];
        let lastTestCase = '';
        parsedStmts.forEach(({ fullKey, testCase, testStmt }, idx) => {
            if (testCase !== lastTestCase) {
                rows.push({
                    id: `header_${testCase}`,
                    statement: testCase,
                    testCase,
                    isCaseHeader: true,
                });
                lastTestCase = testCase;
            }
            // Only add invocation row if expanded and not in collapse all mode
            if (!collapseAllRows && expandedTestCases.includes(testCase)) {
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
            }
        });
        setGridRows(rows);

        // --- Columns: cluster grouping/visibility logic ---
        const columns: GridColDef[] = [
            {
                field: 'statement',
                headerName: 'Test Invocation',
                minWidth: 160,
                maxWidth: 250,
                flex: 1,
                renderCell: (params: GridRenderCellParams) => {
                    if (params.row.isCaseHeader) {
                        const expanded = expandedTestCases.includes(params.row.testCase);
                        return (
                            <>
                                <Box
                                    sx={{
                                        fontWeight: 'bold',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        color: 'primary.main'
                                    }}

                                >
                                    <span onClick={() => {
                                        setExpandedTestCases(prev =>
                                            prev.includes(params.row.testCase)
                                                ? prev.filter(tc => tc !== params.row.testCase)
                                                : [...prev, params.row.testCase]
                                        );
                                    }}
                                        title={expanded ? "Collapse test case group" : "Expand test case group"} style={{ marginRight: 8, fontSize: 18 }}>{expanded ? "▼" : "▶"}</span>
                                    <Box
                                        sx={{
                                            fontWeight: 'bold',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            color: 'primary.main'
                                        }}
                                        onClick={() => setOpenTestCase(params.row.statement)}
                                        title={`Show details for test case "${params.row.statement}"`}
                                    >
                                        {params.value}
                                    </Box>
                                </Box>

                            </>
                        );
                    }
                    const { testStmt } = splitTestCaseAndStatement(params.value as string || '');
                    return testStmt || params.value;
                },
            },
            ...sortedImplsCombined.map((impl) => {
                const implKey = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
                const meta = implMeta[implKey];
                let cand;
                try {
                    cand = getCodeCandidate(impl.id);
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
                                onClick={e => {
                                    e.stopPropagation();
                                    setOpenImpl(impl);
                                }}
                                title="Show details for this implementation"
                            >
                                {cand ? cand.name : impl.id} {impl.variantId != 'original' ? <Chip label={impl.variantId} size="small" /> : null}
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
                        if (params.row.isCaseHeader) return (
                            <Box sx={{
                                bgcolor: meta.color,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                minHeight: "32px",
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}>{""}</Box>
                        );

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
        setGridCols(columns);
    }, [clusters, queryResponse, expandedTestCases, collapseAllRows]);

    // --- COLLAPSE PATCH: Column visibility according to cluster selection ---
    useEffect(() => {
        if (!sortedImpls || !implToClusterIdx) return;
        const model: Record<string, boolean> = {};
        if (showFirstPerCluster) {
            // Only first impl per cluster
            const handledClusters = new Set<number>();
            sortedImpls.forEach(impl => {
                const key = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
                const clusterIdx = implToClusterIdx[key];
                if (!handledClusters.has(clusterIdx)) {
                    model[key] = true;
                    handledClusters.add(clusterIdx);
                } else {
                    model[key] = false;
                }
            });
        } else {
            sortedImpls.forEach(impl => {
                const key = `${impl.id}_${impl.variantId}_${impl.adapterId}`;
                const clusterIdx = implToClusterIdx[key];
                model[key] = visibleClusters.includes(clusterIdx);
            });
        }
        setColumnVisibilityModel(model);
    }, [visibleClusters, sortedImpls, implToClusterIdx, showFirstPerCluster]);

    // ----------- END ORACLE CLUSTER MATRIX LOGIC -----------
    // ----------- RENDER -----------

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" mb={2}>
                Behavioral Clustering (by Abstraction)
                <Typography variant="h6" component="div">Clusters implementations by their exhibited run-time behavior (based on output SRM)</Typography>
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

            {/* --- COLLAPSE PATCH: Cluster column toggler --- */}
            {clusters.length > 0 && (
                <>
                    <FormControl sx={{ mr: 2, minWidth: 200 }}>
                        <InputLabel>Visible clusters</InputLabel>
                        <Select
                            multiple
                            value={visibleClusters}
                            onChange={e => setVisibleClusters(e.target.value as number[])}
                            renderValue={selected => (selected as number[]).slice(0, 5).map(idx => `Cluster ${idx + 1}`).join(', ')}
                        >
                            {clusters.map((_, idx) => (
                                <MenuItem key={idx} value={idx}>
                                    <Checkbox checked={visibleClusters.includes(idx)} />
                                    Cluster {idx + 1}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showFirstPerCluster}
                                onChange={e => setShowFirstPerCluster(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Show only first implementation per cluster"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={collapseAllRows}
                                onChange={e => setCollapseAllRows(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Collapse all rows (show only test case names)"
                    />
                </>
            )}

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
                        <Chip size="small" label="Variant" />
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
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={model => setColumnVisibilityModel(model)}
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
                <>
                    {mutants.length > 0 && (
                        <Box mb={2}>
                            <Typography variant="h6" gutterBottom>Mutation Coverage</Typography>
                            <Typography variant="body2">
                                Total number of mutants: <b>{mutants.length}</b>
                            </Typography>
                            <Typography variant="body2">
                                Total number of killed mutants: <b>{mutantsKilled}</b>
                            </Typography>
                            <Typography variant="body2">
                                Mutation Score: <b>{mutantsKilled / mutants.length}</b>
                            </Typography>
                        </Box>
                    )}

                    <Box mb={2}>
                        <Typography variant="h6" gutterBottom>Cluster Statistics</Typography>
                        <Typography variant="body2">
                            Total number of test cases: <b>{
                                (() => {
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
                        <Typography variant="body2">
                            Total number of code modules: <b>{
                                (() => {
                                    return clusters.flatMap(cluster => {
                                        return parseDuckDBList(cluster.cluster_implementations);
                                    }).length;
                                })()
                            }</b>
                        </Typography>
                        <br />
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
                                                    width: 28,
                                                    height: 18,
                                                    borderRadius: '4px',
                                                    border: '1px solid #bbb'
                                                }} />
                                            </TableCell>
                                            <TableCell>Cluster {idx + 1}</TableCell>
                                            <TableCell>{implementations.length}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {implementations.map((impl, i) => {
                                                        // --- Show nice name as in DataGrid columns ---
                                                        let cand;
                                                        try {
                                                            cand = getCodeCandidate(impl.id);
                                                        } catch {
                                                            cand = undefined;
                                                        }
                                                        const label = [
                                                            (cand && cand.name) ? cand.name : impl.id," (",
                                                            impl.variantId,", ",
                                                            impl.adapterId, ")"
                                                        ].filter(Boolean).join("");
                                                        return (
                                                            <Chip
                                                                key={`${impl.id}_${impl.variantId}_${impl.adapterId}_${i}`}
                                                                label={label}
                                                                onClick={() => setOpenImpl(impl)}
                                                                clickable
                                                                sx={{
                                                                    mb: 0.5,
                                                                    bgcolor: clusterColor,
                                                                    fontWeight: impl.id === 'oracle' ? 700 : 500,
                                                                    border: impl.id === 'oracle' ? '2px solid #2196f3' : undefined,
                                                                }}
                                                                title="Click for implementation details"
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Box>
                </>
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
                                <small>{test?.ssn ? "SSN" : "Code"}</small>
                            </Typography>
                            {test?.ssn ?
                                <ActuationSheet sheetSignature={test.signature} sheetData={SheetService.parseActuationSheet(test)} implementation={""} />
                                : <CodeBlock language="java">{test?.body}</CodeBlock>}
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