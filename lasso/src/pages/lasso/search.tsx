import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    InputAdornment,
    Pagination,
    Stack,
    Link,
    List,
    ListItem,
    ListItemButton,
    Dialog,
    DialogTitle,
    DialogContent,
    ListItemText,
    DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CodeSnippet, SearchQueryRequest, SearchQueryResponse, TextualSearch } from '@site/src/services/models';
import LassoService from '@site/src/services/LassoService';
import { CodeSnippetCard } from '@site/src/components/CodeSnippet/CodeSnippetCard';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import { TDSExamples } from '@site/src/components/HubFeatures/HubFeatures';
import AuthService from '@site/src/services/AuthService';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const RESULTS_PER_PAGE = 10;

interface DataSource {
    id: string;
    name: string;
    description?: string;
    url?: string;
}

const CodeSearchPage: React.FC = () => {
    // Only run in browser context
    let filterString = ""
    let urlQueryString = ""
    let urlDataSourceString = ""
    let exampleId = ""
    let filters: Record<string, string> = {};
    if (typeof window != "undefined") {
        const searchParams = new URLSearchParams(window.location.search);

        filterString = searchParams.get("filter") ?? "";
        urlQueryString = searchParams.get("query") ?? "";
        urlDataSourceString = searchParams.get("ds") ?? "";

        exampleId = searchParams.get("example") ?? "";

        filterString.split(",").forEach(pair => {
            const [key, value] = pair.split(":");
            if (key && value) {
                filters[key] = value;
            }
        });

        console.log(urlQueryString)
        console.log(urlDataSourceString)
        console.log(filters)
        console.log(exampleId)
    }

    const [urlQuery, setUrlQuery] = useState(urlQueryString);
    const [urlDataSource, setUrlDataSource] = useState(urlDataSourceString ? urlDataSourceString : 'mavenCentral2023');
    const [urlFilters, setUrlFilters] = useState(filters);

    const [currentExampleId, setCurrentExampleId] = useState(exampleId)

    const [query, setQuery] = useState(urlQueryString ? urlQueryString : ``);

    const [results, setResults] = useState<CodeSnippet[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // New state for dialog and datasources:
    const [dsDialogOpen, setDsDialogOpen] = useState(false);
    const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);
    const [dataSourcesLoading, setDataSourcesLoading] = useState(false);



    const sortImplementationsToArray = (implementations: any): any[] => {
        const jsonArray = Array.from(Object.values(implementations));

        // sort the array by the "score" attribute
        jsonArray.sort((a: any, b: any) => a.score > b.score ? -1 : (b.score > a.score ? 1 : 0));

        for (let [i, elem] of jsonArray.entries()) {
            let impl: any = elem
        }

        return jsonArray;
    };

    // Helper to open dialog and fetch datasources on-open:
    const handleOpenDatasourceDialog = async () => {
        setDsDialogOpen(true);
        setDataSourcesLoading(true);
        try {
            const response = await LassoService.getDataSources();
            
            // Now extract: response.data.dataSources, convert to array:
            const dsMap = response.data.dataSources;
            const dsArray = Object.values(dsMap) as DataSource[];
            setAvailableDataSources(dsArray);
        } catch (error) {
            // Handle error as you wish (alert, etc)
            setAvailableDataSources([]);
        }
        setDataSourcesLoading(false);
    };
    const handleCloseDatasourceDialog = () => setDsDialogOpen(false);

    // When a datasource is selected:
    const handleSelectDatasource = (selectedId: string) => {
        setUrlDataSource(selectedId); // This changes which is used for searching
        setDsDialogOpen(false);
    };

    const handleSearch = async () => {
        // do a textual search
        let textualSearch = new TextualSearch()
        textualSearch.lql = query

        textualSearch.filters = Object.entries(urlFilters).map(([key, value]) => `${key}:${value}`)

        // *:* ID: 813d0d2c-f392-4e0b-af07-4901ebdb4abc (Data Source: mavenCentral2023)
        textualSearch.strategy = 'class-simple'

        let lassoDataSource: string = urlDataSource

        let request = new SearchQueryRequest();
        request.query = textualSearch.lql
        request.filters = textualSearch.filters
        request.strategy = textualSearch.strategy

        request.start = 0;
        request.rows = 100;

        setLoading(true);
        setSearched(true);
        setPage(1);

        console.log(JSON.stringify(request))

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

        await LassoService.queryImplementationsForDataSource(lassoDataSource, request).then(
            (response) => {
                let sResponse: SearchQueryResponse = response.data
                //console.log(JSON.stringify(sResponse))

                setTotal(sResponse.total)

                const sorted = sortImplementationsToArray(sResponse.implementations);

                setResults(sorted)

                setLoading(false);
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                // FIXME
                console.log("query attempt failed " + error)

                setLoading(false);
            }
        )
    };

    // Pagination logic
    const pageCount = Math.ceil(results.length / RESULTS_PER_PAGE);
    const pagedResults = results.slice(
        (page - 1) * RESULTS_PER_PAGE,
        page * RESULTS_PER_PAGE
    );

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        // Optionally, scroll to top of results when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (urlQuery) {
            handleSearch()
        }

        if (currentExampleId) {
            console.log("example " + currentExampleId)

            const example = TDSExamples.MAP[currentExampleId]
            setQuery(example.lql)
        }
    }, []);

    return (
        <Layout>
            <Head>
                <title>Interface-driven Code Search</title>
                <meta name="description" content="Interface-driven Code Search" />
            </Head>

            <Typography sx={{ margin: 2 }} variant="h5" component="div">Interface-driven Code Search<Typography variant="h6" component="div">Interface-driven Code Search (Code Index: Snapshot of Maven Central)</Typography></Typography>

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item xs={10} sm={8}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search code…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            size="small"
                            multiline={true}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            startIcon={<SearchIcon />}
                        >
                            Search
                        </Button>
                    </Grid>

                    {/* NEW: Datasource selector button  */}
                    <Grid item>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleOpenDatasourceDialog}
                            endIcon={<ArrowDropDownIcon />}
                        >
                            Datasource: {urlDataSource}
                        </Button>
                    </Grid>

                    <Grid item>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Learn more about the <b>LQL Query Language</b>:
                        </Typography>
                        <Link
                            href="/web/docs/datastructures/lql"
                            target="_blank"
                            rel="noopener"
                            underline="hover"
                        >
                            Documentation
                        </Link>
                    </Stack>
                    </Grid>


                </Grid>

                {/* Datasource selection dialog */}
                <Dialog open={dsDialogOpen} onClose={handleCloseDatasourceDialog} fullWidth>
                    <DialogTitle>Select a Datasource</DialogTitle>
                    <DialogContent dividers>
                        {dataSourcesLoading ? (
                            <CircularProgress />
                        ) : (
                            <List>
                                {availableDataSources.map(ds => (
                                    <ListItem key={ds.id} disablePadding>
                                        <ListItemButton onClick={() => handleSelectDatasource(ds.id)}>
                                            <ListItemText
                                                primary={ds.name}
                                                secondary={ds.description}
                                                style={ds.id === urlDataSource ? { fontWeight: 'bold' } : {}}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {availableDataSources.length === 0 && (
                                    <Typography color="text.secondary">
                                        No datasources found.
                                    </Typography>
                                )}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDatasourceDialog} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <div style={{ minHeight: 320, marginTop: 40 }}>
                    {!loading && searched && total > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {total} result{total === 1 ? '' : 's'} found
                        </Typography>
                    )}
                    {/* Pagination controls */}
                    {!loading && results.length > RESULTS_PER_PAGE && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                        </Stack>
                    )}

                    {loading && <CircularProgress />}
                    {!loading && searched && results.length === 0 && (
                        <Typography color="text.secondary" align="center">
                            No results found. Try a different query.
                        </Typography>
                    )}
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {pagedResults.map((r) => (
                            <Grid item xs={12} key={r.id}>
                                <CodeSnippetCard snippet={r} />
                            </Grid>
                        ))}
                    </Grid>
                    {/* Pagination controls */}
                    {!loading && results.length > RESULTS_PER_PAGE && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                        </Stack>
                    )}
                </div>
            </Container>
            <br />
        </Layout>
    );
};

export default CodeSearchPage;