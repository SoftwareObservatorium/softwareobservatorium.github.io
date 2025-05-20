---
sidebar_position: 3
---

# LSL - LASSO Scripting Language

Version: 0.3

## Overview of Core DSL Commands and Structures in LSL

The LSL domain-specific language involves these top-level and recurring commands/constructs:

| Command/Block | Purpose |
|---|---|
| `dataSource` | Defines the source of code/test artifacts |
| `study` | Declares a new workflow or experiment (pipeline), grouping a sequence actions (directed, acyclic graph) |
| `profile` | Declares a runtime environment, possibly with toolchains and dependencies (e.g., Docker image, Java version, etc.). May contain `scope` (measurement scope) and `environment` blocks |
| `action` | Declares a pipeline step performing a computation, generation, search, filter, etc.  Parameterized by `name`, optionally by `type`, and may contain config and execution blocks. |
| `dependsOn` | Declares dependencies between actions (order of execution; i.e., one action depends on the completion of another) |
| `include` | Specifies which stimulus (response) matrices (SRMs) to process in an action (`*` or by name) |
| `execute` | Block inside `action` for actual task logic (e.g., stimulus matrix creation), or to perform computations |
| `stimulusMatrix` | Defines an interface specification ([LQL notation](lql)) of a functional abstraction (abstract system under test), a set of candidate implementations, and associated tests |
| `test` | Declares a test for an interface/implementation. Contains rows describing invocation sequences. |
| `row` | Specifies a step in a test scenario (expected output, operation, object reference, input args) |
| `implementation` | Declares a particular implementation of an abstraction/interface. Defines concrete implementation candidates by id, class, and optionally artifact coordinates. |
| `testFromJUnit` | Allows supplying entire JUnit test code as a test case |
| `environment` | Defines Docker or execution environment details (e.g., image) under a `profile` |
| Other action attributes | e.g., `type`, `features`, `maxAdaptations`, `adapterStrategy`, `javaVersion`, and custom blocks |
| `prompt`/`query` (closures) | Supplies custom logic or a query/prompt model to an action. `query`	Block for dynamically generating a code search query, given a `stimulusMatrix`. `prompt`	Block for dynamically generating prompts (usually for LLM interactions). Receives `stimulusMatrix` context. |
| `loadBenchmark` | Loads external benchmarks to be used in workflow (e.g., code generation benchmarks like _HumanEval_ and _MBPP_) |

---

## LASSO Scripting Language (LSL) Specification

LASSO Scripting Language (LSL) is a Groovy-based domain-specific language for describing code search, generation, evaluation, and testing workflows via pipeline definitions. LSL pipelines operate on interfaces, implementations, and tests to allow static and dynamic mass-code analysis at a very large scale.

For a visual illustration of how LSL pipelines process stimulus response matrices and to gain a deeper understanding of this concept, please refer to our introductory documentation available [here](/web/pdfviewer?f=intro.pdf).

---

Table of Contents

1. Basic Structure Overview
2. Top-level Declarations
    - dataSource
    - study
3. Profiles and Environments
    - profile
    - Scope and Environment
4. Actions
    - action and Action Types
    - dependsOn, include
5. Stimulus Matrices
    - stimulusMatrix
    - implementation
    - test and row
    - testFromJUnit
6. Action Configuration Blocks
    - Features, Strategy, Prompts, Queries
7. Benchmarks
8. Full Example

---

### 1. Basic Structure Overview

An LSL script defines a pipeline consisting of multiple actions (steps). Each script begins with one or more global configuration commands, followed by a `study` block containing actions. Example:

```groovy
dataSource 'my_data_source'
study(name: 'MyWorkflow') {
// pipeline setup here
}
```

```groovy
dataSource 'sourceName'
study(name: 'StudyName') {
    profile('ProfileName') { ... }
    action(name: 'step1') { ... }
    action(name: 'step2', type: 'Arena') { ... }
}
```

