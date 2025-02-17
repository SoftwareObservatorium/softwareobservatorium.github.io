# Nexus and LASSO: A Step-by-Step Guide

This guide walks you through the process of setting up a new artifact repository in Nexus as part of LASSO's executable corpus. Please note that security risks are not considered, so do not expose your instances.

## Quickstart Guide (Docker)

This guide assumes you have a working Docker installation on your local machine. You can refer to the official Docker documentation for instructions: (https://docs.docker.com/engine/install/linux-postinstall/)

We will use the official Sonatype Nexus OSS image for this guide. Please note that security risks are not considered, so do not expose your instances.

### Start Nexus in a Container

```bash
# start nexus in a container
docker run -d -p 8081:8081 --name nexus sonatype/nexus3
# NOTE: be patient (!), nexus takes some time to start
```

### Get Password for User 'admin'

```bash
# get password for user 'admin'
docker exec -it nexus bash
cat sonatype-work/nexus3/admin.password
# terminate bash - ctrl-d
```

Tested with Sonatype Nexus OSS 3.65.0-02.

## Nexus Configuration

### Open Your Web Browser and Login

Open your web browser and navigate to `http://localhost:8081/`. Log in as 'admin' using the aforementioned password. After a successful login, Nexus will start a quick wizard. Make sure to enable anonymous access.

## Deployment of Subject Artifacts within LASSO

Actions like `GenerateCodeOllama` assume a (Nexus) artifact repository to be present for deployment of artifacts under analysis (on-the-fly). This requires the presence of a repository in which artifacts can be deployed.

### Step-by-Step Instructions:

1. Log in to your Nexus Repository manager using your admin account (e.g., http://localhost:8081/)
2. Go to `http://localhost:8081/#admin/repository/repositories`
3. Click `Create repository`
4. Choose repository type `maven2 (hosted)`
5. Assign a unique identifier (e.g., `lasso-deploy`)
6. Set version policy to `mixed`, layout policy to `permissive`, and deployment policy to `allow redeploy`
7. Go to `http://localhost:8081/#admin/repository/repositories:maven-public` and add your newly created repository to _Members_, so we can retrieve deployed artifacts via the _maven-public_ repository

### Update LASSO's Configuration File `corpus.json`

You need to update LASSO's configuration file [corpus.json](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config) with your Nexus deployment settings. Please note that you need to restart LASSO after updating the configuration file.

```json
  "artifactRepository": {
    "id": "lasso_quickstart_nexus",
    "name": "Quickstart nexus",
    "url": "http://localhost:8081/repository/maven-public/",
    "deploymentUrl": "http://localhost:8081/repository/lasso-deploy/",
    "user": "XXX",
    "pass": "XXX",
    "description": "quickstart repository of LASSO"
  }
```

### Restart LASSO

You need to restart LASSO with the updated `corpus.json` configuration file. It might be necessary to update LASSO's Maven configuration in `lasso-work/repository/settings.xml` as well (alternatively, change or removing LASSO's existing work directory).

Note: For advanced use cases with LASSO, setting up a deployment _user_ is a better choice instead of using the admin user.

## Deployment of LASSO's Support Libraries

Certain features of LASSO rely on deployed support libraries. To deploy them (see configuration above), run the following command to deploy all LASSO related artifacts to your local Nexus repository

```bash
# set your path to LASSO's repository
./mvnw -s doc/nexus_config/settings_plugin_deploy.xml -gs doc/nexus_config/settings_plugin_deploy.xml -DskipTests -Dfrontend.build=embedded -DaltDeploymentRepository=lasso_quickstart_nexus::default::http://localhost:8081/repository/lasso-deploy/ -DaltReleaseDeploymentRepository=lasso_quickstart_nexus::default::http://localhost:8081/repository/lasso-deploy/ -DaltSnapshotDeploymentRepository=lasso_quickstart_nexus::default::http://localhost:8081/repository/lasso-deploy/ deploy
```

Note: You need to change the password in `doc/nexus_config/settings_plugin_deploy.xml` to your custom Nexus password (see example).