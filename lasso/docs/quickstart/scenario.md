---
sidebar_position: 2
---

# Quickstart: Submit Your First LSL Script

## Start the LASSO Platform and its Executable Corpus

To get started, run the following two commands in a local directory on your machine (requires [docker compose](https://docs.docker.com/compose/)):

```bash
curl https://raw.githubusercontent.com/SoftwareObservatorium/lasso/refs/heads/develop/docker/compose/docker-compose-embedded.yml -o docker-compose.yml
docker compose up
```

Wait until all services started (LASSO platform, Code Search Index and Artifact Repository) and then open LASSO's dashboard at http://localhost:10222/webui/ (login: admin / admin123).

Note that the corresponding Docker Dockerfiles and compose files can be found in [GitHub](https://github.com/SoftwareObservatorium/lasso/tree/develop/docker). Brief instructions of how the images were built are available [here](https://github.com/SoftwareObservatorium/lasso/blob/develop/DEPLOY_GITLAB_DOCKER.md).

### Infrastructure and Services

Besides the LASSO Platform, the executable corpus services required by the platform are started as well:

* a code search index based on `Apache Solr`, preconfigured for LASSO's code search and analysis services, is started: [Solr Dashboard](http://localhost:8983) (no credentials!)
* an artifact repository based on `Sonatype's Nexus` (Community edition), preconfigured for LASSO's artifact storage, is started: [Nexus Dashboard](http://localhost:8081/) (login: admin / admin)

## Submitting a Pipeline using LASSO's Dashboard (Angular Web Application)

The LASSO platform provides a comprehensive dashboard to manage, monitor, and view results of pipeline scripts and their execution. Additionally, it provides additional services such as code search.

LASSO' dashboard is accessible at (http://localhost:10222/webui/).

### Step-by-Step Guide to Submit a New Script

1. **Login**: Select the desired user(s) from the [users.json](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config) file (default: admin / admin123).
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

## Software Analytics (SRM/SRH Analysis)

The LSL pipeline script executions result in one or more SRMs that are stored in LASSO's distributed database (based on Apache Ignite). The collection of SRMs effectively results in an SRM data warehouse, which we refer to as stimulus response hypercube (SRH). The data can be export to external analytics tools. You can find more information in [Analysis](../analytics/data.md).

## Next

You can explore more LSL pipelines and their results in [TDSEHub](../../hub)