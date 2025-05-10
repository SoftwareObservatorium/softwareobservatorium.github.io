import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button, Stack, Typography, TextField, Box, Link, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SequenceSheetEditor, SequenceSheetData, gridToJSONL, jsonlToRows } from '@site/src/components/SSN/SequenceSheetEditor';
import { sequenceSheetsToGroovyDSL } from "@site/src/components/SSN/ssnutilities";
import { Editor } from "@monaco-editor/react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import { LslRequest, LslResponse } from "@site/src/services/models";
import AuthService from "@site/src/services/AuthService";
import LassoService from "@site/src/services/LassoService";
import { useHistory } from "@docusaurus/router";
import { TDSExamples } from "@site/src/components/HubFeatures/HubFeatures";
import { TDGTemplates, TDS_PLACEHOLDER_DEFAULTS, TDSTemplates, TGS_PLACEHOLDER_DEFAULTS } from "@site/src/components/SSN/templates";
//import LQLEditor from "@site/src/components/LQL/LQLEditor";

const SEQ_SHEET_DEFAULT: SequenceSheetData = {
    name: "",
    signature: "()",
    columns: ["A", "B", "C", "D"],
    rows: [],
    invocations: []
};

function fillTemplate(template: string, values: Record<string, string | number>) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
        values.hasOwnProperty(key) ? String(values[key]) : match
    );
}

// Utility: Extract {{PLACEHOLDER}} names from a template string
function extractPlaceholders(template: string): string[] {
    const matches = [...template.matchAll(/{{\s*(\w+)\s*}}/g)];
    // Remove duplicates and default provided e.g., INTERFACE, TESTS
    const ignore = ["INTERFACE", "TESTS"]; // fill these programmatically
    const names = Array.from(new Set(matches.map(m => m[1]))).filter(p => !ignore.includes(p));
    return names;
}

