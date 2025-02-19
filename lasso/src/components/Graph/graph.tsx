import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { Graph } from "react-d3-graph";

import { HubExamples } from '../HubFeatures/HubFeatures';

const GraphComponent = ({ exampleId }: any) => {
    const code = HubExamples.MAP[exampleId].lsl

    const actionRegex = /action\(name: '(.*?)'\)/g;
    const includeRegex = /include \'(.*?)'/g;
    const dependsOnRegex = /dependsOn \'(.*?)'/g;

    interface Action {
        name: string;
        include?: string;
        dependsOn?: string;
    }

    const extractActions = (code) => {
        const actions: Action[] = []
        let match;
        while ((match = actionRegex.exec(code)) !== null) {
            const actionName = match[1];
            console.log(`Action Name: ${actionName}`);
            const actionStartIndex = match.index + match[0].length;
            // Extract the content within the nearest curly braces starting from actionStartIndex
            const contentEndIndex = findMatchingBraceEnd(code, actionStartIndex);

            const content = code.slice(actionStartIndex, contentEndIndex);

            console.log(content)

            let includeMatch;
            let includeName = undefined
            while ((includeMatch = includeRegex.exec(content)) !== null) {
                console.log(`include Name: ${includeMatch[1]}`);

                includeName = includeMatch[1]
            }

            if (!includeName) {
                includeName = ""
            }

            let dependsMatch;
            let dependsName = undefined
            while ((dependsMatch = dependsOnRegex.exec(content)) !== null) {
                console.log(`dependsOn: ${dependsMatch[1]}`);

                dependsName = dependsMatch[1]
            }

            if (!dependsName) {
                dependsName = ""
            }

            let aName = actionName
            if (aName.indexOf(',') >= 0) {
                aName = aName.split('\',')[0];

                console.log(aName)
            }

            actions.push({ name: aName, include: includeName, dependsOn: dependsName })
        }

        return actions
    }

    const findMatchingBraceEnd = (text: string, startIndex: number): number => {
        let depth = 0;
        for (let i = startIndex; i < text.length; i++) {
            if (text[i] === '{') {
                depth++;
            } else if (text[i] === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        throw new Error('Unmatched braces');
    }

    const actions = extractActions(code)
    console.log(actions)

    const nodes = actions.map((a) => {
        return { id: a.name }
    })
    const edges = actions.filter((a) => a.dependsOn.length > 0 /* only  */).map((a) => {
        return { source: a.dependsOn, target: a.name, label: a.include }
    })

    console.log(nodes)
    console.log(edges)

    // graph payload (with minimalist structure)
    const data = {
        nodes: nodes,
        links: edges,
    };

    // the graph configuration, just override the ones you need
    const myConfig = {
        directed: true,
        nodeHighlightBehavior: true,
        d3: {
            gravity: -100
        },
        node: {
            color: "#25c2a0",
            size: 240,
            fontSize: 16,
            highlightStrokeColor: "blue",
            symbolType: "circle"
        },
        link: {
            highlightColor: "lightblue",
            renderLabel: true,
            fontSize: 12
        },
    };

    const onClickNode = function (nodeId) {
        window.alert(`Clicked node ${nodeId}`);
    };

    const onClickLink = function (source, target) {
        window.alert(`Clicked link between ${source} and ${target}`);
    };

    return (
        <Grid container spacing={2}>

            <Grid size={12}>
                <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
                    <Graph
                        id="graph-id" // id is mandatory
                        data={data}
                        config={myConfig}
                        onClickNode={onClickNode}
                        onClickLink={onClickLink}
                    />
                </Typography>
            </Grid></Grid>
    );
}

export default GraphComponent;
