import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Button,
  ButtonGroup,
  CardContent,
  Divider,
  Typography,
  Link,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp, GridToolbar } from '@mui/x-data-grid';
import { Editor } from '@monaco-editor/react';
import * as duckdb from '@duckdb/duckdb-wasm';
import axios from 'axios';

interface SrmViewerProps {
  fileName: string;
}

type LoadingState = 'unloaded' | 'loading' | 'loaded' | 'error';

const ALL_BUTTONS: { group: string; buttons: { label: string; sql: string }[] }[] = [
  {
    group: 'SRM Basic Views',
    buttons: [
      { label: 'Load Raw SRM parquet', sql: 'SELECT * FROM tdse_srm.parquet' },
      { label: 'Query SQL', sql: '' }, // This calls current editor value (see below)
      {
        label: 'Show Tests',
        sql: 'SELECT SHEETID FROM tdse_srm.parquet GROUP BY SHEETID ORDER BY SHEETID',
      },
      {
        label: 'Show Test Statements',
        sql: `SELECT SHEETID, X, Y FROM tdse_srm.parquet WHERE X >= 0 AND Y >= 0 GROUP BY SHEETID, X, Y ORDER BY SHEETID, X, Y`,
      },
      {
        label: 'Show Compilation Units',
        sql: `SELECT SYSTEMID FROM tdse_srm.parquet WHERE SYSTEMID != 'abstraction' AND SYSTEMID != 'oracle' GROUP BY SYSTEMID`,
      },
      {
        label: 'Show Executed Implementations',
        sql: `SELECT SYSTEMID, VARIANTID, ADAPTERID FROM tdse_srm.parquet WHERE SYSTEMID != 'abstraction' AND SYSTEMID != 'oracle' GROUP BY SYSTEMID, VARIANTID, ADAPTERID`,
      },
      {
        label: 'View Outputs',
        sql: `PIVOT (SELECT SHEETID, X, Y, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) AS SYSTEMID, value FROM tdse_srm.parquet WHERE type = 'value') ON SYSTEMID USING first(VALUE) ORDER BY SHEETID, X, Y`,
      },
      {
        label: 'View Services',
        sql: `PIVOT (SELECT SHEETID, X, Y, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) AS SYSTEMID, value FROM tdse_srm.parquet WHERE type = 'service') ON SYSTEMID USING first(VALUE) ORDER BY SHEETID, X, Y`,
      },
      {
        label: 'View Inputs',
        sql: `PIVOT (SELECT SHEETID, X, Y, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) AS SYSTEMID, value FROM tdse_srm.parquet WHERE type = 'input_value') ON SYSTEMID USING first(VALUE) ORDER BY SHEETID, X, Y`,
      },
      {
        label: 'View Operations',
        sql: `PIVOT (SELECT SHEETID, X, Y, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) AS SYSTEMID, value FROM tdse_srm.parquet WHERE type = 'op') ON SYSTEMID USING first(VALUE) ORDER BY SHEETID, X, Y`,
      },
      {
        label: 'View All',
        sql: `PIVOT (SELECT SHEETID, X, Y, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) AS SYSTEMID, value, type FROM tdse_srm.parquet) ON SYSTEMID USING first(VALUE) ORDER BY SHEETID, X, Y`,
      },
    ],
  },
  {
    group: 'Cluster-based Voting',
    buttons: [
      {
        label: 'Cluster-based Voting',
        sql: `SELECT count(*) AS cluster_size, list(SYSTEMID) AS cluster_implementations, * EXCLUDE (SYSTEMID) FROM (PIVOT (SELECT CONCAT(SHEETID,'@',X, ',', Y) as statement, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) as SYSTEMID, value from tdse_srm.parquet where type = 'value') ON STATEMENT USING first(VALUE) ORDER BY SYSTEMID) as mypiv group by all order by cluster_size DESC`,
      },
      {
        label: 'Cluster-based Voting (Ignore Create)',
        sql: `SELECT count(*) AS cluster_size, list(SYSTEMID) AS cluster_implementations, * EXCLUDE (SYSTEMID) FROM (PIVOT (SELECT CONCAT(SHEETID,'@',X, ',', Y) as statement, CONCAT(SYSTEMID,'_',VARIANTID,'_',ADAPTERID) as SYSTEMID, value from tdse_srm.parquet where type = 'value' and y > 0) ON STATEMENT USING first(VALUE) ORDER BY SYSTEMID) as mypiv group by all order by cluster_size DESC`,
      },
      // Test-based voting commented out in original; can uncomment if needed!
    ],
  },
  {
    group: 'Test-based Oracle',
    buttons: [
      {
        label: 'Test-based Oracle',
        sql: `
SELECT 
    ABSTRACTIONID,
    SHEETID,
    X,
    Y,
    MODE(VALUE) as test_based_oracle,
    list(DISTINCT VALUE) as distinct_values,
    (select list(CONCAT(SYSTEMID, '_', VARIANTID, '_', ADAPTERID) ORDER BY SYSTEMID, VARIANTID, ADAPTERID) from tdse_srm.parquet where VALUE = test_based_oracle and TYPE = 'value' and ABSTRACTIONID = tbl1.ABSTRACTIONID and SHEETID = tbl1.SHEETID and X = tbl1.X and Y=tbl1.Y) as matches
from tdse_srm.parquet as tbl1 where TYPE = 'value' and SYSTEMID != 'oracle' GROUP BY ABSTRACTIONID, SHEETID, X, Y ORDER BY SHEETID, X, Y
        `.trim(),
      },
      {
        label: 'Test-based Oracle (Ignore Create)',
        sql: `
SELECT 
    ABSTRACTIONID,
    SHEETID,
    X,
    Y,
    MODE(VALUE) as test_based_oracle,
    list(DISTINCT VALUE) as distinct_values,
    (select list(CONCAT(SYSTEMID, '_', VARIANTID, '_', ADAPTERID) ORDER BY SYSTEMID, VARIANTID, ADAPTERID) from tdse_srm.parquet where VALUE = test_based_oracle and TYPE = 'value' and ABSTRACTIONID = tbl1.ABSTRACTIONID and SHEETID = tbl1.SHEETID and X = tbl1.X and Y=tbl1.Y) as matches
from tdse_srm.parquet as tbl1 where TYPE = 'value' and SYSTEMID != 'oracle' and Y > 0 GROUP BY ABSTRACTIONID, SHEETID, X, Y ORDER BY SHEETID, X, Y
        `.trim(),
      },
    ],
  },
  {
    group: 'Code Coverage (JaCoCo) - if measured by LSL Pipeline (Alternatives: BRANCH, LINE, INSTRUCTION)',
    buttons: [
      {
        label: 'Cycl. Complexity (Ratio Covered)',
        sql: `
SELECT * FROM tdse_srm.parquet where sheetid = 'jacoco' and type = 'COMPLEXITY_COVEREDRATIO' order by value asc`.trim(),
      },
      {
        label: 'Cycl. Complexity Total',
        sql: `
SELECT * FROM tdse_srm.parquet where sheetid = 'jacoco' and type = 'COMPLEXITY_TOTALCOUNT' order by value asc`.trim(),
      },
      {
        label: 'Cycl. Complexity Covered',
        sql: `
SELECT * FROM tdse_srm.parquet where sheetid = 'jacoco' and type = 'COMPLEXITY_COVEREDCOUNT' order by value asc`.trim(),
      },
      {
        label: 'Cycl. Complexity Missed',
        sql: `
SELECT * FROM tdse_srm.parquet where sheetid = 'jacoco' and type = 'COMPLEXITY_MISSEDCOUNT' order by value asc`.trim(),
      },
    ],
  },
];

