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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Link,
    Grid,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as duckdb from '@duckdb/duckdb-wasm';
import axios from 'axios';
import { CodeVersion, SearchSrmQueryRequest, SearchSrmQueryResponse } from '@site/src/services/models';
import LassoService from '@site/src/services/LassoService';
import { CodeSnippetCard } from '../CodeSnippet/CodeSnippetCard';

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
                if(limitOracles) {
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
                <Typography variant="h6" component="div">Clusters tests based on most frequent outputs (based on output SRM)</Typography>
            </Typography>
            <Typography>
                Note: Only presents the test cluster with the highest amount of implementations (i.e., may serve as an oracle using test-based voting)
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
                {clusters.map((cluster, idx) => {
                    const implementations = parseDuckDBList(cluster.cluster_implementations);
                    //console.log("CLUSTER IMPLS " + implementations)

                    const unique_values = parseDuckDBList(cluster.unique_values);

                    // any other fields to show as cluster meta (excluding id, cluster_implementations, unique_values)
                    const metaKeys = Object.keys(cluster).filter(
                        (k) => !['id', 'cluster_implementations', 'unique_values'].includes(k)
                    );

                    return (
                        <Accordion key={cluster.id ?? idx} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flex: 1 }} variant="h6" component="div">
                                    {cluster.SHEETID + '@' + cluster.Y}, Size: {implementations.length}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {/* Optionally display other metadata */}
                                {metaKeys.filter(k => !['cluster_size', 'SHEETID', 'X', 'Y', 'ABSTRACTIONID'].includes(k)).length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">Actuations (Output SRM)</Typography>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Test@Invocation (Actuation Sheet)</TableCell>
                                                    <TableCell>Output</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {metaKeys.filter(k => !['cluster_size', 'SHEETID', 'X', 'Y', 'ABSTRACTIONID'].includes(k)).map((key) => (
                                                    <TableRow key={key}>
                                                        <TableCell>{key}</TableCell>
                                                        <TableCell>{String(cluster[key])}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <Typography variant="subtitle2">All Unique Values</Typography>
                                        <Box>
                                            {unique_values.map((val) => (
                                                <Chip key={val.id} label={val.id} size="small" sx={{ m: 0.5 }} />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                <Typography variant="subtitle2" gutterBottom>
                                    Code Implementations
                                </Typography>
                                <Table component={Paper} size="small" sx={{ mb: 1 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Implementation ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Variant ID</TableCell>
                                            <TableCell>Adapter ID</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {implementations.map((impl: CodeVersion, idx2: number) => (

                                            <TableRow key={impl.id + idx2}>
                                                {queryResponse && getCodeCandidate(impl.id) ?
                                                    <><TableCell><Typography variant="body2" color="text.secondary"><Link
                                                        href={`/web/lasso/search?query=*:*&filter=id:${getCodeCandidate(impl.id).id}&ds=${getCodeCandidate(impl.id).dataSource}`}
                                                        target="_blank"
                                                        rel="noopener"
                                                        underline="hover"
                                                    >{impl.id}</Link>
                                                    </Typography></TableCell><TableCell>{getCodeCandidate(impl.id).name}</TableCell></> : <><TableCell>{impl.id}</TableCell><TableCell>n/a</TableCell></>
                                                }
                                                <TableCell>{impl.variantId}</TableCell>
                                                <TableCell>{impl.adapterId}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {/* {implementations.map((impl: CodeVersion, idx2: number) => (
                                    <Grid container spacing={3} sx={{ mt: 1 }}>
                                        {queryResponse && getCodeCandidate(impl.id) ?
                                            <Grid item xs={12} key={impl.id}>
                                                <CodeSnippetCard snippet={getCodeCandidate(impl.id)} />
                                            </Grid>
                                            : null}
                                    </Grid>
                                ))} */}

                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>
        </Box>
    );
};

export default TestClusteredSRMAccordionViewer;