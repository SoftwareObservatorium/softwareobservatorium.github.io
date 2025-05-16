import React from "react";
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Stack,
    Chip,
    Tooltip,
    Divider,
    List,
    ListItem,
    ListItemText,
    Box,
    Link
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import ScoreIcon from "@mui/icons-material/Star";
import PackageIcon from "@mui/icons-material/Archive";
import JavaIcon from "@mui/icons-material/Coffee";
import InfoIcon from "@mui/icons-material/Info";
import { CodeSnippet } from "@site/src/services/models";

import CodeBlock from '@theme/CodeBlock';

type CodeSnippetProps = {
    snippet: CodeSnippet;
};

const measureLabels: Partial<Record<string, string>> = {
    m_static_line_td: "Lines",
    m_static_loc_td: "LOC",
    m_static_methods_td: "Methods",
    m_static_complexity_td: "Complexity",
};

export const CodeSnippetCard: React.FC<CodeSnippetProps> = ({ snippet }) => (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
            avatar={<JavaIcon color="primary" />}
            title={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{snippet.name}</span>
                    <Chip
                        label={snippet.docType?.toUpperCase() ?? snippet.unitType}
                        size="small"
                        color="secondary"
                    />
                </Stack>
            }
            subheader={
                <Stack direction="row" spacing={1}>
                    <Chip icon={<PackageIcon />} size="small" label={snippet.packagename} />
                    <Chip
                        icon={<CodeIcon />}
                        size="small"
                        color="primary"
                        label={snippet.groupId + ":" + snippet.artifactId}
                    />
                    <Chip size="small" label={snippet.version} />
                    {/* <Chip
                        label={snippet.dataSource?.toUpperCase()}
                        size="small" /> */}
                </Stack>
            }
            action={
                <Tooltip title={`Lucene Score: ${snippet.score.toFixed(2)}`}>
                    <Chip
                        icon={<ScoreIcon fontSize="small" />}
                        color="success"
                        size="small"
                        label={snippet.score.toFixed(1)}
                    />
                </Tooltip>
            }
        />
        <CardContent sx={{ flexGrow: 1, pt: 0 }}>
            {/* Short Description and URLs */}
            {snippet.metaData?.meta_description_s?.length ? (
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <InfoIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                    {snippet.metaData.meta_description_s[0]}
                </Typography>
            ) : null}
            {snippet.metaData?.meta_url_s?.length ? (
                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                    <Link href={snippet.metaData.meta_url_s[0]} target="_blank" rel="noopener">
                        {snippet.metaData.meta_url_s[0]}
                    </Link>
                </Typography>
            ) : null}

            {/* Methods */}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Signature (LQL):
            </Typography>
            {/* <List dense disablePadding>
                {snippet.methods.map((mth, idx) => (
                    <ListItem key={idx} disableGutters sx={{ pl: 0 }}>
                        <ListItemText primary={<Typography fontFamily="monospace">{mth}</Typography>} />
                    </ListItem>
                ))}
            </List> */}

            <CodeBlock
                language="java">
                {snippet.lql ? snippet.lql : "n/a"}
            </CodeBlock>

            {/* Basic software metrics */}
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {Object.entries(measureLabels).map(
                    ([key, label]) =>
                        snippet.measures?.[key] !== undefined && (
                            <Chip
                                key={key}
                                label={`${label}: ${snippet.measures[key]}`}
                                color="default"
                                size="small"
                            />
                        )
                )}
            </Stack>

            {/* Code content */}
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Source:
            </Typography>
            <Box sx={{maxHeight: 350,
                overflow: "auto"
            }}>
            <CodeBlock
                language="java" showLineNumbers={true}>
                {snippet.content ? snippet.content : "n/a"}
            </CodeBlock>
            </Box>

            {/* <Box
                component="pre"
                sx={{
                    background: "#f6f8fa",
                    p: 2,
                    borderRadius: 2,
                    maxHeight: 210,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.93rem",
                }}
            >


            </Box> */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      ID: {snippet.id} (Data Source: {snippet.dataSource})
                    </Typography>
        </CardContent>
    </Card>
);