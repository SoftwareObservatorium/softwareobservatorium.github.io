---
sidebar_position: 2
---

# Quickstart: Submit Your First LSL Script

## Submitting a Pipeline using LASSO's Dashboard (Angular Web Application)

The LASSO platform provides a comprehensive dashboard to manage, monitor, and view results of pipeline scripts and their execution. Additionally, it provides additional services such as code search.

LASSO' dashboard is accessible at (http://localhost:10222/webui/).

### Step-by-Step Guide to Submit a New Script

1. **Login**: Select the desired user(s) from the [users.json](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config) file.
2. **Submit a New LSL Script Pipeline**: see the famous `Hello World` LSL pipeline next.

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

## Next

You can explore more LSL pipelines and their results in [TDSEHub](../../hub)