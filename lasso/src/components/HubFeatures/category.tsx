import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    CircularProgress,
    Grid,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Typography,
    Avatar,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    useTheme,
    useMediaQuery
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import SearchIcon from "@mui/icons-material/Search";
import { ScriptInfo } from "@site/src/services/models";
import LassoService from "@site/src/services/LassoService";
import { LSLViewer } from "./lsleditor";

import VisibilityIcon from '@mui/icons-material/Visibility';
import TableChartIcon from '@mui/icons-material/TableChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AuthService from "@site/src/services/AuthService";

const statusColor: Record<string, "default" | "primary" | "success" | "warning" | "error" | undefined> = {
    SUCCESS: "success",
    FAILED: "error",
    RUNNING: "warning",
    PENDING: "primary",
};

export const ScriptHub: React.FC = () => {
    const [scripts, setScripts] = useState<ScriptInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedScript, setSelectedScript] = useState<ScriptInfo | null>(null);
    const [search, setSearch] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        setLoading(true);
        setError(null);

        AuthService.loginDefault().then(
            (response) => {
                // login successful
                console.log("Successfully logged in")
            },
            (error) => {
                setError(error.message ?? String(error))
            }
        ).then(
            () => {
                LassoService.getHubScripts() // or another default category if needed
                    .then(res => setScripts(res.data))
                    .catch(err => setError(err.message ?? String(err)))
                    .finally(() => setLoading(false));
            }
        );
    }, []);

    // Gather all unique tags from the loaded scripts
    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        scripts.forEach(s => s.tags?.forEach(t => tagsSet.add(t)));
        return Array.from(tagsSet).sort();
    }, [scripts]);

    // Filtering
    const filteredScripts = useMemo(() => {
        let s = scripts;
        const q = search.trim().toLowerCase();
        if (q.length > 0) {
            s = s.filter(script =>
                script.owner?.toLowerCase().includes(q) ||
                script.label?.toLowerCase().includes(q) ||
                script.description?.toLowerCase().includes(q) ||
                script.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        if (selectedTags.length > 0) {
            s = s.filter(script =>
                selectedTags.every(filterTag =>
                    script.tags?.map(tag => tag.toLowerCase()).includes(filterTag.toLowerCase())
                )
            );
        }
        return s;
    }, [scripts, search, selectedTags]);

    function handleTagToggle(tag: string) {
        setSelectedTags(selectedTags =>
            selectedTags.includes(tag)
                ? selectedTags.filter(t => t !== tag)
                : [...selectedTags, tag]
        );
    }

    function clearAllFilters() {
        setSearch("");
        setSelectedTags([]);
    }

    return (
        <Box sx={{ width: "100%", display: "flex", alignItems: "flex-start", p: 3, gap: 3 }}>

            {/* Sidebar: Tag Selector */}
            <Box
                sx={{
                    minWidth: 225,
                    maxWidth: 260,
                    flexShrink: 0,
                    background: theme.palette.background.paper,
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 1,
                    position: isSmall ? "static" : "sticky",
                    top: theme.spacing(3),
                    mb: isSmall ? 2 : 0,
                    height: isSmall ? "auto" : "fit-content"
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Filter by Tag
                </Typography>
                <FormGroup>
                    {allTags.length === 0 && (
                        <Typography color="text.secondary" variant="body2">No tags available</Typography>
                    )}
                    {allTags.map(tag => (
                        <FormControlLabel
                            key={tag}
                            control={
                                <Checkbox
                                    checked={selectedTags.includes(tag)}
                                    onChange={() => handleTagToggle(tag)}
                                    color="primary"
                                />
                            }
                            label={tag}
                        />
                    ))}
                </FormGroup>
                {(selectedTags.length) ? (
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={clearAllFilters}
                        color="secondary"
                    >
                        Clear Filters
                    </Button>
                ) : null}
            </Box>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Search owner, label, description, or tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                    }}
                    sx={{ mb: 2, maxWidth: 480 }}
                />

                {selectedTags.length > 0 &&
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {selectedTags.map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                onDelete={() => handleTagToggle(tag)}
                                color="primary"
                                size="small"
                                variant="filled"
                            />
                        ))}
                    </Stack>
                }

                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && (
                    <Typography color="error" align="center">{error}</Typography>
                )}

                {!loading && !error && (
                    <Grid container spacing={3}>
                        {filteredScripts.map(script => (
                            <Grid item xs={12} sm={6} md={4} key={script.executionId}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        boxShadow: 2,
                                        borderRadius: 3,
                                        transition: '0.25s',
                                        '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' },
                                        display: "flex",
                                        flexDirection: "column",
                                        minHeight: 350,
                                        height: "100%"
                                    }}
                                >
                                    <CardHeader
                                        avatar={
                                            <Avatar sx={{ bgcolor: "#2196f3" }}>
                                                <CodeIcon />
                                            </Avatar>
                                        }
                                        title={<b>{script.label}</b>}
                                        subheader={`By ${script.owner}`}
                                        action={<Chip
                                            label={script.status}
                                            color={statusColor[script.status?.toUpperCase() || ''] || "default"}
                                            size="small"
                                        />}
                                        sx={{ pb: 0 }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle1" gutterBottom>Study '{script.name}'</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ height: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {script.description}
                                        </Typography>
                                        <Box sx={{ my: 1 }}>
                                            {script.tags?.map(tag => (
                                                <Chip
                                                    key={tag}
                                                    label={`#${tag}`}
                                                    onClick={() => handleTagToggle(tag)}
                                                    sx={{ mr: 0.5, mb: 0.5, cursor: "pointer" }}
                                                    size="small"
                                                    color={selectedTags.includes(tag) ? "primary" : "default"}
                                                    variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                                                />
                                            ))}
                                        </Box>
                                        {/* <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      {script.start && script.end && `Duration: ${Math.round((new Date(script.end).getTime() - new Date(script.start).getTime()) / 1000)}s`}
                    </Typography> */}
                                        {/* <Typography variant="caption" color="text.secondary">
                      Permission: {script.permissionType}
                    </Typography> */}
                                    </CardContent>
                                    <CardActions sx={{ mt: "auto" }}>
                                        <Button startIcon={<VisibilityIcon />} size="small" onClick={() => setSelectedScript(script)}>View</Button>
                                        <Button
                                            size="small"
                                            color="secondary"
                                            startIcon={<TableChartIcon />}
                                            target="_blank"
                                            href={`/web/lasso/result?executionId=${encodeURIComponent(script.executionId)}`}
                                        >
                                            Analyze
                                        </Button>
                                        {/* <Button
                      size="small"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      target="_blank"
                      href={`/web/lasso/submit?resumeId=${encodeURIComponent(script.executionId)}`}
                    >
                      Resume
                    </Button> */}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                        {filteredScripts.length === 0 && (
                            <Grid item xs={12}>
                                <Typography align="center" color="text.secondary" sx={{ mt: 5 }}>
                                    No scripts found{(search || selectedTags.length) && <> for applied filters.</>}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                )}

                {selectedScript && (
                    <Dialog open onClose={() => setSelectedScript(null)} maxWidth="md" fullWidth>
                        <DialogTitle>{selectedScript.label} – Script Content</DialogTitle>
                        <DialogContent dividers>
                            <Typography variant="subtitle2" gutterBottom>
                                {selectedScript.name} (by {selectedScript.owner})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedScript.description}
                            </Typography>
                            <LSLViewer script={selectedScript} />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedScript(null)}>Close</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Box>
        </Box>
    );
};