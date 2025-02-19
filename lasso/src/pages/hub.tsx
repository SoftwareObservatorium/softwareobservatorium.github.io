import React, { useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Button, Card, CardActions, CardContent, Divider, Tabs, Typography } from '@mui/material';
import { HubExamples } from '../components/HubFeatures/HubFeatures';
import { Editor } from '@monaco-editor/react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';

import Grid from '@mui/material/Grid2';
import SrmViewer from '../components/SrmViewer';
import GraphComponent from '../components/Graph/graph';

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

const HubPage = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [currentExampleId, setCurrentExampleId] = useState("")

  const [showLslEditor, setShowLslEditor] = useState(false)
  const [showSrmAnalysis, setShowSrmAnalysis] = useState(false)

  const handleLSLClick = (exampleId: string) => {
    setValue(0)

    setCurrentExampleId(exampleId)

    setShowLslEditor(true)
    setShowSrmAnalysis(false)

    if (editorRef.current && editorRef.current.getModel()) {
      editorRef.current.getModel().setValue(HubExamples.MAP[exampleId].lsl);
    }

    window.scrollTo({ top: 0, left: 0 })
  };

  const handleSRMClick = (exampleId: string) => {
    setCurrentExampleId(exampleId)

    setShowLslEditor(false)
    setShowSrmAnalysis(true)

    if (editorRef.current) {
      editorRef.current.getModel().setValue(HubExamples.MAP[exampleId].lsl);
    }

    window.scrollTo({ top: 0, left: 0 })
  };

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
        <title>TDSE Hub</title>
        <meta name="description" content="A hub for TDSEs" />
      </Head>

      <Typography sx={{ margin: 2 }} variant="h5" component="div">TDSEHub<Typography variant="h6" component="div">Explore LSL Pipelines and their SRMs</Typography></Typography>


      <Grid container spacing={2}>

        <Grid size={3}>
          {/* <Box style={{maxHeight: '100vh', overflow: 'auto'}}> */}
          {Object.keys(HubExamples.MAP).map((key) => (
            <><Card sx={{ minWidth: 275, margin: 2 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {HubExamples.MAP[key].label}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{HubExamples.MAP[key].classifier}</Typography>
                <Typography variant="body2">
                  {HubExamples.MAP[key].description}
                </Typography>
              </CardContent>
              <CardActions>
                {/* <Button onClick={(event) => handleLSLClick(key)} size="small">Show LSL Pipeline</Button>
                <Button onClick={(event) => handleSRMClick(key)} size="small">Analyze SRM</Button> */}
                <Button onClick={(event) => handleLSLClick(key)} size="small">Explore</Button>
              </CardActions>
            </Card></>
          ))
          }
          {/* </Box> */}
        </Grid>
        <Grid size={9}>
          {currentExampleId.length > 0 ?

            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                  <Tab label="LSL Pipeline" {...a11yProps(0)} />
                  <Tab label="Graph Viewer" {...a11yProps(1)} />
                  <Tab label="SRM Explorer" {...a11yProps(2)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                <><CardContent>
                  <Typography sx={{ margin: 2 }} variant="h5" component="div">LSL Pipeline Viewer<Typography variant="h6" component="div">Explore the study and actions</Typography></Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{HubExamples.MAP[currentExampleId].description}</Typography>
                  <Typography variant="h5" component="div">
                    <Button sx={{ float: "right" }} disabled>Try (coming soon)</Button>
                    <Editor
                      height="500px"
                      defaultLanguage="java"
                      defaultValue={HubExamples.MAP[currentExampleId].lsl}
                      onMount={handleEditorDidMount} />
                  </Typography>

                </CardContent><CardActions>
                  </CardActions></>
              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                <Typography variant="h5" component="div">
                  <GraphComponent exampleId={currentExampleId} />
                </Typography>
              </CustomTabPanel>
              <CustomTabPanel value={value} index={2}>
                <SrmViewer fileName={HubExamples.MAP[currentExampleId].srmpath} />
              </CustomTabPanel>
            </Box> : null
          }


        </Grid>
      </Grid>





    </Layout>
  );
}

export default HubPage;
