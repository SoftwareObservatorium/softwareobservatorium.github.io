# Docker

Running LASSO in Docker requires the docker-in-docker (DIND) functionality, which allows LASSO to use docker (within a container!) for code execution. This means that any image available on the host machine is also available inside Docker containers.

Note: When using DIND, it's essential to mount host volumes carefully, as described [here](https://stackoverflow.com/a/62413225). Mounting host volumes requires special attention.

## LASSO Service (standalone mode)

1. First build the LASSO platform (see [build](../installation/build))
2. Build the docker image in the root of the repository using this [Dockerfile](https://github.com/SoftwareObservatorium/lasso/tree/develop/docker/service_embedded).
```bash
docker build -t lasso-service-embedded/latest -f docker/service_embedded/Dockerfile .
```
2. Run LASSO service (standalone) in Docker-in-Docker mode:
```bash
# create LASSO work directory
mkdir lasso-work
mkdir ignite

# set environmental variable
LASSO_WORK_PATH=$(pwd)/lasso-work/
LASSO_CONFIG_PATH=$(pwd)/config/
IGNITE_WORK_PATH=$(pwd)/ignite/

# start LASSO service (standalone) - interactive mode (to see logs etc.)
docker run -it   --env DIND_SUPPORT_LIBS=$LASSO_WORK_PATH   --network="host" -v /var/run/docker.sock:/var/run/docker.sock   -v $LASSO_WORK_PATH:/opt/lasso/work/ -v $LASSO_CONFIG_PATH:/opt/lasso/config/ -v $IGNITE_WORK_PATH:/opt/lasso/ignite/   lasso-service-embedded/latest
```

Here's a brief explanation of each argument:

* `--env DIND_SUPPORT_LIBS=$LASSO_WORK_PATH`: This sets an environment variable to detect if LASSO is running in DIND.
* `--network="host"`: This allows LASSO to communicate with the host machine (e.g., Solr and Nexus OSS).
* `-v /var/run/docker.sock:/var/run/docker.sock`: This mounts the Docker socket from the host machine, allowing DIND to work properly.
* `-v $LASSO_WORK_PATH:/opt/lasso/work/` and `-v $IGNITE_WORK_PATH:/opt/lasso/ignite/`: These mount the LASSO and Ignite working directories from the host machine.

:::info
In Linux, you can use `--network="host"` to simplify access (this does not work with Docker Desktop).
:::

## LASSO Actions

Some of LASSO's actions require specific docker images that contain the tools/techniques. To work in LASSO, these images must be available on both the machines/containers where the service (manager) and workers run.

_Dockerfiles_ for LASSO integrations are located in [integrations](https://github.com/SoftwareObservatorium/lasso/tree/develop/docker/integrations).

### Nicad - code clone detector

Here's an example to build Nicad 6.2.1:
```bash
# go to Dockerfile
cd docker/integrations/nicad-6.2.1

# Build
docker image build -t nicad:6.2.1 .
```

Note that this assumes you're working in the `nicad-6.2.1` directory.