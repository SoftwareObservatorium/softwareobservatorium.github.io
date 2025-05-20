---
sidebar_position: 3
---

# LASSO Scripting Language (LSL) — Beginner’s Guide & Specification

(Note: Find the full specification of LSL [here](../datastructures/lsl.md).)

The LASSO Scripting Language (LSL) lets you design code search, generation, testing, and evaluation pipelines in an easy and readable way. It is Groovy-based and made for workflows that involve functional abstractions (coding problems in terms of required interfaces), finding or generating implementations, and running tests.

---

Table of Contents

1. How Does an LSL Script Look? (Quick Example)
2. Main Building Blocks
    - a. dataSource
    - b. study
    - c. profile
    - d. action
    - e. stimulusMatrix, implementation, test, row
    - f. dependsOn / include
    - g. features and other options
    - h. Groovy code & variables
3. Putting It Together: Step-by-Step Example
4. Key Patterns, FAQs, Tips
5. Where to Find More

---

## 1. How Does an LSL Script Look? (Quick Example)

Let’s see a super-short LSL workflow:

```groovy
dataSource 'lasso_quickstart'        // Where to get classes, tests etc.

study(name: 'HelloWorld') {
    // Where/code will run
    profile('java17') {
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }
    // Make a new task: Create a "Stack" abstractiion and test code candidates
    action(name: 'create') {
        execute {
            stimulusMatrix('Stack', """
                Stack {
                    push(java.lang.String)->java.lang.String
                    size()->int
                }
                """,
                [
                    implementation("1", "java.util.Stack")   // Use JDK built-in Java Stack
                ], [
                    test(name: 'testPush()') {
                        row '', 'create', 'Stack'
                        row '', 'push', 'A1', '"Hello World!"'
                        row '', 'size', 'A1'
                    }
            ])
        }
}
    // Run/test the Stack via Arena Test Driver
    action(name: 'filter', type: 'Arena') {
        dependsOn 'create'
        include 'Stack'
        profile('java17')
    }
}
```


---

## 2. Main Building Blocks

a. `dataSource`

What: Where the platform should look for code, classes, or data.

Usage:

```groovy
dataSource 'lasso_quickstart'
dataSource "mavenCentral2023"
```

Tip: You can have different studies using different data sources.

---

b. `study`

What: Groups together a series of actions (your workflow).

Usage:

```groovy
study(name: 'MyAwesomeExperiment') {
// actions, profiles, variables...
}
```

---

c. `profile`

What: Defines how and where actions are run (Java version, Docker image, toolchains etc).

Usage:

```groovy
profile('java17') {
    environment('java17') {
        image = 'maven:3.9-eclipse-temurin-17'
    }
}
```

Tip: You can define several profiles (e.g., for Java 11 and Java 17) and switch between them.

---

d. `action`

What: A step in your pipeline; can create, search, filter, test, generate, etc.

Usage:

```groovy
action(name: 'create') {
    execute {
        // define abstraction (Stimulus Matrix), etc.
    }
}
action(name: 'filter', type: 'Arena') {
    dependsOn 'create'
    include '*'
    // config here
}
```

`type` defines what kind of action it is: 'Arena', 'Search', 'EvoSuite', etc.

---

e. `stimulusMatrix`, `implementation`, `test`, `row`

These are the heart of LSL for defining what you want to study and test!

`stimulusMatrix`

- Lets you define:
    1. The interface: (what methods/behavior you expect)
    2. Some sample implementations: (what code/classes to run)
    3. Tests: (how to check if it works)

Example:

```groovy
stimulusMatrix('Base64', """
    Base64 {
        encode(byte[])->byte[]
        decode(java.lang.String)->byte[]
    }
    """,
    [
        implementation("1", "org.apache.commons.codec.binary.Base64", "commons-codec:commons-codec:1.15")
    ], [
        test(name: 'testEncode()') {
            row '', 'create', 'Base64'
            row '"SGVsbG8gV29ybGQ=".getBytes()', 'encode', 'A1', '"Hello World".getBytes()'
        }
])
```

- First value: The matrix name (unique in this study)
- Second value: The interface (in [LQL format](../datastructures/lql.md))
- Third: List of implementations you want to try
- Fourth: List of tests to verify them

`implementation`

- Specifies a class to try, optionally pointing to a Maven dependency (by coordinate).

```groovy
implementation("1", "org.apache.commons.codec.binary.Base64", "commons-codec:commons-codec:1.15")
```

`test` and `row`

- A test (Stimulus Sheet) defines a scenario.
- Each row is an operation (method) invocation (e.g., expected output, operation, target object reference, input parameter args).

