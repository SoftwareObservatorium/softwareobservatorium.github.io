---
sidebar_position: 3
---

# Deploy LASSO in Embedded Mode

The LASSO platform is a distributed platform by design, consisting of a manager node that executes LSL pipelines and worker nodes that execute actions on stimulus matrices (tests and code implementation candidates) in parallel. However, it can also be run in embedded mode on a single machine.

## Options for Deployment

### Option 1: Docker Container

Running LASSO's service in a Docker container is the simplest way to set up the platform.

*   See detailed instructions for [Docker](../infrastructure/docker).
*   The _Dockerfile_ is located in [Dockerfile](https://github.com/SoftwareObservatorium/lasso/tree/develop/docker/service_embedded).
*   Note that example configuration files (JSON) for this guide of the corpus and the users are located in [lasso_config](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config). You may need to adjust the Dockerfile mentioned above.

### Option 2: Local Java

LASSO's platform can also be run as a classic local Java application (Spring Boot jar).

#### Setup and Configuration

To deploy LASSO in embedded mode using Java, follow these steps:

1.  **Create LASSO work directory**: Run the following command to create the necessary directories:
```bash
mkdir lasso_work
mkdir lasso_config
cp lasso_config/users.json lasso_config/
cp lasso_config/corpus.json lasso_config/
```

Note that example configuration files (JSON) for this guide of the corpus and the users are located in [lasso_config](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config). You may need to adjust the Dockerfile mentioned above.


2.  **Copy over arena jar** (LASSO's scalable test driver for Java): Copy the required JAR file into the `lasso_work` directory:

```bash
cp arena/target/arena-1.0.0-SNAPSHOT-exec.jar lasso_work/repository/support/arena-1.0.0-SNAPSHOT.jar
```

3. **Running LASSO in Embedded Mode**

To run LASSO in embedded mode, execute the following command (note that __add-opens__ is required in more recent versions of Java):

```bash
java --add-opens=java.base/jdk.internal.access=ALL-UNNAMED \
     --add-opens=java.base/jdk.internal.misc=ALL-UNNAMED \
     --add-opens=java.base/sun.nio.ch=ALL-UNNAMED \
     --add-opens=java.base/sun.util.calendar=ALL-UNNAMED \
     --add-opens=java.management/com.sun.jmx.mbeanserver=ALL-UNNAMED  \
     --add-opens=jdk.internal.jvmstat/sun.jvmstat.monitor=ALL-UNNAMED  \
     --add-opens=java.base/sun.reflect.generics.reflectiveObjects=ALL-UNNAMED  \
     --add-opens=jdk.management/com.sun.management.internal=ALL-UNNAMED  \
     --add-opens=java.base/java.io=ALL-UNNAMED  \
     --add-opens=java.base/java.nio=ALL-UNNAMED  \
     --add-opens=java.base/java.net=ALL-UNNAMED  \
     --add-opens=java.base/java.util=ALL-UNNAMED  \
     --add-opens=java.base/java.util.concurrent=ALL-UNNAMED  \
     --add-opens=java.base/java.util.concurrent.locks=ALL-UNNAMED  \
     --add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED  \
     --add-opens=java.base/java.lang=ALL-UNNAMED  \
     --add-opens=java.base/java.lang.invoke=ALL-UNNAMED  \
     --add-opens=java.base/java.math=ALL-UNNAMED  \
     --add-opens=java.sql/java.sql=ALL-UNNAMED  \
     --add-opens=java.base/java.lang.reflect=ALL-UNNAMED  \
     --add-opens=java.base/java.time=ALL-UNNAMED  \
     --add-opens=java.base/java.text=ALL-UNNAMED  \
     --add-opens=java.management/sun.management=ALL-UNNAMED  \
     --add-opens java.desktop/java.awt.font=ALL-UNNAMED \
    -server -ea -Xms2G -Xmx4G \
    -Dserver.port=10222 -Djava.net.preferIPv4Stack=true -Dcluster.nodeId=lasso-quickstart -Dcluster.embedded=true \
    -Dthirdparty.docker.uid=$(id -u) -Dthirdparty.docker.gid=$(id -g) \
     -Dlasso.workspace.root="$PWD/lasso_work/"\
     -Dusers="file:$PWD/lasso_config/users.json"\
     -Dcorpus="file:$PWD/lasso_config/corpus.json"\
     -jar /opt/lasso/service-1.0.0-SNAPSHOT.jar
```

### Arguments Explained

Here is a quick description of the arguments used to run LASSO in embedded mode:

*   **Memory allocation**: `server`, `-ea`, `-Xms2G`, and `-Xmx4G` allocate sufficient memory for LASSO's Ignite cluster.
*   **Ignite configuration**: `-Dserver.port=10222`, `-Djava.net.preferIPv4Stack=true`, `-Dcluster.nodeId=lasso-quickstart`, and `-Dcluster.embedded=true` configure the Ignite cluster to run in embedded mode.
*   **User/group IDs**: `-Dthirdparty.docker.uid=$(id -u)` and `-Dthirdparty.docker.gid=$(id -g)` set the user and group IDs for Docker images (based on the machine's command results).
*   **Working directory**: `-Dlasso.workspace.root="$PWD/lasso_work/"` sets the working directory for LASSO executions/traces.
*   **User configuration**: `-Dusers="file:$PWD/lasso_config/users.json"` sets the users required to access the webapps and RESTful API.
*   **Corpus configuration**: `-Dcorpus="file:$PWD/lasso_config/corpus.json"` sets the corpus configuration.