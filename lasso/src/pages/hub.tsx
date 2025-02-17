import React, { useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Box, Button, Card, CardActions, CardContent, Divider, Typography } from '@mui/material';
import { HubExamples } from '../components/HubFeatures/HubFeatures';
import { Editor } from '@monaco-editor/react';

import Grid from '@mui/material/Grid2';
import SrmViewer from '../components/SrmViewer';

const HubPage = () => {
  const [currentExampleId, setCurrentExampleId] = useState("")

  const [showLslEditor, setShowLslEditor] = useState(false)
  const [showSrmAnalysis, setShowSrmAnalysis] = useState(false)

  const handleLSLClick = (exampleId: string) => {
    setCurrentExampleId(exampleId)

    setShowLslEditor(true)
    setShowSrmAnalysis(false)

    if(editorRef.current) {
      editorRef.current.getModel().setValue(HubExamples.MAP[exampleId].lsl);
    }

    window.scrollTo({ top: 0, left: 0})
  };

  const handleSRMClick = (exampleId: string) => {
    setCurrentExampleId(exampleId)

    setShowLslEditor(false)
    setShowSrmAnalysis(true)

    if(editorRef.current) {
      editorRef.current.getModel().setValue(HubExamples.MAP[exampleId].lsl);
    }

    window.scrollTo({ top: 0, left: 0})
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

      <Typography sx={{margin: 2}} variant="h5" component="div">TDSEHub<Typography variant="h6" component="div">Explore LSL Pipelines and their SRMs</Typography></Typography>
      

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
                <Button onClick={(event) => handleLSLClick(key)} size="small">Show LSL Pipeline</Button>
                <Button onClick={(event) => handleSRMClick(key)} size="small">Analyze SRM</Button>
              </CardActions>
            </Card></>
          ))
          }
          {/* </Box> */}
        </Grid>
        <Grid size={9}>
          { currentExampleId ? <Typography sx={{margin: 2}} variant="h5" component="div"><Typography variant="h6" component="div">Study '{HubExamples.MAP[currentExampleId].label}'</Typography></Typography> : null }

          {showLslEditor ?
            <><CardContent>
      <Typography sx={{margin: 2}} variant="h5" component="div">LSL Pipeline Viewer<Typography variant="h6" component="div">Explore the study and actions</Typography></Typography>
      
              <Typography variant="h5" component="div">
                <Editor
                  height="500px"
                  defaultLanguage="java"
                  defaultValue={HubExamples.MAP[currentExampleId].lsl}
                  onMount={handleEditorDidMount} />
              </Typography>
            </CardContent><CardActions>
              </CardActions></> : null}
          {showSrmAnalysis ?
            <SrmViewer fileName={HubExamples.MAP[currentExampleId].srmpath} /> : null
          }
        </Grid>
      </Grid>





    </Layout>
  );
}

export default HubPage;
