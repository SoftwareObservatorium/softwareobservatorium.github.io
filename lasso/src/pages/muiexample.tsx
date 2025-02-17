import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
//import { createSearchParams, useNavigate } from 'react-router-dom';

const MuiExamplePage = () => {

  return (
    <Layout>
              <Head>
        <title>About</title>
        <meta name="description" content="This is the about page" />
      </Head>
    
              <Grid item xs={12} md={6}>
          <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            Examples
          </Typography>
          <p>Hallo</p>
        </Grid>

        </Layout>
  );
}

export default MuiExamplePage;