export default function SequenceSheetEditorsPage() {
    const history = useHistory()

    // Only run in browser context
    let exampleId = ""
    let recommendation = "search"
    if (typeof window != "undefined") {
        const searchParams = new URLSearchParams(window.location.search);

        exampleId = searchParams.get("example") ?? "";
        recommendation = searchParams.get("recommendation") ?? "search";

        console.log(exampleId)
        console.log(recommendation)
    }

    const [currentExampleId, setCurrentExampleId] = useState(exampleId)
    const [recommendationType, setRecommendationType] = useState(recommendation)

    const [sheets, setSheets] = useState<SequenceSheetData[]>([]);
    const [interfaceSpec, setInterfaceSpec] = useState<string>(``);

    const [generatedLSL, setGeneratedLSL] = useState<string>("");

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    // --- New state for template selection & user-provided placeholders
    const TEMPLATE_KEYS = Object.keys(recommendationType === "search" ? TDSTemplates : TDGTemplates);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(TEMPLATE_KEYS[0]);
    const [userPlaceholders, setUserPlaceholders] = useState<Record<string, string>>({});

    // --- handleGenerateLSL to use selected template and user placeholders:
    const handleGenerateLSL = () => {
        const jsonSheets = sheets.map(s => ({
            name: s.name,
            signature: s.signature,
            jsonl: gridToJSONL(s.rows, s.columns)
        }));
        const groovyBlock = sequenceSheetsToGroovyDSL(jsonSheets);
        // Use the currently selected template
        const lslTemplate = recommendationType === "search" ? TDSTemplates[selectedTemplateKey] : TDGTemplates[selectedTemplateKey];
        const metaPlaceholders = recommendationType === "search" ? TDS_PLACEHOLDER_DEFAULTS[selectedTemplateKey] : TGS_PLACEHOLDER_DEFAULTS[selectedTemplateKey] || {};
        const values: Record<string, string | number> = {
            INTERFACE: interfaceSpec,
            TESTS: groovyBlock,
        };
        for (const [k, val] of Object.entries(userPlaceholders)) {
            values[k] = val || metaPlaceholders[k]?.default || ""; // fallback on meta default
        }
        const result = fillTemplate(lslTemplate, values);
        const lsl = `// LSL generated\n${result}`
        editorRef.current.getModel().setValue(lsl);
        setGeneratedLSL(lsl);
    };

    const handleAddSheet = () => {
        setSheets((s) => [
            ...s,
            {
                ...SEQ_SHEET_DEFAULT,
                name: `SequenceSheet${s.length + 1}`,
                rows: [],
            },
        ]);
    };

    const handleSheetChange = (idx: number, data: SequenceSheetData) => {
        setSheets((prev) => prev.map((sheet, i) => (i === idx ? data : sheet)));
    };

    const handleRemoveSheet = (idx: number) => {
        setSheets((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        let lslRequest = new LslRequest()

        // get current value
        lslRequest.script = editorRef.current.getModel().getValue()
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        lslRequest.email = user.email;
        lslRequest.type = null //draft ? "DRAFT" : null;
        console.log(lslRequest);

        const responses = execute(lslRequest)
    };

    // --- Handlers for placeholder input values
    const handlePlaceholderChange = (name: string, value: string) => {
        setUserPlaceholders(prev => ({ ...prev, [name]: value }));
    };

    // --- Template selection handler
    const handleTemplateChange = (e: any) => {
        setSelectedTemplateKey(e.target.value as string);
    };

    const execute = async (lslRequest: LslRequest) => {
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

        await LassoService.execute(lslRequest).then(
            (response) => {
                let lslResponse: LslResponse = response.data
                console.log("Successfully executed. Execution ID is " + lslResponse.executionId)

                // redirect to result page
                history.push(`./result?executionId=${lslResponse.executionId}`)
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                // FIXME
                console.log("Execute attempt failed " + error)
            }
        )
    };

    function handleEditorDidMount(editor: any, monaco: any) {
        monaco.languages.register({ id: 'java' });

        monacoRef.current = monaco;
        editorRef.current = editor;

        editorRef.current.getModel().setValue("");
    }

    // --- Update on template change
    useEffect(() => {
        const template = recommendationType === "search" ? TDSTemplates[selectedTemplateKey] : TDGTemplates[selectedTemplateKey];
        const placeholders = extractPlaceholders(template);
        const meta = recommendationType === "search" ? TDS_PLACEHOLDER_DEFAULTS[selectedTemplateKey] : TGS_PLACEHOLDER_DEFAULTS[selectedTemplateKey] || {};
        setUserPlaceholders(
            placeholders.reduce((acc, p) => ({
                ...acc,
                [p]: (meta[p]?.default || "")
            }), {})
        );
    }, [selectedTemplateKey]);

    useEffect(() => {
        if (currentExampleId) {
            console.log("example " + currentExampleId)

            const example = TDSExamples.MAP[currentExampleId]
            setSheets(example.sheets.map(s => {
                const sheetResult: any = jsonlToRows(s.jsonl);

                console.log(sheetResult)

                const sheet: SequenceSheetData = {
                    name: s.name,
                    signature: s.signature,
                    rows: sheetResult.rows,
                    columns: sheetResult.cols,
                    invocations: s.invocations
                }
                return sheet
            }))
            setInterfaceSpec(example.lql)
        }
    }, []);

    return (
        <Layout>
            <Head>
                <title>Test-driven Code Recommendation</title>
                <meta name="description" content="Test-driven Code Recommendation" />
            </Head>

            {recommendationType === "search" ?
                <Typography sx={{ margin: 2 }} variant="h5" component="div">Test-driven Code Search<Typography variant="h6" component="div">Specify your Code Module (Code Index: Snapshot of Maven Central)</Typography></Typography>

                : <Typography sx={{ margin: 2 }} variant="h5" component="div">Test-driven Code Generation (using LLMs)<Typography variant="h6" component="div">Specify your Code Module (LSL Template uses ChatGPT and also generates additional Tests)</Typography></Typography>

            }

            <Stack sx={{ p: 4 }} spacing={3}>
                {/* <Typography variant="h4" sx={{ mb: 2 }}>
                    Manage Sequence Sheets
                </Typography> */}

                {/* Top multiline TextField for interface specs */}
                <TextField
                    value={interfaceSpec}
                    onChange={e => setInterfaceSpec(e.target.value)}
                    label="Interface Specification (LQL) - Focal Class/Methods"
                    placeholder="Enter interface specification here..."
                    multiline
                    minRows={3}
                    maxRows={8}
                    variant="outlined"
                    fullWidth
                />

{/* <LQLEditor editorHandler={(mon => console.log(mon))} lqlHandler={(lql => setInterfaceSpec(lql))} defaultLqlCode={interfaceSpec} /> */}

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

                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={handleAddSheet}
                    sx={{ mb: 2, width: 210 }}
                >
                    Add Sequence Sheet
                </Button>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Learn more about SSN <b>(Sequence Sheet Notation)</b>:
                    </Typography>
                    <Link
                        href="/web/docs/datastructures/ssn"
                        target="_blank"
                        rel="noopener"
                        underline="hover"
                    >
                        Documentation
                    </Link>
                </Stack>

                {sheets.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 4 }}>
                        No sequence sheets yet. Click 'Add Sequence Sheet'.
                    </Typography>
                )}


                {sheets.map((sheet, idx) => (
                    <SequenceSheetEditor
                        key={idx}
                        value={sheet}
                        onChange={val => handleSheetChange(idx, val)}
                        onRemove={() => handleRemoveSheet(idx)}
                    />
                ))}

                {/* --- NEW: Template selection section --- */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>LSL Template Selection</Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Select your LSL Template. You may need to specify additional placeholders.
                        </Typography>
                    </Stack>
                    <FormControl sx={{ minWidth: 320, maxWidth: 400, mb: 2 }}>
                        <InputLabel id="lsl-template-label">LSL Template</InputLabel>
                        <Select
                            labelId="lsl-template-label"
                            label="LSL Template"
                            value={selectedTemplateKey}
                            onChange={handleTemplateChange}
                        >
                            {TEMPLATE_KEYS.map(key =>
                                <MenuItem key={key} value={key}>
                                    {key}
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* --- Render inputs for placeholders (excluding programmatic ones) --- */}
                    {extractPlaceholders(recommendationType === "search" ? TDSTemplates[selectedTemplateKey] : TDGTemplates[selectedTemplateKey]).length > 0 &&
                        <Stack spacing={1} sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ mt: 2 }} fontWeight="bold">
                                Additional Template Placeholders
                            </Typography>


                            {extractPlaceholders(recommendationType === "search" ? TDSTemplates[selectedTemplateKey] : TDGTemplates[selectedTemplateKey]).map(ph => {
                                const meta = recommendationType === "search" ? TDS_PLACEHOLDER_DEFAULTS[selectedTemplateKey]?.[ph] : TGS_PLACEHOLDER_DEFAULTS[selectedTemplateKey]?.[ph];
                                return (
                                    <TextField
                                        key={ph}
                                        label={meta?.label || ph}
                                        value={userPlaceholders[ph] || ""}
                                        onChange={e => handlePlaceholderChange(ph, e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        sx={{ mt: 1 }}
                                        placeholder={meta?.default || ""}
                                        helperText={meta?.description || ""}
                                    />
                                );
                            })}
                        </Stack>}
                </Box>

                {/* Trigger LSL generation (optional, or tie to sheet/interfaceSpec change) */}
                <Box>
                    <Button
                        variant="outlined"
                        sx={{ mt: 2, mr: 2 }}
                        onClick={handleGenerateLSL}
                    >
                        Generate LSL Script
                    </Button>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Generate the LSL script and scroll down below to submit your script.
                        </Typography>
                    </Stack>
                </Box>
                <Editor
                    height="500px"
                    defaultLanguage="java"
                    defaultValue={generatedLSL}
                    onMount={handleEditorDidMount} />

                {/* Submit button */}
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2, minWidth: 150 }}
                        disabled={!generatedLSL}
                        onClick={handleSubmit}
                    >
                        Submit LSL Script
                    </Button>
                </Box>
            </Stack></Layout>
    );
}