Workflows are described as studies. Each study contains a sequence of actions that can define, generate, analyze, or execute (test) code artifacts using the platform's languages and data structures -

* _Stimulus Matrices (SMs)_ for configurations of tests and code implementation candidates, and corresponding _Stimulus Response Matrices (SRMs)_ that store the runtime observations (and other measurements), and,
* _Sequence Sheet Notation (SSN)_: _Stimulus Sheets_ for creating test specifications, and _Actuation Sheets_ for storing test results (i.e., runtime observations)

---

### 2. Top-level Declarations

`dataSource <name> `

Declare the artifact/code repository or dataset to use.

```groovy
dataSource "mavenCentral2023"        // Maven Central snapshot from 2023
dataSource 'lasso_quickstart'        // default quickstart dataset
```

- Must precede the study block.
- May appear multiple times with different studies.

`study(<options>)`

Defines a workflow or pipeline consisting of actions, profiles, and test scenarios. The inner block declares actions, profiles, and pipeline dependencies. The `name` identifies the study/pipeline.

```groovy
study(name: 'StudyLabel') {
// profiles, actions, variable definitions, etc.
}
```

`Global Configuration`

Groovy defs and assignments: You may assign global variables (e.g. `def servers = [...]`) to use later in the script.


```groovy
def servers = ["myMachine"] // definition
study(name: "StudyLabel") {
    action(name:'doSomething') {
        myConf = servers // use
    }
}
```

---

### 3. Profiles and Environments

`profile(<name>)`

Defines an execution or analysis profile or toolchain, e.g., the Java version and Docker image used for runtime or build actions.

```groovy
profile('java17Profile') {
    scope('class') {
        type = 'class'
    }                  // optional scope block to define measurement scope
    environment('java17') {
        image = 'maven:3.9-eclipse-temurin-17'         // Docker image
    }
}
```

- Multiple profiles can be defined and later referenced in actions via `profile('profileName')`.

`scope(<name>)`

Configures the scope at which the profile (or measurement) is applied. Defines the artifact scope (class/file/package etc.), and additional types if needed.

`environment(<name>)`

Configures runtime context (typically docker/image for Java analysis and builds). Usually a Docker image for reproducibility (note that LASSO is a distributed system, so to ensure a distributed controlled environment, a specific environment has to be defined).

---

### 4. Actions

`action` and Action Types

An action represents a step or task in the LSL pipeline. They can create SMs, execute code, generate code/tests, perform search/filtering, integrate external tools etc.

```groovy
action(name: <string> [, type: <actionType>]) {
    // dependencies
    dependsOn <actionName>
    include '*' // Stimulus Matrices (by name) to process
    profile(<profileName>)
    // pipeline- and action-specific configuration
    <key> = <value>
    ...
    // Execution block
    execute { ... }
    // or dynamic blocks (depends on action type)
    prompt { sm -> ... } // Groovy closure that provides context to SM
    query { sm -> ... } // Groovy closure that provides context to SM
}
```


```groovy
action(name: 'create') { ... }

action(name: 'filter', type: 'Arena') { ... }  // type can be Arena, Search, EvoSuite, etc.
```

- `type` (optional): selects a specific action that is offered by the platform (e.g., toolchain integration). If no type is provided, it can only provide the computations defined in its `execute` block.
- Actions can have special configuration attributes used by that type.

Action Configuration Overview

Common attributes:
- `dependsOn "actionName"` — declare that this action executes after another action.
- `include "StimulusMatrixName"` — select which matrix/abstraction(s) to process (`*` = all).

Optional action configuration fields, e.g. (depends on action type):
- `features`, `maxAdaptations`, `adapterStrategy`, `javaVersion`, and more (type-specific).

`execute`

Used within an action to mark code that performs workflow operations, mainly side effects (e.g., generating or processing a matrix).


#### Types

##### Without Java Action class counterpart

```groovy
action(name: "ActionName") {
    //...
}
```

