// SequenceSheetEditorsPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Button, Stack, Typography, TextField, Box, Link } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SequenceSheetEditor, SequenceSheetData, gridToJSONL, jsonlToRows } from '@site/src/components/SSN/SequenceSheetEditor';
import { sequenceSheetsToGroovyDSL } from "@site/src/components/SSN/ssnutilities";
import { Editor } from "@monaco-editor/react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import { LslRequest, LslResponse } from "@site/src/services/models";
import AuthService from "@site/src/services/AuthService";
import LassoService from "@site/src/services/LassoService";
import { useHistory, useLocation } from "@docusaurus/router";
import { TDSExamples } from "@site/src/components/HubFeatures/HubFeatures";

const SEQ_SHEET_DEFAULT: SequenceSheetData = {
    name: "",
    signature: "()",
    columns: ["A", "B", "C", "D"],
    rows: [],
    invocations: []
};

const TDS_LSL_TEMPLATE = `dataSource 'mavenCentral2023'
study(name: 'TDSGenerated') {

    profile('java17Profile') {
    scope('class') { type = 'class' }
    environment('java17') {
        image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
    }
    }
      
    action(name: 'createStimulusMatrix') {
        execute {
            stimulusMatrix('myAb', """{{INTERFACE}}""", [/*impls*/], {{TESTS}})
        }
    }

    /* select class candidates using interface-driven code search */
    action(name: 'select', type: 'Search') {
        dependsOn 'createStimulusMatrix'
        include '*'

        query { stimulusMatrix ->
            def query = [:] // create query model
            query.queryContent = stimulusMatrix.lql
            query.rows = {{ROWS}}

            return [query] // list of queries is expected
        }
    }
    /* filter candidates by two tests (test-driven code filtering) */
    action(name: 'filter', type: 'Arena') { // filter by tests
        features = ['cc'] // enable code coverage measurement (class scope)
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'select'
        include '*'
        profile('java17Profile')
    }
}`

const GEN_LSL_TEMPLATE = `dataSource 'lasso_quickstart'
study(name: 'GenChatGPT') {

    // target profile
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    action(name: 'createStimulusMatrix') {
        execute {
            stimulusMatrix('myAb', """{{INTERFACE}}""", [/*impls*/], {{TESTS}})
        }
    }

    action(name: 'generateCodeGpt', type: 'GenerateCodeOpenAI') {
        // pipeline specific
        dependsOn 'createStimulusMatrix'
        include '*'
        profile('java17Profile')

        // action configuration block
        apiKey = "demo" // see https://docs.langchain4j.dev/integrations/language-models/open-ai/
        model = "gpt-4o-mini"
        samples = 1

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'generateTestsGpt', type: 'GenerateTestsOpenAI') {
        // pipeline specific
        dependsOn 'generateCodeGpt'
        include '*'
        profile('java17Profile')

        // action configuration block
        apiKey = "demo" // see https://docs.langchain4j.dev/integrations/language-models/open-ai/
        model = "gpt-4o-mini"
        samples = 1

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """generate a junit test class to test the functionality of the following interface specification: \`\`\`\${stimulusMatrix.lql}\`\`\`. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'generateTestsGpt'
        include '*'
        profile('java17Profile')
    }
}`

function fillTemplate(template: string, values: Record<string, string | number>) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
        values.hasOwnProperty(key) ? String(values[key]) : match
    );
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

    // Simulate LSL generation for demonstration purposes
    const handleGenerateLSL = () => {
        const jsonSheets = sheets.map(s => {
            const jsonl = gridToJSONL(s.rows, s.columns);

            return {
                name: s.name,
                signature: s.signature,
                jsonl: jsonl
            };
        })

        const groovyBlock = sequenceSheetsToGroovyDSL(jsonSheets)

        const lslTemplate = recommendationType === "search" ? TDS_LSL_TEMPLATE : GEN_LSL_TEMPLATE

        const result = fillTemplate(lslTemplate, {
            INTERFACE: interfaceSpec,
            TESTS: groovyBlock,
            ROWS: 10 // FIXME rows
        });

        const lsl = `// LSL generated\n${result}`

        editorRef.current.getModel().setValue(lsl)
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
                    label="Interface Specification (LQL)"
                    placeholder="Enter interface specification here..."
                    multiline
                    minRows={3}
                    maxRows={8}
                    variant="outlined"
                    fullWidth
                />

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



                {/* Bottom multiline TextField for generated LSL script */}
                {/* <TextField
                value={generatedLSL}
                label="Generated LSL Script"
                multiline
                minRows={7}
                maxRows={20}
                variant="outlined"
                fullWidth
                InputProps={{
                    readOnly: true,
                }}
                sx={{ mt: 2 }}
            /> */}
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