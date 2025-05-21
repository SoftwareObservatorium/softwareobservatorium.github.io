import React, { useEffect, useRef, useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { Typography } from '@mui/material';
import ActionList from '@site/src/components/actions/actions';

const ActionsPage = () => {


  return (
    <Layout>
      <Head>
        <title>LASSO Actions</title>
        <meta name="description" content="LSL Editor" />
      </Head>

      <Typography sx={{ margin: 2 }} variant="h5" component="div">Actions<Typography variant="h6" component="div">Explore available Actions and their configuration parameters</Typography>

      </Typography>

      <ActionList/>

    </Layout>
  );
}

export default ActionsPage;