##### With Java Action class counterpart

```groovy
action(name: "ActionName", type: "ActionType") {
    //...
}
```

General structure of a Java Action class

```java
@LassoAction(desc = "An action with no behaviour")
public class NoOp extends DefaultAction {

    @LassoInput(desc = "a configuration parameter", optional = true)
    public String paramExample;

    @Override
    public void execute(LSLExecutionContext ctx, ActionConfiguration conf) throws IOException {
        // abstraction container (SM)
        Abstraction abstraction = conf.getAbstraction();
    }
}
```

Note that even pure LSL actions have a Java Action class counterpart (i.e., __type: 'NoOp'__)

##### Lifecycle

```groovy
action(name: "ActionName", type: "ActionType") {
    configure {
        // (1) configure block is called to configure the Java Action class counterpart
        // Note: typically only needed for LSL actions with an LSL Action class counterpart
    }
    
    execute {
        // (2) execute LSL commands BEFORE the Java Action class is executed
        // Note: typically only needed for LSL actions without an LSL Action class counterpart
    }

    analyze() {
        // (3) analyze results directly after execution of the Java Action class
    }
}
```

---

### 5. Stimulus Matrices

`stimulusMatrix`

Defines an interface (abstraction), its possible real-world implementations, and corresponding tests. Usually appears in the `execute` block of an action.

```groovy
stimulusMatrix('Name', """TypeName {
method1(Type1)->ReturnType
method2()->ReturnType
}""",
    [
        implementation("1", "qualified.impl.ClassName", "artifact:group:version"),
        implementation("2", "other.impl.ClassName"),
    ], [
        test(name: 'test1()') {
        row '', 'create', 'TypeName', 'param1'
        row '', 'method1', 'A1', 'value1'
    },
    // more tests...
    ]
)
```

Defines an abstraction of the interface to implement/test, the candidate implementations, and test cases.

```groovy
stimulusMatrix(<matrixName>, <LQL-Spec>, <implementations list>, <tests list>)
```

- `<matrixName>`: Unique label.
- `<LQL-Spec>`: Multiline string, e.g.,
    ```
    Stack {
        push(java.lang.Object)->java.lang.Object
        ...
    }
    ```
- `<implementations list>`: Optional, list of `implementation(...)` objects.
- `<tests list>`: List of `test(...)` blocks.


Fields:
- Name: a unique identifier for this matrix (abstraction).
- Interface Spec: String in [LQL notation](lql) (like Java) describing available methods.
- Implementations: array of one or more `implementation` entries.
- Tests: array of `test` (Stimulus Sheets) or `testFromJUnit` elements (JUnit Test Class Source).
- (Optional): `<dependencies>` in terms of artifact coordinates (e.g., for benchmarks).

`implementation`

Declares a possible implementation for an abstraction/interface.

```groovy
implementation(<id>, <className> [, <maven-coordinates>])
```

Example:

```groovy
implementation("id", "qualified.ClassName"[, "groupId:artifactId:version"])
```

- The third (optional) argument is the Maven artifact to fetch the implementation from.

Note that code implementations are typically retrieved from the code corpus (e.g., a `dataSource` or generated using LLMs etc.).


`test` and `row`

Tests are defined in a table-row style, each row describing one operation invocation (optionally: expected output in the first column).

`test` defines a test case with name and optional parameters, plus a block (`row`) with invocation steps.

```groovy
test(name: 'testExample', ...) {
row <expected>, <operation>, <object reference>, <input args...>
row ...
}
```

```groovy
test(name: 'testLabel') {
row '', 'create', 'ClassName', 10 // special virtual operation name to create an instance (i.e., object)
row '', 'methodToInvoke', 'A1', '"Input"'
// ...
}
```

- Each row defines an operation (method) invocation: (expected output, operation name, target object reference, input parameter argument(s))
- Interpretations of each parameter are implementation-specific and may be blank.


Parameterized Tests

