// examples
export class HubExamples {
    static MAP = {
        HELLO_WORLD_QUICKSTART: {
            label: "Hello World (JDK Collections)",
            description: "Explore the 'Hello World' quickstart example",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'HelloWorld') {

    /* create stimulus matrix */
    action(name: 'create') {
        execute {
            // from JDK classes
            stimulusMatrix('Stack', """Stack {
                    push(java.lang.String)->java.lang.String
                    size()->int }""",
                    [
                            implementation("1", "java.util.Stack"),
                            implementation("2", "java.util.ArrayDeque"),
                            implementation("3", "java.util.LinkedList")
                    ], [
                    test(name: 'testPush()') {
                        row '',    'create', 'Stack'
                        row '',  'push',   'A1',     '"Hello World!"'
                        row '',  'size',   'A1'
                    }])
        }
    }
    /* Execute stimulus matrix and obtain stimulus response matrix */
    action(name: 'filter', type: 'Arena') {
        dependsOn 'create'
        include 'Stack'
        profile('java17Profile') {
            scope('class') { type = 'class' }
            environment('java17') {
                image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
            }
        }
    }
}
            `,
            srmpath: "/web/srm/HELLO_WORLD_QUICKSTART.parquet",
            classifier: "quickstart, example"
        },
        BASE64_ENCODE_DECODE_MAVEN: {
            label: "Base64 Encode/Decode (Maven Artifacts)",
            description: "Explore how Maven artifacts can be used as part of stimulus matrices",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'Base64encodedecode') {

    action(name: 'create') {
        execute {
            // from known maven artifact (assuming maven repository is able to provide the artifact)
            stimulusMatrix('Base64', """Base64{
                    encode(byte[])->byte[]
                    decode(java.lang.String)->byte[]
                }
                """, [
                    implementation("1", "org.apache.commons.codec.binary.Base64", "commons-codec:commons-codec:1.15"),
            ], [ // tests
                 test(name: 'testEncode()') {
                     row '', 'create', 'Base64'
                     row '"dXNlcjpwYXNz".getBytes()', 'encode', 'A1', '"user:pass".getBytes()'
                 },
                 test(name: 'testEncode_padding()') {
                     row '', 'create', 'Base64'
                     row '"SGVsbG8gV29ybGQ=".getBytes()', 'encode', 'A1', '"Hello World".getBytes()'
                 }])
        }
    }

    action(name: 'test', type: 'Arena') {
        features = ['cc'] // enable code coverage measurement (class scope)
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'create'
        include 'Base64'
        profile('java17Profile') {
            scope('class') { type = 'class' }
            environment('java17') {
                image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
            }
        }
    }
}
            `,
            srmpath: "/web/srm/BASE64_ENCODE_DECODE_MAVEN.parquet",
            classifier: "example"
        },
        BOUNDED_QUEUE_MUTATION: {
            label: "Mutation Testing with LASSO",
            description: "Explore how Mutation Testing can be used. The example demonstrates mutation testing based on an implementation of a bounded queue",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'BoundedQueue-Mutation') {

    action(name: 'select') {
        execute {
            // from JDK classes
            stimulusMatrix('BoundedQueue', """MyBoundedQueue {
                    MyBoundedQueue(int)
                    enQueue(java.lang.Object)->void
                    deQueue()->java.lang.Object
                    isEmpty()->boolean
                    isFull()->boolean
                }
                """,
                    [
                            implementation("1", "demo_examples.BoundedQueue")
                    ], [
                    test(name: 'testEnqueue()') {
                        row '', 'create', 'MyBoundedQueue', '10'
                        row '', 'enQueue', 'A1', '"Hello World!"'
                        row '', 'isEmpty', 'A1'
                        row '', 'isFull', 'A1'
                        row '', 'deQueue', 'A1'
                        row '', 'isEmpty', 'A1'
                    }
            ])
        }
    }

    action(name: 'test', type: 'Arena') { // filter by tests
        adapterStrategy = 'PassThroughAdaptationStrategy'
        features = ["mutation"]

        dependsOn 'select'
        include 'BoundedQueue'
        profile('java17Profile') {
            scope('class') { type = 'class' }
            environment('java17') {
                image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
            }
        }
    }
}
            `,
            srmpath: "/web/srm/BOUNDED_QUEUE_MUTATION.parquet",
            classifier: "example"
        },
        OPENAI_GEN: {
            label: "Generate with OpenAI gpt4-o-mini",
            description: "Explore how OpenAI's GPT models can be used with LASSO to prompt for code solutions and tests. The functionality sought after is taken from the HumanEval benchmark (e.g., coding problem HumanEval_13_greatest_common_divisor)",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'ChatGPT') {

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")

    action(name: "createStimulusMatrices") {
        execute {
            // create stimulus matrices for given problems
            def myProblems = [humanEval.abstractions['HumanEval_13_greatest_common_divisor']]
            myProblems.each { problem ->
                stimulusMatrix(problem.id, problem.lql, [/*impls*/], problem.tests, problem.dependencies) // id, interface, impls, tests, dependencies
            }
        }
    }

    action(name: 'generateCodeGpt', type: 'GenerateCodeOpenAI') {
        // pipeline specific
        dependsOn 'createStimulusMatrices'
        include '*'
        profile('java17Profile') // evosuite 11

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
}
            `,
            srmpath: "/web/srm/OPENAI_GEN.parquet",
            classifier: "example"
        },
        OLLAMA_GEN: {
            label: "Generate with Ollama (llama3.1)",
            description: "Explore how Ollama and compatible models can be used with LASSO to prompt for code solutions and tests. The functionality sought after is taken from the HumanEval benchmark (e.g., coding problem HumanEval_13_greatest_common_divisor)",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'Ollama-Parallel') {

    // profile for execution
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")

    action(name: "createStimulusMatrices") {
        execute {
            // create stimulus matrices for given problems
            def myProblems = [humanEval.abstractions['HumanEval_13_greatest_common_divisor']]
            myProblems.each { problem ->
                stimulusMatrix(problem.id, problem.lql, [/*impls*/], problem.tests, problem.dependencies) // id, interface, impls, tests, dependencies
            }
        }
    }

    action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'createStimulusMatrices'
        include '*'
        profile('java17Profile')

        // action configuration block
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434", "http://dybbuk.informatik.uni-mannheim.de:11434"]
        model = "llama3.1:latest"
        samples = 5 // FIXME how many to sample
        promptRequestThreads = 4 // parallel threads

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'generateTestsLlama', type: 'GenerateTestsOllama') {
        // pipeline specific
        dependsOn 'generateCodeLlama'
        include '*'
        profile('java17Profile')

        // action configuration block
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434", "http://dybbuk.informatik.uni-mannheim.de:11434"]
        model = "llama3.1:latest"
        samples = 10
        promptRequestThreads = 4 // parallel threads

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """generate a junit test class to test the functionality of the following interface specification: \`\`\`\${stimulusMatrix.lql}\`\`\`. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') { // run all collected stimulus sheets on all impls in arena
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'generateTestsLlama'
        include '*'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/OLLAMA_GEN.parquet",
            classifier: "example"
        },
        TDS: {
            label: "Test-Driven Code Search",
            description: "Explore how LASSO can be used to offer test-driven code search using interface-driven code retrieval",
            lsl: `dataSource 'lasso_quickstart'
dataSource 'lasso_quickstart'
study(name: 'TDS-Base64encode') {

    action(name: 'createStimulusMatrix') {
        execute {
            stimulusMatrix('Base64', """Base64{
                    encode(byte[])->byte[]
                    decode(java.lang.String)->byte[]
                }
                """, [/*impls*/], [ // tests
                                    test(name: 'testEncode()') {
                                        row '', 'create', 'Base64'
                                        row '"dXNlcjpwYXNz".getBytes()', 'encode', 'A1', '"user:pass".getBytes()'
                                    },
                                    test(name: 'testEncode_padding()') {
                                        row '', 'create', 'Base64'
                                        row '"SGVsbG8gV29ybGQ=".getBytes()', 'encode', 'A1', '"Hello World".getBytes()'
                                    }])
        }
    }

    /* select class candidates using interface-driven code search */
    action(name: 'select', type: 'Search') {
        dependsOn 'createStimulusMatrix'
        include '*'

        query { stimulusMatrix ->
            def query = [:] // create query model
            query.queryContent = stimulusMatrix.lql
            query.rows = 1
            return [query] // list of queries is expected
        }
    }
    /* filter candidates by two tests (test-driven code filtering) */
    action(name: 'filter', type: 'Arena') { // filter by tests
        features = ['cc'] // enable code coverage measurement (class scope)
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'select'
        include 'Base64'
        profile('java17Profile') {
            scope('class') { type = 'class' }
            environment('java17') {
                image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
            }
        }
    }
}
            `,
            srmpath: "/web/srm/TDS.parquet",
            classifier: "example"
        }
    }
};