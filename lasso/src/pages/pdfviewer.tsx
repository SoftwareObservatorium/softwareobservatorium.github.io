import { Button, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useState } from 'react';

import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
//import { createSearchParams, useNavigate } from 'react-router-dom';

import { Document, Page } from 'react-pdf'

import { pdfjs } from 'react-pdf';

import "react-pdf/dist/esm/Page/AnnotationLayer.css"

import { useHistory, useLocation } from '@docusaurus/router';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PdfViewerPage = () => {
  const location = useLocation();

  const [fileName, setFileName] = useState("/web/resources/" + location.search.split('=')[1])

  console.log("loading " + fileName)

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <Layout>
      <Head>
        <title>LASSO Resources</title>
        <meta name="description" content="Material" />
      </Head>

        <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            Material ({numPages} Pages)
          </Typography>

      <Grid container spacing={2}>

        <Grid size={12}>
          <Document file={fileName} onLoadSuccess={onDocumentLoadSuccess}>
            {/* <Page pageNumber={pageNumber} renderTextLayer={false} /> */}
            {Array.apply(null, Array(numPages))
    .map((x, i)=>i+1)
    .map(page => <Page pageNumber={page} renderTextLayer={false} />)}
          </Document>
        </Grid>
      </Grid>

    </Layout>
  );
}

export default PdfViewerPage;
