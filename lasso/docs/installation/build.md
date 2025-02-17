---
sidebar_position: 2
---

# Building LASSO from GitHub

The project is managed using Maven by relying on _Maven Wrapper_ (https://maven.apache.org/wrapper/) for building all required modules (your local Maven may work as well).

The following command needs to be executed in the root directory of the repository:

```bash
./mvnw -DskipTests \
  -Dfrontend.build=embedded \
  clean install
```

The chosen profile (i.e., `embedded`) for the webapp assumes that LASSO's RESTful webservice will be running on `localhost:10222`.

For each module, the builds are available in the corresponding `target/*.jar` folders.



# Building LASSO from GitHub

### Prerequisites

The project uses Maven to manage dependencies and build artifacts. For building purposes, it relies on the _Maven Wrapper_ (https://maven.apache.org/wrapper/), which allows you to use a local Maven installation or the one provided by the wrapper.

### Building LASSO

To build LASSO from scratch, navigate to the root directory of the repository and execute the following command:

```bash
./mvnw -DskipTests \
  -Dfrontend.build=embedded \
  clean install
```