```groovy
test(name: 'testMethod(p1=Type1, p2=Type2)', p1: value1, p2: value2) { ... }
```

- Test parameters (named) can be referenced in rows with `?param`.

`testFromJUnit`

Accepts full JUnit Java test code.

```groovy
testFromJUnit("""package mypackage;
import org.junit.jupiter.api.Test;

public class MyTest {
@Test
void testSomething() { ... }
}
""")
```

---

### 6. Advanced Action Blocks

#### Execute Block

`execute { ... }`
   Direct procedural block (often used for stimulus matrix creation or imperative steps).

#### Arena Action

Features

- `features = ['cc', 'mutation']` — enable code coverage, mutation analysis, etc.

Strategy

- `adapterStrategy = 'StrategyClass'` — use a specific adaptation or search strategy (either `'PassThroughAdaptationStrategy'` for no adaptation or `'DefaultAdaptationStrategy'` for advanced adaptation).

Control

- `maxAdaptations = N` — set how many adaptation candidates to evaluate.
- `samples = N` — how many generations (for AI generation actions).

#### Prompt and Query

Some actions provide extension points for custom prompt or query blocks.

```groovy
prompt { stimulusMatrix ->
    def prompt = [:]
    prompt.promptContent = """prompt string or template"""
    return [prompt]
}
```

Used in generator actions to create prompts dynamically for language models, typically based on the current interface or context.

Or, for search:

```groovy
query { stimulusMatrix ->
    def query = [:]
    query.queryContent = stimulusMatrix.lql
    query.rows = 100
    return [query]
}
```

Used in search actions to construct search queries dynamically.

Blocks receive the relevant context as arguments.


#### Action Configuration

Action blocks may contain arbitrary parameter assignments for action-specific configuration, e.g.:

```groovy
apiKey = 'demo'
model = 'gpt-4o-mini'
samples = 3
servers = [ ... ]
```

---

### 7. Benchmarks

Loading Benchmarks

Some studies may load pre-defined benchmark suites such as `HumanEval` or `MBPP`.

```groovy
def bench = loadBenchmark("benchmark-name")
```

Use benchmark-provided abstractions and tests in a stimulus matrix (e.g., `problem.lql`, `problem.tests`, etc.).

---

### 8. Full Example

```groovy
dataSource 'lasso_quickstart'
study(name: 'HelloWorld') {

    profile('java17Profile') {
        scope('class') { type = 'class' }
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    action(name: 'create') {
        execute {
            stimulusMatrix('Stack', """Stack {
                push(java.lang.Object)->java.lang.Object
                pop()->java.lang.Object
                peek()->java.lang.Object
                size()->int
                }""",
                [
                    implementation("1", "java.util.Stack")
                ],
                [
                    test(name: 'testPush()') {
                        row '', 'create', 'Stack'
                        row '', 'push', 'A1', '"Hello World!"'
                        row '', 'size', 'A1'
                    }
                ])
        }
    }

    action(name: 'execute', type: 'Arena') {
        dependsOn 'create'
        include 'Stack'
        profile('java17Profile')
    }
}
```

### Service-specific Commands

#### Adding Implementations

Known (Maven) Artifacts

```groovy
// command
implementation("ID", "CLASSNAME", "MAVENCOORDINATES")

// example
implementation("1", "org.apache.commons.codec.binary.Base64", "commons-codec:commons-codec:1.15")
```

JDK Classes

```groovy
// command
implementation("ID", "CLASSNAME")

// example
implementation("3", "java.util.LinkedList")
```

Implementations can also be combined.

#### Interface-Driven Code Search (LQL)

```groovy
/* query implementation candidates using interface-driven code search via LQL */
action(name: 'select', type: 'Search') {
    // ...
    
    query { stimulusMatrix ->
        def query = [:] // create query model
        query.queryContent = stimulusMatrix.lql
        query.rows = 10
        query.dataSource = "XXX" // optional: may override global data source
        query.filters = [/*query filters*/]
        return [query] // list of queries is expected
    }
}
```

