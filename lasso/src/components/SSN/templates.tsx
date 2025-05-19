const MavenCentral = `dataSource {{DATASOURCE}} // default dataSource
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
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'select'
        include '*'
        profile('java17Profile')
    }
}`

const MavenCentralRank = `dataSource {{DATASOURCE}} // default dataSource
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

    action(name:'rank', type:'Rank') { // rank based on two criteria
        strategy = 'HDS_SMOOP' // SOCORA ranking strategy
        criteria = ['IndexMeasurements.m_static_loc_td:MIN:1', 'cc.branch.total:MIN:2']
        
        dependsOn 'filter'
        includeAbstractions '*'
    }
}`

const ChatGPT = `dataSource 'lasso_quickstart'
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
        samples = {{SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try
        features = ['cc']

        dependsOn 'generateCodeGpt'
        include '*'
        profile('java17Profile')
    }
}`

const ChatGPTGenerateTests = `dataSource 'lasso_quickstart'
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
        samples = {{CODE_SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
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
        samples = {{TEST_SAMPLES}}

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{TEST_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try
        features = ['cc']

        dependsOn 'generateTestsGpt'
        include '*'
        profile('java17Profile')
    }
}`

const Ollama = `dataSource 'lasso_quickstart'
def ollamaServers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
study(name: 'GenOllama') {

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

    action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'createStimulusMatrix'
        include '*'
        profile('java17Profile')

        // action configuration block
        servers = ollamaServers
        model = {{MODEL}}
        samples = {{SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try
        features = ['cc']

        dependsOn 'generateCodeLlama'
        include '*'
        profile('java17Profile')
    }
}`

const OllamaGenerateTests = `dataSource 'lasso_quickstart'
def ollamaServers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
study(name: 'GenOllama') {

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

    action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'createStimulusMatrix'
        include '*'
        profile('java17Profile')

        // action configuration block
        servers = ollamaServers
        model = {{CODE_MODEL}}
        samples = {{CODE_SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
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
        servers = ollamaServers
        model = {{TEST_MODEL}}
        samples = {{TEST_SAMPLES}}

        prompt { stimulusMatrix ->
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{TEST_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try
        features = ['cc']

        dependsOn 'generateTestsLlama'
        include '*'
        profile('java17Profile')
    }
}`

const ChatGPTEvoSuite = `dataSource 'lasso_quickstart'
study(name: 'EvoSuiteGenChatGPT') {

    // target profile
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // profile for EvoSuite
    profile('java11Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.6.3-openjdk-11' // EvoSuite won't run in > JDK 11
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
        javaVersion = "11" // because of EvoSuite ..

        // action configuration block
        apiKey = "demo" // see https://docs.langchain4j.dev/integrations/language-models/open-ai/
        model = "gpt-4o-mini"
        samples = {{CODE_SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    // add tests: SBST
    action(name: 'evoSuite', type: 'EvoSuite') {
        searchBudget = {{EVOSUITE_BUDGET}} // we need this as upper bound for timeouts
        stoppingCondition = "MaxTime"

        dependsOn 'generateCodeGpt'
        include '*'
        profile('java11Profile')
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'evoSuite'
        include '*'
        profile('java17Profile')
    }
}
`

const OllamaEvoSuite = `dataSource 'lasso_quickstart'
def ollamaServers = ["http://bagdana.informatik.uni-mannheim.de:11434"]
study(name: 'EvoSuiteGenOllama') {

    // target profile
    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    // profile for EvoSuite
    profile('java11Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.6.3-openjdk-11' // EvoSuite won't run in > JDK 11
        }
    }

    action(name: 'createStimulusMatrix') {
        execute {
            stimulusMatrix('myAb', """{{INTERFACE}}""", [/*impls*/], {{TESTS}})
        }
    }

    action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
        // pipeline specific
        dependsOn 'createStimulusMatrix'
        include '*'
        profile('java17Profile')
        javaVersion = "11" // because of EvoSuite ..

        // action configuration block
        servers = ollamaServers
        model = {{CODE_MODEL}}
        samples = {{CODE_SAMPLES}}

        // custom DSL command offered by the action (for each stimulus matrix, create one prompt to obtain impls)
        prompt { stimulusMatrix ->
            // can by for any prompts: FA, impls, models etc.
            def prompt = [:] // create prompt model
            prompt.promptContent = """{{CODE_PROMPT}}"""
            prompt.id = "lql_prompt"
            return [prompt] // list of prompts is expected
        }
    }

    // add tests: SBST
    action(name: 'evoSuite', type: 'EvoSuite') {
        searchBudget = {{EVOSUITE_BUDGET}} // we need this as upper bound for timeouts
        stoppingCondition = "MaxTime"

        dependsOn 'generateCodeLlama'
        include '*'
        profile('java11Profile')
    }

    action(name: 'execute', type: 'Arena') {
        maxAdaptations = 1 // how many adaptations to try

        dependsOn 'evoSuite'
        include '*'
        profile('java17Profile')
    }
}
`

