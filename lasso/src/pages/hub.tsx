import React, { useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Link, Typography } from '@mui/material';

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

      <Typography sx={{ margin: 2 }} variant="h5" component="div">TDSEHub<Typography variant="h6" component="div">Explore LSL Pipelines and Analyze SRMs</Typography></Typography>

      <Typography sx={{ margin: 2 }} variant="body2">
        Note: The old (deprecated) TDSEHub can be still found <Link target="_blank" href={"hub0"}>here</Link>. LSL pipelines can also be generated as part of <Link target="_blank" href={"search"}>Code Search</Link> and <Link target="_blank" href={"generation"}>Code Generation</Link>.
      </Typography>

      <ScriptHub />


    </Layout>
  );
}

export default HubPage;
