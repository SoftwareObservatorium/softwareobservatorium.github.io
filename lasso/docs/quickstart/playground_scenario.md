---
sidebar_position: 2
---

# Labs Quickstart: Submit Your First LSL Script

You can explore example LSL pipelines and their results in [TDSEHub](../../hub).

You can submit new LSL scripts manually by heading over to [Submit](../../lasso/submit).

Alternatively, you can use [Code Search](../../search) or [Code Generation](../../generation) to generate LSL pipeline scripts based on templates.

### Hello World LSL Pipeline Script

To exemplify, use the following LSL script pipeline which tests three JDK-builtin code candidates as part of Java's collections API.

#### Hello World with JDK's Collections

```groovy
dataSource 'lasso_quickstart'
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
    action(name: 'test', type: 'Arena') {
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
```

#### Pipeline Overview

The pipeline defines a study block consisting of two actions: **create** and **test**.

##### 1. Create Action

The first action creates a new stimulus matrix (SM) based on four core ingredients:

*   **Name**: The functional abstraction (i.e., functionality) represented by the stimulus matrix (SM).
*   **Interface**: The required interface for code candidates, assumed by tests.
*   **Implementations**: Code candidate implementations to test.
*   **Tests**: A list of tests in sequence sheet notation.

Note that the test is defined directly using LSL commands. In other pipelines, tests are usually loaded and/or generated.

##### 2. Test Action

The second action takes the SM created by the first action and uses it as input for LASSO's `arena` test driver to run the configuration of tests and implementations. The pipeline outputs the stimulus response matrix (SRM).

After execution, the dashboard offers various ways to obtain results:

*   **Results**: View the results in a classic search results view.
*   **Data Analysis**: Analyze data stored in LASSO's database in various ways.

## Software Analytics (SRM/SRH Analysis)

The LSL pipeline script executions result in one or more SRMs that are stored in LASSO's distributed database (based on Apache Ignite). The collection of SRMs effectively results in an SRM data warehouse, which we refer to as stimulus response hypercube (SRH). The data can be export to external analytics tools. You can find more information in [Analysis](../analytics/data.md).

## Next

You can explore more LSL pipelines and their results in [TDSEHub](../../hub)