```groovy
test(name: 'testPush()') {
    // expected output, operation, target object reference, input parameters
    row '', 'create', 'Stack' // special virtual operation to create an instance
    row '', 'push', 'A1', '"Hello World!"'
    row '', 'size', 'A1'
}
```

- `'A1'` refers to the result of the first row (`create 'Stack'`).
- Parameters can be used for data-driven or parameterized tests:
  ```groovy
  test(name: 'testEncode(p1=byte[], p2=byte[])', p1:'"Hello".getBytes()', p2:'"SGVsbG8=".getBytes()')
    ```

`testFromJUnit`
You can also provide a full JUnit test case as a string!

```groovy
testFromJUnit("""
import org.junit.jupiter.api.Test;
public class MyTest { @Test void test() { /* ... */ } }
""")
```

---

f. `dependsOn` / `include`

- `dependsOn 'ActionName'` means this action runs after the named action and can use its outputs.
- `include 'ThingName'` or `include '*'` means apply this action to a certain abstraction (or to all).

Example:

```groovy
action(name: 'filter', type: 'Arena') {
    dependsOn 'create'
    include 'Stack'
}
```

---

g. `features` and Other Options

Some actions accept extra options, like:

```groovy
features = ['cc', 'mutation']  // code coverage, mutation analysis
maxAdaptations = 2             // try at most 2 adaptation strategies
adapterStrategy = 'PassThroughAdaptationStrategy'
```

Other blocks:
- `prompt { ... }` and `query { ... }` are for more advanced cases (e.g., generating prompts or search queries for AI code/gen or search tools).

---

h. Groovy Code & Variables

- You can use Groovy variables and code anywhere:
  ```groovy
  def ollamaServers = ["http://localhost:11434"]
  ...
  action(name: 'myGenAI', type: 'GenerateCodeOllama') {
    servers = ollamaServers
  }
  ```

- Useful to define lists, constants, or reference values elsewhere.

---

## 3. Putting It Together: Step-by-Step Example

Let’s design a simple workflow:  
"I want to check that a class implementing Stack in Java can push and pop elements."

```groovy
dataSource 'lasso_quickstart'
study(name: 'CheckStack') {
    profile('java17Profile') {
        environment('java17') {
            image = 'maven:3.9-eclipse-temurin-17'
        }
    }

    action(name: 'createStackMatrix') {
        execute {
            stimulusMatrix('Stack', """
                Stack {
                    push(java.lang.Object)->java.lang.Object
                    pop()->java.lang.Object
                    size()->int
                }
            """,
            [
                implementation("1", "java.util.Stack"),
                implementation("2", "java.util.ArrayDeque"),
                implementation("3", "java.util.LinkedList")
            ], [
                test(name: 'testPushPop()') {
                    row '', 'create', 'Stack'
                    row '', 'push', 'A1', '"BwGPT"'
                    row 'D2', 'pop', 'A1'
                    row '', 'size', 'A1'
                }
            ])
        }
    }

    action(name: 'test', type: 'Arena') {
        dependsOn 'createStackMatrix'
        include 'Stack'
        features = ['cc']          // enable code coverage
        profile('java17Profile')
    }
}
```

What happens here?
- We define a study using `lasso_quickstart` data.
- We provide a profile matching Java 17 as our execution environment.
- We create a Stack abstraction, list possible implementations, and give a simple test.
- We test the abstraction and measure code coverage.

---

## 4. Key Patterns, FAQs, Tips

- How do I add more test cases?  
  Add another `test(name: ...) { ... }` block inside the matrix’s test list.
- How do I switch to another Java version?  
  Add or change a `profile` and use a different image (e.g., for Java 11).
- Can I process multiple abstractions at once?  
  Use `include '*'` to apply actions to all abstractions in context.
- Want to do AI code generation?  
  Use actions with `type: 'GenerateCodeOllama'` (or `'GenerateCodeOpenAI'`), supply prompts in the block, and manage AI settings there.
- Want fully custom JUnit tests?  
  Use `testFromJUnit("...your full JUnit source...")` inside the matrix.
- Need search or code generation prompt customization?  
  Use a `prompt { ... }` or `query { ... }` closure inside the action for full control.

---

## 5. Where to Find More

- Explore more LSL pipelines and their results in [TDSEHub](../datastructures/lsl)
- Generate LSL pipelines for [Code Search](/web/lasso/ssn?recommendation=search)
- Generate LSL pipelines for [Code Generation](/web/lasso/ssn?recommendation=gen)
- [LSLFlow](https://softwareobservatorium.github.io/lslflow/) for visual construction of pipelines

---

## Full Specification: LSL is flexible and feature-rich

Define WHAT you want to test/find, HOW to test it, and WHERE to run it — and LSL does the rest. Find the full specification of LSL [here](../datastructures/lsl.md).
