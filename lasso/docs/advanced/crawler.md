---
sidebar_position: 4
---

# Crawl software artifacts

Why? We want to demonstrate the ingestion (import) of new artifacts into LASSO's executable corpus.

This uses functionality provided by the [crawler](../development/crawler.md) module.

In this example, we aim to ingest `Apache Commons Codec 1.15` (sources and bytecode) and make it available in the executable corpus.

```bash
# set your path to LASSO's repository
export LASSO_REPO=/my/path/lasso/repository
# create working directory (where artifacts are stored)
mkdir lasso_crawler

# run crawler to download commons-codec
java -Dartifacts=commons-codec:commons-codec:1.15:sources \
    -Dindexer.work.path=lasso_crawler \
    -Dbatch.maven.repo.url=http://localhost:8081/repository/maven-public/ \
    -Dlasso.indexer.worker.threads=1 \
    -jar $LASSO_REPO/crawler/target/crawler-1.0.0-SNAPSHOT.jar
```

where

* `artifacts` takes a '|' separated list of Maven coordinates (format: `groupId:artifactId:version:classifier`)
* `indexer.work.path=lasso_crawler` points to your working directory
* `batch.maven.repo.url` points to your nexus repository
* `lasso.indexer.worker.threads` sets the number of worker threads for crawling artifacts

Note that the `crawler` module can also be used to index entire Maven-compatible repositories including Maven Central based on Nexus indices (https://maven.apache.org/repository/central-index.html).
