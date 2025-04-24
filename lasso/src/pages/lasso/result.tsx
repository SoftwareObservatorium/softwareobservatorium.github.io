import { Accordion, AccordionSummary, AccordionDetails, Box, Button, CardActions, CardContent, CircularProgress, Link, Tab, Tabs, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';


import { useHistory, useLocation } from '@docusaurus/router';
import LassoService from '@site/src/services/LassoService';
import { ScriptInfo, SearchSrmQueryRequest, SearchSrmQueryResponse } from '@site/src/services/models';
import SrmViewer from '@site/src/components/SrmViewer';

import CodeBlock from '@theme/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Code from '@mui/icons-material/Code';
import ActuationSheet from '@site/src/components/Sheet/ActuationSheet';
import SheetService from '@site/src/components/Sheet/SheetService';
import AuthService from '@site/src/services/AuthService';
import { Editor } from '@monaco-editor/react';
import GraphComponent from '@site/src/components/Graph/graph';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const ResultPage = () => {
  const location = useLocation();

  const [executionId, setExecutionId] = useState(location.search.split('=')[1])
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo>()
  const intervalRef = useRef(null);

  const [queryResponse, setQueryResponse] = useState<SearchSrmQueryResponse>()

  const [value, setValue] = React.useState(0);
  const [currentAction, setCurrentAction] = React.useState<string>();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleActionChange = (event: SelectChangeEvent) => {
    setCurrentAction(event.target.value);
    // update
    queryScript(event.target.value);
  };

  console.log("loading " + executionId)

  const checkScriptJobStatus = () => {
    return LassoService.getScriptJobStatus(executionId)
      .then(
        (response) => {
          let scriptInfo: ScriptInfo = response.data
          console.log("checkScriptJobStatus successful " + scriptInfo.executionId)

          //
          setScriptInfo(scriptInfo)

          if (scriptInfo.status === "SUCCESSFUL") {
            queryScript("")
          }

          return scriptInfo;
        },
        (error) => {
          const resMessage =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString();

          // FIXME
          console.log("checkScriptJobStatus attempt failed " + error)

          return null;
        }
      )
  };

  const login = async () => {
    await AuthService.loginDefault().then(
      (response) => {
        // login successful
        console.log("Successfully logged in")
      },
      (error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        // FIXME
        console.log("Login attempt failed " + error)
      }
    )
  }

  const queryScript = (forAction: string) => {
    const request = new SearchSrmQueryRequest()
    request.executionId = executionId
    request.forAction = forAction

    return LassoService.queryScript(request)
      .then(
        (response) => {
          let queryResponse: SearchSrmQueryResponse = response.data
          console.log("queryScript successful " + JSON.stringify(queryResponse))

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

  useEffect(() => {
    // login
    login()

    intervalRef.current = setInterval(() => {
      checkScriptJobStatus();
      console.log(JSON.stringify(scriptInfo));

    }, 2500);

    /**
 *     UNKNOWN,
PENDING,
FAILED,
SUCCESSFUL,
DRAFT
 */

    if (scriptInfo && scriptInfo.status === "PENDING") {
      console.log("we don't have a result");

    } else if (scriptInfo) {
      console.log("we have a result");

      clearInterval(intervalRef.current)
    } else {

    }

    return () => clearInterval(intervalRef.current);
  })

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  function handleEditorDidMount(editor: any, monaco: any) {
    monaco.languages.register({ id: 'java' });

    monacoRef.current = monaco;
    editorRef.current = editor;
  }

  return (
    <Layout>
      <Head>
        <title>Execution Result</title>
        <meta name="description" content="Material" />
      </Head>

      <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
        Result for LSL Script Execution ({executionId})
      </Typography>

      {scriptInfo ?

        <Grid container spacing={2}>

          <Grid size={12}>

            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                  <Tab label="Overview" {...a11yProps(0)} />
                  <Tab label="LSL Pipeline" {...a11yProps(1)} />
                  {/* {scriptInfo.status === "SUCCESSFUL" ?
                    <>
                      <Tab label="SRM Explorer" {...a11yProps(1)} />
                      <Tab label="JupyterLab" {...a11yProps(2)} />
                      <Tab label="Export Parquet" {...a11yProps(3)} />
                    </>
                    : null} */}
                  {scriptInfo.status === "SUCCESSFUL" ?
                    <Tab label="SRM Explorer" {...a11yProps(2)} />
                    : null}
                  {scriptInfo.status === "SUCCESSFUL" ?
                    <Tab label="JupyterLab" {...a11yProps(3)} />
                    : null}
                  {scriptInfo.status === "SUCCESSFUL" ?
                    <Tab label="Export" {...a11yProps(4)} />
                    : null}
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                <Typography variant="h5" component="div">
                  <p>The execution status of your LSL is <code>{scriptInfo.status}</code> (started {scriptInfo.start.toLocaleString()})</p>
                  {scriptInfo.status === "PENDING" ?
                    <CircularProgress size="3rem" /> : null}
                </Typography>
                {scriptInfo.status === "SUCCESSFUL" ?
                  <p>Note: You can now explore the SRMs in the 'SRM Explorer' tab above.</p> : null}

                {queryResponse ?
                  <>

                    <Typography>
                      A total of '{queryResponse.actions.length}' actions were executed. You can select the LSL action is you are interested in.
                    </Typography>

                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">LSL Action</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={currentAction}
                        label="LSL Action"
                        onChange={handleActionChange}
                      >
                        {queryResponse.actions.map((action, idx) => (
                          <MenuItem value={action}>{action}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <br />
                    <Typography>
                      The following functional abstractions and their corresponding stimulus matrices were defined.
                    </Typography>

                    <br />

                    {queryResponse.abstractions.map((ab) => (

                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="panel2-content"
                          id="panel2-header"
                        >
                          <Typography variant="h6" component="div">Abstraction '{ab.name}' (Action '{ab.action}')</Typography>
                          {/* <CodeBlock language="java">{ab.specification.lql}</CodeBlock> */}
                        </AccordionSummary>
                        <AccordionDetails>

                          <Typography>
                            Interface Specification (LQL)
                          </Typography>
                          <CodeBlock
                            language="groovy">{ab.specification?.interfaceSpecification?.lqlQuery}</CodeBlock>

                          <Typography>
                            {ab.codeUnits.length} Code Module(s)
                          </Typography>

                          <List dense={true}>

                            {ab.codeUnits.map((codeUnit) => (
                              <ListItem key={codeUnit.id}>
                                <ListItemIcon>
                                  <Code />
                                </ListItemIcon>
                                <ListItemText
                                  primary={codeUnit.packagename + "." + codeUnit.name}
                                  secondary={
                                    <React.Fragment>
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        sx={{ color: 'text.primary', display: 'inline' }}
                                      >
                                        <small>{codeUnit.id}</small>
                                      </Typography>
                                      <CodeBlock language="java">{codeUnit.content ? codeUnit.content : "n/a"}</CodeBlock>

                                      <Typography variant="body2" color="text.secondary">
                                        Learn more about <b>this code module</b>:
                                      </Typography>
                                      <Link
                                        href={`/web/lasso/search?query=*:*&filter=id:${codeUnit.id}&ds=lasso_quickstart`}
                                        target="_blank"
                                        rel="noopener"
                                        underline="hover"
                                      >
                                        Details
                                      </Link>
                                    </React.Fragment>
                                  }
                                ></ListItemText>

                              </ListItem>
                            ))}
                          </List>

                          <Typography>
                            {ab.specification.tests.length} Test(s)
                          </Typography>

                          <List dense={true}>

                            {ab.specification.tests.map((test, idx) => (
                              <ListItem key={idx}>
                                <ListItemIcon>
                                  <Code />
                                </ListItemIcon>
                                <ListItemText
                                  primary={test.signature}
                                  secondary={
                                    <React.Fragment>
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
                                  }
                                ></ListItemText>

                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}</>
                  : null}

              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                <CardContent>
                  <Typography sx={{ margin: 2 }} variant="h5" component="div">LSL Pipeline Viewer<Typography variant="h6" component="div">Explore the study and actions</Typography></Typography>
                  <Typography variant="h5" component="div">
                    <Editor
                      height="500px"
                      defaultLanguage="java"
                      defaultValue={scriptInfo.content}
                      onMount={handleEditorDidMount} />
                  </Typography>
                  <br /><Divider /><br />
                  <Typography variant="h5" component="div">Graph Viewer
                    <GraphComponent code={scriptInfo.content} />
                  </Typography>
                </CardContent>
              </CustomTabPanel>
              {scriptInfo.status === "SUCCESSFUL" ?
                <>
                  <CustomTabPanel value={value} index={2}>
                    <SrmViewer fileName={LassoService.retrieveParquetUrl(scriptInfo.executionId)} />
                  </CustomTabPanel>
                  <CustomTabPanel value={value} index={3}>
                    <React.Fragment>
                      <Typography variant="h6" component="div">Analyze SRM Data in Jupyter Lite (WASM powered Juyper running in the browser!)</Typography>
                      <Typography component="div">(note: you can also download the Notebook and run it in your local Juypter environment)</Typography>
                      <br />
                      <p><Link target="_blank" href={`${LassoService.API_URL}notebooks/lab/index.html?fromURL=${LassoService.API_URL}publicapi/v1/lasso/analytics/srm/${scriptInfo.executionId}.ipynb`}>Open Notebook</Link></p>
                    </React.Fragment>
                  </CustomTabPanel>
                  <CustomTabPanel value={value} index={4}>
                    <React.Fragment>
                      <Typography variant="h6" component="div">Export SRM data as Parquet File</Typography>
                      <p><Link target="_blank" href={LassoService.retrieveParquetUrl(scriptInfo.executionId)}>Download Link</Link></p>
                    </React.Fragment>

                  </CustomTabPanel>
                </>

                : null}
            </Box>

          </Grid>
        </Grid> : <CircularProgress size="3rem" />}

      <Divider />
      <br />

      <div className='text--center'>
        <BrowserOnly>
          {() => <p>Permanent Link (Copy) <Link target="_blank" href=""><code>{window.location + ""}</code></Link></p>}
        </BrowserOnly>

      </div>

    </Layout>
  );
}

export default ResultPage;