See also: [LQL notation](lql)

#### Code Generation

```groovy
action(name: 'generateCodeLlama', type: 'GenerateCodeOllama') {
    // ...

    // custom DSL command offered by the action (for each stimulus matrix, create prompts to obtain implementations)
    prompt { stimulusMatrix ->
        // can by for any prompts: FA, impls, models etc.
        def prompt = [:] // create prompt model
        prompt.promptContent = """implement a java class with the following interface specification, but do not inherit a java interface: ```${stimulusMatrix.lql}```. Only output the java class and nothing else."""
        prompt.id = "lql_prompt"
        return [prompt] // list of prompts is expected
    }
}
```

Generate for each implementation

```groovy
prompt { stimulusMatrix ->
    List prompts = stimulusMatrix.implementations.collect { impl ->
        def prompt = [:] // create prompt model
        prompt.promptContent = """generate a diverse variant of the following code unit: ```${impl.code.content}```. Only output the variant class and nothing else."""
        prompt.id = "lql_prompt"
        prompt.model = "llama3.1:latest"
        return prompt
    }

    return prompts
}
```

#### Adding Tests

Manual Tests in LSL

```groovy
test(name: 'testPush()') {
    row '',  'create', 'Stack'
    row '',  'push',   'A1',     '"Hi"'
    row '',  'size',   'A1'
}

test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Hello World!") {
    row '',  'create', 'Stack'
    row '',  'push',   'A1',     '?p1'
    row '',  'size',   'A1'
}

test(name: 'testPushParameterized(p1=java.lang.String)', p1: "Bla blub!") // e.g., parameterized
```

#### Existing Tests from Benchmarks

HumanEval, mbpp from MultiPL-E.

```groovy
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
```

#### Generate Tests with LLMs

```groovy
action(name: 'generateTestsLlama', type: 'GenerateTestsOllama') {
    // pipeline specific
    dependsOn 'random'
    include '*'
    profile('java17Profile')

    // action configuration block 
    ollamaBaseUrl = "http://bagdana.informatik.uni-mannheim.de:11434"
    model = "llama3.1:latest" // LLM
    samples = 10 // how many to sample
    
    prompt { stimulusMatrix ->
        def prompt = [:] // create prompt model
        prompt.promptContent = """generate a junit test class to test the functionality of the following interface specification: ```${stimulusMatrix.lql}```. Assume that the specification is encapsulated in a class that uses the same naming as in the interface specification. Only output the JUnit test class and nothing else."""
        prompt.id = "lql_prompt"
        return [prompt] // list of prompts is expected
    }  
}
```

#### Test Generation with EvoSuite

````groovy
action(name: 'evoSuite', type: 'EvoSuite') {
    searchBudget = 30 // we need this as upper bound for timeouts
    stoppingCondition = "MaxTime"
    //criterion = "LINE:BRANCH:EXCEPTION:WEAKMUTATION:OUTPUT:METHOD:METHODNOEXCEPTION:CBRANCH"

    dependsOn 'generateTestsLlama'
    include '*'
    profile('java11Profile')
}
````

Note: EvoSuite does not work with Java > 11.

#### Random Test Generation

```groovy
action(name: 'random', type: 'RandomTestGen') { // add more tests
    noOfTests = 5 // create 5 additional random tests
    shuffleSequence = false

    dependsOn 'typeAware'
    include '*'
}
```

#### Type-Aware Test Mutation

```groovy
action(name: 'typeAware', type: 'TypeAwareMutatorTestGen') { // add more tests
    noOfTests = 1 // create one mutation per existing test

    dependsOn 'generateCodeDeepSeek'
    include '*'
}
```

#### Mutation Testing

Pitest is used for mutation testing internally.

```groovy
    features = ["mutation"]
```

#### Code Coverage

JaCoCo is used for code coverage measurements internally.