export const SrmViewer: React.FC<SrmViewerProps> = ({ fileName }) => {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM tdse_srm.parquet');
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('unloaded');
  const [error, setError] = useState<string | null>(null);

  const dbRef = useRef<duckdb.AsyncDuckDB>();
  const isParquetLoaded = useRef(false);

  // DataGrid expects a stable and unique id. Try to infer a good key.
  // const inferId = (row: any, i: number) => {
  //   if ("ROWID" in row) return row.ROWID;
  //   if ("id" in row) return row.id;
  //   // Or compose from key fields, fallback to index
  //   return (
  //     // Try to combine keys that are present
  //     ["SHEETID", "X", "Y", "SYSTEMID", "STATEMENT"]
  //       .map((k) => row[k])
  //       .filter(Boolean)
  //       .join("_") || i
  //   );
  // };

  // --- DuckDB init & Parquet registration; only runs ONCE per session
  const ensureDuckDbReady = useCallback(async () => {
    if (dbRef.current && isParquetLoaded.current) return dbRef.current;

    setLoadingState('loading');
    setError(null);

    try {
      // DuckDB boot
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

  // --- Query execution
  const runQuery = useCallback(
    async (query: string) => {
      setLoadingState('loading');
      setError(null);
      try {
        const db = await ensureDuckDbReady();
        if (!db) throw new Error('DuckDB/Parquet not loaded');
        const conn = await db.connect();

        const arrowResult = await conn.query(query);

        const array = arrowResult.toArray().map((row: any) => row.toJSON());
        //console.log(array)
        const autoColumns: GridColDef[] =
          array[0]
            ? Object.keys(array[0]).map((col) => ({
                field: col,
                headerName: col,
                width: 180 + 60 * Math.min(3, String(array[0][col]).length / 10),
              }))
            : [];

        setColumns(autoColumns);
        setRows(
          array//.map((row: any, i: number) => ({ id: inferId(row, i), ...row }))
        );

        setLoadingState('loaded');
        await conn.close();
      } catch (e: any) {
        setError(`DuckDB query failed: ${e?.message ?? e}`);
        setLoadingState('error');
      }
    },
    [ensureDuckDbReady]
  );

  // Run initial query on mount (for default/auto load)
  useEffect(() => {
    runQuery(sqlQuery);
    // eslint-disable-next-line
  }, []);

  // -- Handle Monaco editor SQL update
  const handleEditorChange = (
    value: string | undefined /*, ev: monaco.editor.IModelContentChangedEvent */
  ) => {
    setSqlQuery(value ?? '');
  };

  // --- Button click helpers
  const handleButtonClick = (sql: string, label: string) => {
    // "Query SQL" uses the current SQL query from the editor
    if (label === 'Query SQL') {
      runQuery(sqlQuery);
    } else {
      setSqlQuery(sql);
      runQuery(sql);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" mb={1}>
        Explore SRM data using DuckDB (WASM)
      </Typography>

      <CardContent>
        <Typography sx={{ color: 'text.secondary', fontSize: 18 }}>
          SQL Editor (DuckDB in your browser)
        </Typography>
        <Editor
          height="120px"
          defaultLanguage="sql"
          value={sqlQuery}
          onChange={handleEditorChange}
          options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: 'on' }}
        />
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => runQuery(sqlQuery)}
          disabled={loadingState === 'loading'}
        >
          Run Query
        </Button>
      </CardContent>

      {ALL_BUTTONS.map((group, idx) => (
        <React.Fragment key={group.group}>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontWeight: 'bold', mb: 1 }} variant="body1">
            {group.group}
          </Typography>
          <ButtonGroup
            variant="contained"
            size="small"
            aria-label={group.group}
            sx={{ flexWrap: 'wrap', mb: 1 }}
          >
            {group.buttons.map((btn) => (
              <Button
                key={btn.label}
                sx={{ textTransform: 'none' }}
                onClick={() => handleButtonClick(btn.sql, btn.label)}
              >
                {btn.label}
              </Button>
            ))}
          </ButtonGroup>
        </React.Fragment>
      ))}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Link href={fileName} target="_blank" rel="noopener">
          Download Raw Parquet
        </Link>
      </Box>

      {loadingState === 'loading' && (
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography mt={1}>Loading SRM data...</Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          slots={{ toolbar: GridToolbar }}
          rows={rows}
          columns={columns}
          getRowId={(row: any) => /* FIXME unique ID required */ Math.floor(Math.random() * 100000000)}
          disableRowSelectionOnClick
          sx={{ mt: 1 }}
        />
      </Box>
    </Box>
  );
};

export default SrmViewer;