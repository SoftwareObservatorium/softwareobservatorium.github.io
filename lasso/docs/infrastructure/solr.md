# Code Index with Solr

This guide provides a step-by-step walkthrough on setting up a new code search index as part of LASSO's executable corpus.

**Important:** Possible security risks are not taken into consideration, so do not expose your instances without proper configuration and security measures.

## Quickstart Guide (Docker)

### Prerequisites

This guide assumes that:

* A working Docker installation is present on the local machine. For more information, see [docker](docker).
* The official Solr image from Docker Hub (see [https://hub.docker.com/_/solr](https://hub.docker.com/_/solr)) is used to run the latest version of Solr.

### Step-by-Step Instructions

1. **Create a directory for Solr index**:
```bash
mkdir lassoindex
```

2. **Set ownership and permissions for Solr user**:
```bash
sudo chown -R 8983:8983 lassoindex
```

3. **Run a new Solr container with a custom index**:
```bash
docker run -d -v "$PWD/lassoindex:/var/solr" -p 8983:8983 --name lasso_solr_quickstart solr solr-precreate lasso_quickstart
```

4. **Verify the container is running**:
```bash
docker ps -a
```

Alternatively, open your web browser and load Solr's dashboard at [http://localhost:8983/](http://localhost:8983/).

### Update the schema of your newly created index (Optional)

This step assumes that your Solr instance is running on `localhost` on port `8983`.

1. **Set the path to LASSO's repository**:
```bash
export LASSO_REPO=/my/path/lasso/repository
```

2. **Copy LASSO document schema to your index**:
```bash
sudo cp $LASSO_REPO/doc/solr_config/managed-schema* lassoindex/data/lasso_quickstart/conf/
```

3. **Set ownership and permissions for Solr user (again)**:
```bash
sudo chown -R 8983:8983 lassoindex/data/lasso_quickstart/conf/
```

4. **Reload the index to load the new schema**:
```bash
curl -vvv "http://localhost:8983/solr/admin/cores?action=RELOAD&core=lasso_quickstart"
```

Alternatively, open your web browser and load Solr's dashboard to reload the index using 'Core Admin' at [http://localhost:8983/](http://localhost:8983/).

### Schema Files
----------------

The schema files are located in [solr_config](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/solr_config).

**Note:** This guide was tested under Ubuntu 24.04 LTS.