```groovy
    features = ["mutation"]
```

#### Code Clone Detection

```groovy
action(name: 'filter', type: 'Nicad6') {
    collapseClones = true // drop clones

    dependsOn 'generateCodeLlama'
    include '*'
    profile('nicad:6.2.1')
}
```

#### Arena Test Driver

##### Arena: Stimulus Matrices are Partitioned by Implementations

A stimulus matrix can be further partitioned into multiple sub-stimulus matrices by partitioning into blocks of implementations. This assumes that all tests are available in distributed mode.

```groovy
action(name: 'filter', type: 'ArenaPartitioning') { // run all collected stimulus sheets in arena
    maxAdaptations = 1 // how many adaptations to try
    //features = ["cc", "mutation"]

    dependsOn 'evoSuite'
    include '*'
    profile('java17Profile')
}
```

##### Arena: Stimulus Matrices are NOT partitioned by Implementations.

Strategy: full stimulus matrix is processed by one machine.

```groovy
action(name: 'filter', type: 'Arena') { // run all collected stimulus sheets in arena
    maxAdaptations = 1 // how many adaptations to try
    //features = ["cc", "mutation"]

    dependsOn 'evoSuite'
    include '*'
    profile('java17Profile')
}
```

### Unstable Commands

`includeImplementations` and `includeTests`

Advanced filtering of SMs.

```groovy
action(name: "ActionName", type: "ActionType") {
    dependsOn 'actionName' // action filter: specify on which other actions this action depends
    include '*' // stimulus matrix filter: specify which stimulus matrices to filter (by name of the stimulus matrix; i.e., abstraction name)

    includeTests '*'
    includeImplementations {name -> // closure 
        stimulusMatrices[name].implementations?.findAll { impl -> impl.id == 'XXX'} // return filtered list
    }
}
```

#### Resuming Studies at some point / Referencing other Studies

```groovy
action(name: "ActionName") {
    dependsOn 'executionId:actionName' // URI: LSL script execution id ":" action name
    include '*' // specify which stimulus matrices to filter
    
    // ...
}
```



---

### Appendix: Common Parameters & Patterns

- `include '*'` — process all artifacts/abstractions in context.
- `dependsOn 'previousAction'` — ensure ordering and data flow.
- `${stimulusMatrix.lql}` — interpolation for prompts/queries (interface spec as string; see Groovy String templating).
- Variable/parameter references in tests: `?paramName`.

Below is a formal EBNF (Extended Backus-Naur Form) grammar for the LASSO Scripting Language (LSL), based on the constructs extracted from your examples. This grammar describes the high-level structure and main elements only; some Groovy/DSL expression flexibility is not strictly captured, as LSL is an embedded DSL, but this grammar covers all primary declarations, actions, and blocks as seen in your scripts.

---

### (Partial) Formal Grammar (EBNF) for LSL

