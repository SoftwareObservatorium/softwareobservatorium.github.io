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

    action(name: 'createStimulusMatrices') {
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

    action(name: 'createStimulusMatrices') {
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
        STACK_PARAMETERIZED: {
            label: "Parameterized Sequence Sheets",
            description: "Explore how sequence sheets can be parameterized (here using an example of Stack implementations)",
            lsl: `dataSource 'lasso_quickstart'
// interface in LQL notation
def interfaceSpec = """Stack {
    push(java.lang.String)->java.lang.String
    size()->int
}
"""
study(name: 'Stack') {

    action(name: 'create') {
        stimulusMatrix('Stack', interfaceSpec, // abstraction details
                [ // implementations
                  implementation("1", "java.util.Stack"),
                  implementation("2", "java.util.ArrayDeque"),
                  implementation("3", "java.util.LinkedList")
                ],
                [ // tests
                  test(name: 'testPush()') {
                      row '', 'create', 'Stack'
                      row '', 'push', 'A1', '"Hi"'
                      row '', 'size', 'A1'
                  },
                  test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Hello World!") {
                      row '', 'create', 'Stack'
                      row '', 'push', 'A1', '?p1'
                      row '', 'size', 'A1'
                  },
                  test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Bla blub!") // e.g., parameterized
                ]
        )
    }

    action(name: 'test', type: 'Arena') { // run all tests
        maxAdaptations = 1 // how many adaptations to try

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
            srmpath: "/web/srm/STACK_PARAMETERIZED.parquet",
            classifier: "example"
        },
        STACK_TYPEAWARETEST: {
            label: "Type-aware Test Mutation",
            description: "Explore how existing sequence sheets can be mutated",
            lsl: `dataSource 'lasso_quickstart'
// interface in LQL notation
def interfaceSpec = """Stack {
    push(java.lang.String)->java.lang.String
    size()->int
}
"""
study(name: 'Stack') {

    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17' // docker image (JDK 17)
        }
    }

    action(name: 'select') {
        stimulusMatrix('Stack', interfaceSpec, // abstraction details
                [ // implementations
                  implementation("1", "java.util.Stack"),
                  implementation("2", "java.util.ArrayDeque"),
                  implementation("3", "java.util.LinkedList")
                ],
                [ // tests
                  test(name: 'testPush()') {
                      row '',  'create', 'Stack'
                      row '',  'push',   'A1',     '"Hi"'
                      row '',  'size',   'A1'
                  },
                  test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Hello World!") {
                      row '',  'create', 'Stack'
                      row '',  'push',   'A1',     '?p1'
                      row '',  'size',   'A1'
                  },
                  test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Bla blub!") // e.g., parameterized
                ]
        )
    }

    action(name: 'typeAware', type: 'TypeAwareMutatorTestGen') { // add more tests
        noOfTests = 1 // create one mutation per test

        dependsOn 'select'
        include 'Stack'
    }

    action(name: 'test', type: 'Arena') { // run all tests
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'typeAware'
        include 'Stack'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/STACK_TYPEAWARETEST.parquet",
            classifier: "example"
        },
        DGAI_LLM: {
            label: "Differential GAI with many Test Generators and LLMs (LLAMA and DeepSeek-R1)",
            description: "Explore how LASSO can be used to realized Differential GAI",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'DGAI') {

    // profile for execution
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // profile for execution
    profile('java11Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.6.3-openjdk-11' // EvoSuite won't run in > JDK 11
        }
    }

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")

    action(name: 'createStimulusMatrices') {
        execute {
            // create stimulus matrices for given problems
            def myProblems = [humanEval.abstractions['HumanEval_13_greatest_common_divisor']]
            myProblems.each { problem ->
                stimulusMatrix(problem.id, problem.lql, [/*impls*/], problem.tests) // id, interface, impls, tests
            }
        }
    }

    action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'createStimulusMatrices'
        include '*'
        profile('java11Profile') // evosuite 11

        // action configuration block
        ollamaBaseUrl = "http://bagdana.informatik.uni-mannheim.de:11434"
        model = "llama3.1:latest"
        samples = 10 // how many to sample
        javaVersion = "11" // because of EvoSuite ..

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'generateCodeDeepSeek', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'generateCodeLlama'
        include '*'
        profile('java11Profile') // evosuite 11

        // action configuration block
        ollamaBaseUrl = "http://bagdana.informatik.uni-mannheim.de:11434"
        model = "deepseek-r1:32b"
        samples = 10 // how many to sample
        javaVersion = "11" // because of EvoSuite ..

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    // add tests (mutates existing tests)
    action(name: 'typeAware', type: 'TypeAwareMutatorTestGen') { // add more tests
        noOfTests = 1 // create one mutation per test

        dependsOn 'generateCodeDeepSeek'
        include '*'
    }

    // add tests: randomly add new
    action(name: 'random', type: 'RandomTestGen') { // add more tests
        noOfTests = 5 // create 5 additional random tests
        shuffleSequence = false

        dependsOn 'typeAware'
        include '*'
    }

    action(name: 'generateTestsLlama', type: 'GenerateTestsOllama') {
        // pipeline specific
        dependsOn 'random'
        include '*'
        profile('java17Profile')

        // action configuration block
        ollamaBaseUrl = "http://bagdana.informatik.uni-mannheim.de:11434"
        model = "llama3.1:latest"
        samples = 10 // how many to sample

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """generate a junit test class to test the functionality of the following interface specification: \`\`\`\${stimulusMatrix.lql}\`\`\`. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'generateTestsDeepSeek', type: 'GenerateTestsOllama') {
        // pipeline specific
        dependsOn 'generateTestsLlama'
        include '*'
        profile('java17Profile')

        // action configuration block
        ollamaBaseUrl = "http://bagdana.informatik.uni-mannheim.de:11434"
        model = "deepseek-r1:32b"
        samples = 10 // how many to sample

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """generate a junit test class to test the functionality of the following interface specification: \`\`\`\${stimulusMatrix.lql}\`\`\`. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    // add tests: SBST
    action(name: 'evoSuite', type: 'EvoSuite') {
        searchBudget = 60 // we need this as upper bound for timeouts
        stoppingCondition = "MaxTime"
        //criterion = "LINE:BRANCH:EXCEPTION:WEAKMUTATION:OUTPUT:METHOD:METHODNOEXCEPTION:CBRANCH"
        cleanExecutables = false

        dependsOn 'generateTestsDeepSeek'
        include '*'
        profile('java11Profile')
    }

    action(name: 'execute', type: 'Arena') { // run all collected stimulus sheets in arena
        maxAdaptations = 1 // how many adaptations to try
        //features = ["cc", "mutation"]

        dependsOn 'evoSuite'
        include '*'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/DGAI.parquet",
            classifier: "dgai, example"
        },
        BENCHMARK_CODELLM: {
            label: "Replication of HumanEval-J/MBPP-J Benchmark",
            description: "Explore how LASSO can be used to replicate studies and reuse their designs, here based on the example of HumanEval-J (MultiPL-E)",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'HumanEval-OriginalPrompt-ShowCode') {

    // profile for execution
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")
    def mbpp = loadBenchmark("mbpp-java-reworded")

    action(name: 'createStimulusMatrices') {
        execute {
            // create stimulus matrices for given problems
            humanEval.abstractions.values().each { problem ->
                stimulusMatrix(problem.id, problem.lql, [/*impls*/], problem.tests, problem.dependencies) // id, interface, impls, tests, dependencies
            }

            mbpp.abstractions.values().each { problem ->
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
        samples = 10 // how many to sample
        javaVersion = "17" // because of EvoSuite ..

        promptRequestThreads = 4 // parallel threads

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            // get original prompt from benchmark
            prompt.promptContent = humanEval.abstractions[stimulusMatrix.name].prompt
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'measureCoverage', type: 'Arena') { // run all collected stimulus sheets in arena
        maxAdaptations = 1 // how many adaptations to try
        features = ["cc"]

        dependsOn 'generateCodeLlama'
        include '*'
        profile('java17Profile')
    }

    action(name: 'generateTestsLlama', type: 'GenerateTestsOllama') {
        // pipeline specific
        dependsOn 'measureCoverage'
        include '*'
        profile('java17Profile')

        // action configuration block 
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434", "http://dybbuk.informatik.uni-mannheim.de:11434"]
        model = "llama3.1:latest"
        samples = 1 // how many to sample
        promptRequestThreads = 4 // parallel threads

        prompt { stimulusMatrix ->
            List prompts = stimulusMatrix.implementations.collect { impl ->
                def prompt = [:] // create prompt model
                prompt.promptContent = """generate a junit test class to test the functionality of the following java class \`\${impl.code.name}\` : \`\`\`\${impl.code.content}\`\`\`. Initialize the class and call its methods. Only output the JUnit test class and nothing else."""
                prompt.id = "lql_prompt"
                return prompt
            }

            return prompts
        }
    }

    action(name: 'execute', type: 'Arena') { // run all collected stimulus sheets in arena
        maxAdaptations = 1 // how many adaptations to try
        features = ["cc"]

        dependsOn 'generateTestsLlama'
        include '*'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/HUMANEVAL.parquet",
            classifier: "benchmark, replication, humaneval, mbpp, example"
        },
        EVOSUITE_LLM: {
            label: "Diversity-driven Test Generation with EvoSuite and HumanEval-J",
            description: "Explore how EvoSuite automated unit test generation can be used in LASSO with HumanEval-J (MultiPL-E) to realize diversity-driven test generation",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'Evosuite-LLM') {

    // profile for execution
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // profile for execution
    profile('java11Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.6.3-openjdk-11' // EvoSuite won't run in > JDK 11
        }
    }

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")

    action(name: 'createStimulusMatrices') {
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
        profile('java11Profile') // evosuite 11

        // action configuration block
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
        model = "llama3.1:latest"
        samples = 3 // how many to sample
        javaVersion = "11" // because of EvoSuite ..

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'generateCodeDeepSeek', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'generateCodeLlama'
        include '*'
        profile('java11Profile') // evosuite 11

        // action configuration block
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
        model = "deepseek-r1:32b"
        samples = 3 // how many to sample
        javaVersion = "11" // because of EvoSuite ..

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    // add tests: SBST
    action(name: 'evoSuite', type: 'EvoSuite') {
        searchBudget = 30 // we need this as upper bound for timeouts
        stoppingCondition = "MaxTime"
        //criterion = "LINE:BRANCH:EXCEPTION:WEAKMUTATION:OUTPUT:METHOD:METHODNOEXCEPTION:CBRANCH"

        dependsOn 'generateCodeDeepSeek'
        include '*'
        profile('java11Profile')
    }

    action(name: 'test', type: 'Arena') { // run all collected stimulus sheets on all impls in arena
        maxAdaptations = 1 // how many adaptations to try
        //features = ["cc", "mutation"]

        dependsOn 'evoSuite'
        include '*'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/EVOSUITE_humaneval.parquet",
            classifier: "evosuite, benchmark, humaneval, example"
        },
        CODECLONE_NICAD: {
            label: "Code Clone Detection with Nicad6.2",
            description: "Explore how Nicad's code clone detection can be used in LASSO to filter SRMs",
            lsl: `dataSource 'lasso_quickstart'
study(name: 'CodeClone') {

    // profile for execution
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // load benchmark
    def humanEval = loadBenchmark("humaneval-java-reworded")

    action(name: 'createStimulusMatrices') {
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
        profile('java17Profile') // evosuite 11

        // action configuration block
        servers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
        model = "llama3.1:latest"
        samples = 5 // how many to sample

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: \`\`\`\${stimulusMatrix.lql}\`\`\`. Only output the java class and nothing else."""
            prompt.id = "lql_prompt"
            //prompt.model = "llama3.1:latest"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'codeClones', type: 'Nicad6') {
        collapseClones = true // drop clones from stimulus matrix

        dependsOn 'generateCodeLlama'
        include '*'
        profile('nicad:6.2')
    }

    action(name: 'test', type: 'Arena') { // run all collected stimulus sheets on all impls in arena
        maxAdaptations = 1 // how many adaptations to try
        //features = ["cc", "mutation"]

        dependsOn 'codeClones'
        include '*'
        profile('java17Profile')
    }
}
            `,
            srmpath: "/web/srm/CODECLONE_NICAD.parquet",
            classifier: "code clone, nicad, example"
        }
        // ,
        // EVOSUITE_BOUNDEDQUEUE: {
        //     label: "EvoSuite and Classes",
        //     description: "Explore how EvoSuite automated unit test generation can be used in LASSO with classes",
        //     lsl: `dataSource 'lasso_quickstart'

        //     `,
        //     srmpath: "/web/srm/EVOSUITE_boundedqueue.parquet",
        //     classifier: "evosuite, example"
        // }
    }
};