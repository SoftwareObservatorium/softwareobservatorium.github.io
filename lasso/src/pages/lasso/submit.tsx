import React, { useEffect, useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Button, CardActions, CardContent, CircularProgress, Divider, Tabs, Typography } from '@mui/material';
import { Editor } from '@monaco-editor/react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';

import Grid from '@mui/material/Grid2';
import { LslRequest, LslResponse, ScriptInfo } from '@site/src/services/models';
import LassoService from '@site/src/services/LassoService';
import AuthService from '@site/src/services/AuthService';
import { useHistory, useLocation } from '@docusaurus/router';
import GraphComponent from '@site/src/components/Graph/graph';
import ActionList from '@site/src/components/actions/actions';

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

const SubmitPage = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const location = useLocation()
  const history = useHistory()

  const [executionId, setExecutionId] = useState(location.search.split('=')[1])
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    let lslRequest = new LslRequest()

    // get current value
    lslRequest.script = editorRef.current.getModel().getValue()
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    lslRequest.email = user.email;
    lslRequest.type = null //draft ? "DRAFT" : null;
    console.log(lslRequest);

    const responses = execute(lslRequest)
  };

  const execute = async (lslRequest: LslRequest) => {
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

    await LassoService.execute(lslRequest).then(
      (response) => {
        let lslResponse: LslResponse = response.data
        console.log("Successfully executed. Execution ID is " + lslResponse.executionId)

        // redirect to result page
        history.push(`/web/lasso/result?executionId=${lslResponse.executionId}`)
      },
      (error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        // FIXME
        console.log("Execute attempt failed " + error)
      }
    )
  };

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  async function handleEditorDidMount(editor: any, monaco: any) {
    monaco.languages.register({ id: 'java' });

    monacoRef.current = monaco;
    editorRef.current = editor;

    if (executionId) {
      await LassoService.getScriptJobStatus(executionId)
        .then(res => {
          const scriptInfo: ScriptInfo = res.data;
          setScriptInfo(scriptInfo);

          editorRef.current.getModel().setValue(scriptInfo.content);

        })
        .catch(err => setError(err.message ?? String(err)))
        .finally(() => setLoading(false));
    } else {
      editorRef.current.getModel().setValue("");
    }
  }

  return (
    <Layout>
      <Head>
        <title>LSL Pipeline Editor</title>
        <meta name="description" content="LSL Script Editor" />
      </Head>

      <Typography sx={{ margin: 2 }} variant="h5" component="div">LSL Script Editor<Typography variant="h6" component="div">Write and Submit a LSL Pipeline Script to LASSO's Playground Platform</Typography>

      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" align="center">{error}</Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={12}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="LSL Pipeline" {...a11yProps(0)} />
                <Tab label="Available Actions" {...a11yProps(1)} />
                {/* <Tab label="Graph Viewer" {...a11yProps(1)} /> */}
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <><CardContent>
                <Typography sx={{ margin: 2 }} variant="h5" component="div">LSL Pipeline Editor</Typography>
                <Typography variant="h5" component="div">
                  <Editor
                    height="500px"
                    defaultLanguage="java"
                    defaultValue={"loading ..."}
                    onMount={handleEditorDidMount} />
                </Typography>
                <Button sx={{ float: "left" }} onClick={(event) => handleSubmit()}>Submit</Button>

              </CardContent><CardActions>
                </CardActions></>
            </CustomTabPanel>
            {/* <CustomTabPanel value={value} index={1}>
              <Typography variant="h5" component="div">
                <GraphComponent code={scriptInfo.content} />
              </Typography>
            </CustomTabPanel> */}
            <CustomTabPanel value={value} index={1}>
              <ActionList />
            </CustomTabPanel>
          </Box>


        </Grid>
      </Grid>

    </Layout>
  );
}

export default SubmitPage;
