---
sidebar_position: 5
---

# Analyze and index software artifacts

Why? We aim to analyze (code analytics) and index the previously downloaded artifact(s) to enable code searches.

This uses functionality provided by the [analyzer](../development/analyzer.md) module.

The following command first conducts static code analysis and then populates the results in the Solr index `lasso_quickstart` to enable code search

```bash
# set your path to LASSO's repository
export LASSO_REPO=/my/path/lasso/repository
# run analyzer (points to directory of crawler above)
java -Xms2g -Xmx2g \
    -Dindexer.work.path=lasso_crawler/ \
    -Dlasso.indexer.worker.threads=4 \
    -Dbatch.job.writer.threads=-1 \
    -Dbatch.job.commit.interval=1 \
    -Dbatch.solr.url=http://localhost:8983/solr \
    -Dbatch.solr.core.candidates=lasso_quickstart \
    -jar $LASSO_REPO/analyzer/target/analyzer-1.0.0-SNAPSHOT-exec.jar
```

where

* `indexer.work.path=lasso_crawler/` points to your crawler working directory
* `lasso.indexer.worker.threads` sets the number of worker threads for generating Solr documents
* `batch.job.writer.threads sets` the number of writer threads for Solr
* `batch.job.commit.interval sets` the commit interval for committing Solr documents (batching)
* `batch.solr.url=http://localhost:8983/solr` sets the Solr url
* `batch.solr.core.candidates=lasso_quickstart` sets the Solr core (i.e., code search index)

Now, you can now open your web browser and go to http://localhost:8983/solr/#/lasso_quickstart/query to see the results.

When you hit _Execute Query_, hundreds of documents should appear that describe the code that has been indexed. There are two types of documents present: class- and method documents.

You can try simple keyword queries with Solr's query syntax such as the query (i.e., q) `name_fq:"Base64"` to retrieve all classes similar to `Base64`. You can add a filter query (i.e., fq), by only returning all method (documents) of the classes found (i.e., `doctype_s:"method"`),

See https://solr.apache.org/guide/solr/latest/query-guide/query-syntax-and-parsers.html for Solr's query syntax.