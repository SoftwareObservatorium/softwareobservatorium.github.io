import React, { useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Typography } from '@mui/material';

import { useHistory } from '@docusaurus/router';
import { ScriptHub } from '../components/HubFeatures/category';

const HubPage = () => {
  const history = useHistory()



  return (
    <Layout>
      <Head>
        <title>TDSE Hub</title>
        <meta name="description" content="A Hub for TDSEs" />
      </Head>

      <Typography sx={{ margin: 2 }} variant="h5" component="div">TDSEHub<Typography variant="h6" component="div">Explore LSL Pipelines and their Results</Typography></Typography>


      <ScriptHub/>


    </Layout>
  );
}

export default HubPage;