```ebnf
LSL         = { DataSourceDecl }, { TopLevelVarDecl }, StudyDecl, { StudyDecl } ;

DataSourceDecl = "dataSource" StringLiteral ;

TopLevelVarDecl = "def" Identifier "=" Expression ;

StudyDecl   = "study" "(" "name" ":" StringLiteral ")" "{" { StudyBlock } "}" ;

StudyBlock  = ProfileDecl
| ActionDecl
| TopLevelVarDecl
| Comment ;

ProfileDecl = "profile" "(" StringLiteral ")" "{" { ProfileBlock } "}" ;

ProfileBlock = ( ScopeDecl | EnvironmentDecl ) ;

ScopeDecl     = "scope" "(" StringLiteral ")" "{" "type" "=" StringLiteral "}" ;

EnvironmentDecl = "environment" "(" StringLiteral ")" "{" "image" "=" StringLiteral "}" ;

ActionDecl  = "action" "(" "name" ":" StringLiteral [ "," "type" ":" StringLiteral ] ")" "{"
{ ActionConfig }
[ ExecuteBlock ]
"}" ;

ActionConfig = [ "dependsOn" StringLiteral ]
| [ "include" StringLiteral ]
| [ "features" "=" ListLiteral ]
| [ "maxAdaptations" "=" IntegerLiteral ]
| [ "adapterStrategy" "=" StringLiteral ]
| [ "profile" "(" StringLiteral ")" ]
| [ "javaVersion" "=" StringLiteral ]
| [ CustomBlock ]
| [ CustomAssign ]
;

ExecuteBlock = "execute" "{" { StimulusMatrixDecl | Expression } "}" ;

StimulusMatrixDecl = "stimulusMatrix" "("
StringLiteral ","  // Matrix Name
StringLiteral ","  // LQL Spec
ImplList ","       // Implementations
TestList           // Tests
["," DependencyList ] // (optional) dependencies
")" ;

ImplList     = "[" { Implementation } { "," Implementation } "]" ;
Implementation = "implementation" "(" StringLiteral "," StringLiteral [ "," StringLiteral ] ")" ;

TestList     = "[" { TestDecl | TestFromJUnit } { "," (TestDecl | TestFromJUnit) } "]" ;

TestDecl     = "test" "(" "name" ":" StringLiteral { "," ParamAssign } ")" "{" { RowDecl } "}" ;
ParamAssign  = Identifier ":" Expression ;

RowDecl      = "row" RowArgList ;
RowArgList   = [ Expression { "," Expression } ] ;

TestFromJUnit = "testFromJUnit" "(" StringLiteral ")" ;

ListLiteral  = "[" [ Expression { "," Expression } ] "]" ;

CustomBlock  = ( "prompt" | "query" ) Block ;
CustomAssign = Identifier "=" Expression ;

DependencyList = Identifier ;

Expression   = /* Any valid Groovy/DSL expression or code block */ ;
Block        = "{" { Expression | Statement } "}" ;
Statement    = /* Any valid Groovy/DSL statement */ ;

IntegerLiteral = digit { digit } ;
StringLiteral  = "'" /* chars */ "'" | '"' /* chars */ '"' ;
Identifier     = letter { letter | digit | "_" } ;

/* Comments can be single-line '//' or multi-line '/* ... * /' */
Comment        = "/*" { ANY_CHAR } "*/"
| "//" { ANY_CHAR } ;

/* Core lexical rules */
digit      = '0'..'9' ;
letter     = 'A'..'Z' | 'a'..'z' ;
```


---

Explanation and Coverage

- dataSource as a top-level declaration.
- study block containing profiles, actions, variables.
- profile block (scope, environment).
- action blocks, with possible config and an optional `execute` block (or other lifecycle blocks).
- stimulusMatrix: name, interface (LQL), implementation list, test list, optional dependencies.
- implementation, test, testFromJUnit, row.
- prompt/query custom function blocks inside actions for advanced configuration.
- Groovy expressions are loosely captured since LSL is a DSL within Groovy.
- Lists and parameters as needed (for features, etc.).

---

Notes

- LSL is fundamentally a Groovy-DSL, so any valid Groovy code or block can usually appear as an `Expression`. The grammar above formalizes all strictly LSL-specific elements and typical extension points.
- Advanced configurations (e.g., parameterization in `test`) are supported as key-value assignments.
- Optional or complex code logic in custom blocks (like `prompt { ... }`) can contain arbitrary valid Groovy statements and are treated as open blocks (`Block`).
- Comments and variable assignments are accepted at the top level and inside studies/actions.

---

See Also

- [TDSEHub](/web/hub)
- Generate LSL pipelines for [Code Search](/web/lasso/ssn?recommendation=search)
- Generate LSL pipelines for [Code Generation](/web/lasso/ssn?recommendation=gen)
- [LSLFlow](https://softwareobservatorium.github.io/lslflow/) for visual construction of pipelines

---

This document should serve as a solid introductory and reference guide for end-users looking to read or write LSL pipelines.