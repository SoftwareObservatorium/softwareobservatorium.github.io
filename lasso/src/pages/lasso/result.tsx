import { Box, Button, CardActions, CardContent, CircularProgress, Link, Tab, Tabs, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';


import { useHistory, useLocation } from '@docusaurus/router';
import LassoService from '@site/src/services/LassoService';
import { ScriptInfo } from '@site/src/services/models';
import SrmViewer from '@site/src/components/SrmViewer';

import CodeBlock from '@theme/CodeBlock';
import BrowserOnly from '@docusaurus/BrowserOnly';

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

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      checkScriptJobStatus();
      console.log(JSON.stringify(scriptInfo));

    }, 1000);

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

    return () => clearInterval(intervalRef.current)
  })

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
                  <Tab label="Script Overview" {...a11yProps(0)} />
                  {scriptInfo.status === "SUCCESSFUL" ?
                    <Tab label="SRM Explorer" {...a11yProps(1)} /> : null}
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                <Typography variant="h5" component="div">
                  <p>The execution status of your LSL is <code>{scriptInfo.status}</code> (started {scriptInfo.start})</p>
                  {scriptInfo.status === "PENDING" ?
                    <CircularProgress size="3rem" /> : null}
                </Typography>
                {scriptInfo.status === "SUCCESSFUL" ?
                  <p>You can now explore the SRMs in the 'SRM Explorer' tab above.</p> : null}
                {/* <Typography variant="h5" component="div">
                  <CodeBlock
                    language="groovy">{scriptInfo.content}</CodeBlock>
                </Typography> */}
              </CustomTabPanel>
              {scriptInfo.status === "SUCCESSFUL" ?
                <CustomTabPanel value={value} index={1}>
                  <SrmViewer fileName={LassoService.retrieveParquetUrl(scriptInfo.executionId)} />
                </CustomTabPanel> : null}
            </Box>

          </Grid>
        </Grid> : <CircularProgress size="3rem" />}

      <div className='text--center'>
        <BrowserOnly>
          {() => <p>Permanent Link (Copy) <Link target="_blank" href=""><code>{window.location + ""}</code></Link></p>}
        </BrowserOnly>

      </div>

    </Layout>
  );
}

export default ResultPage;
