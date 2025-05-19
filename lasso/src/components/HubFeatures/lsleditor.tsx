import React, { useState, useEffect, useRef } from "react";
import {
    Typography,
    Button,
    Box,
    Tab,
    CardContent,
    CardActions,
    Tabs,
} from "@mui/material";
import { ScriptInfo } from "@site/src/services/models";
import { Editor } from "@monaco-editor/react";
import GraphComponent from "../Graph/graph";

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

type LslViewerProps = {
    script: ScriptInfo;
};

export const LSLViewer: React.FC<LslViewerProps> = ({ script }) => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(script);

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    function handleEditorDidMount(editor: any, monaco: any) {
        monaco.languages.register({ id: 'java' });

        monacoRef.current = monaco;
        editorRef.current = editor;
    }

    return (
        <>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                        <Tab label="LSL Pipeline" {...a11yProps(0)} />
                        <Tab label="Graph Viewer" {...a11yProps(1)} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                    <><CardContent>
                        <Typography variant="h5" component="div">
                            <Editor
                                height="500px"
                                defaultLanguage="java"
                                defaultValue={scriptInfo.content}
                                onMount={handleEditorDidMount} />
                        </Typography>
                        <br/>
                        <Button variant="outlined" sx={{ float: "left" }} target="_blank" href={`/web/lasso/submit?executionId=${encodeURIComponent(script.executionId)}`}>Try Now!</Button>

                    </CardContent><CardActions>
                        </CardActions></>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <Typography variant="h5" component="div">
                        <GraphComponent code={scriptInfo.content} />
                    </Typography>
                </CustomTabPanel>
            </Box>
        </>
    );
};