export const TDS_PLACEHOLDER_DEFAULTS: {
    [templateKey: string]: {
        [placeholder: string]: {
            label: string;
            default?: string;
            description?: string;
        }
    }
} = {
    MavenCentral: {
        DATASOURCE: {
            label: "LASSO Data Source",
            default: "\"mavenCentral2023\"",
            description: "The default Data Source used for Interface-driven Code Search"
        },
        ROWS: {
            label: "Number of Code Modules",
            default: "10",
            description: "The number of code modules to search via Interface-driven Code Search"
        },
    },
    MavenCentralRank: {
        DATASOURCE: {
            label: "LASSO Data Source",
            default: "\"mavenCentral2023\"",
            description: "The default Data Source used for Interface-driven Code Search"
        },
        ROWS: {
            label: "Number of Code Modules",
            default: "10",
            description: "The number of code modules to search via Interface-driven Code Search"
        },
    },
};

export const TGS_PLACEHOLDER_DEFAULTS: {
    [templateKey: string]: {
        [placeholder: string]: {
            label: string;
            default?: string;
            description?: string;
        }
    }
} = {
    ChatGPT: {
        SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        }
    },
    ChatGPTGenerateTests: {
        CODE_SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        TEST_SAMPLES: {
            label: "Number of Tests",
            default: "1",
            description: "The number of test (classes) to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        },
        TEST_PROMPT: {
            label: "Test Prompt",
            default: "generate a junit test class to test the functionality of the following interface specification: ```${stimulusMatrix.lql}```. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else.",
            description: "The prompt to use to generate tests"
        }
    },
    ChatGPTEvoSuite: {
        CODE_SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        },
        EVOSUITE_BUDGET: {
            label: "EvoSuite Time Budget",
            default: "120",
            description: "EvoSuite Time Budget in Seconds"
        }
    },
    Ollama: {
        MODEL: {
            label: "Model (LLM)",
            default: "\"gemma3:27b\"",
            description: "The Ollama model to use for generation"
        },
        SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        },
        TEST_PROMPT: {
            label: "Test Prompt",
            default: "generate a junit test class to test the functionality of the following interface specification: ```${stimulusMatrix.lql}```. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else.",
            description: "The prompt to use to generate tests"
        }
    },
    OllamaGenerateTests: {
        CODE_MODEL: {
            label: "Code Model (LLM)",
            default: "\"gemma3:27b\"",
            description: "The Ollama model to use for generation"
        },
        CODE_SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        TEST_MODEL: {
            label: "Test Model (LLM)",
            default: "\"gemma3:27b\"",
            description: "The Ollama model to use for generation"
        },
        TEST_SAMPLES: {
            label: "Number of Tests",
            default: "1",
            description: "The number of test (classes) to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        },
        TEST_PROMPT: {
            label: "Test Prompt",
            default: "generate a junit test class to test the functionality of the following interface specification: ```${stimulusMatrix.lql}```. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else.",
            description: "The prompt to use to generate tests"
        }
    },
    OllamaEvoSuite: {
        CODE_MODEL: {
            label: "Code Model (LLM)",
            default: "\"gemma3:27b\"",
            description: "The Ollama model to use for generation"
        },
        CODE_SAMPLES: {
            label: "Number of Code Modules",
            default: "1",
            description: "The number of code modules to generate"
        },
        CODE_PROMPT: {
            label: "Code Prompt",
            default: "implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else.",
            description: "The prompt to use to generate code"
        },
        EVOSUITE_BUDGET: {
            label: "EvoSuite Time Budget",
            default: "120",
            description: "EvoSuite Time Budget in Seconds"
        }
    }
};

export const TDSTemplates = {
    MavenCentral,
    MavenCentralRank
};

export const TDGTemplates = {
    ChatGPT,
    ChatGPTGenerateTests,
    ChatGPTEvoSuite,
    Ollama,
    OllamaGenerateTests,
    OllamaEvoSuite
};