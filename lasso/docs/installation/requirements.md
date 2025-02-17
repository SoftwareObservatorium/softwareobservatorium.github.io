---
sidebar_position: 1
---

# Requirements and Assumptions

To ensure proper functioning the LASSO platform, please note the following requirements:

### Operating System

We recommend using a Linux distribution (tested on Ubuntu 24.04 LTS). MacOS and Windows are not officially tested, but may still work.

### Docker Installation

The platform relies on isolated containers to execute and test code. Ensure you have a working Docker installation. Preferably, run Docker as a non-root user. You can follow the instructions in the [Docker documentation](https://docs.docker.com/engine/install/ubuntu/) to get started (or use of one the alternative documentations for your operating system).

### Java JDK

Make sure you have Java JDK version 17 or later installed on your system in order to build the platform's modules (any free JDK distribution should work). If the LASSO platform is deployed in a docker container, no local JDK distribution is needed.

### Frontend Module

The frontend module of the LASSO platform (i.e., LASSO's dashboard) is built using Angular, Node.js, and npm. This module is build automatically using the correct versions by using a particular Maven plugin (learn more at [https://github.com/eirslett/frontend-maven-plugin/](https://github.com/eirslett/frontend-maven-plugin/)).

### LASSO Grid Services

LASSO uses Apache Ignite for cluster communication. Several ports are opened automatically to enable grid communication. If the LASSO platform runs inside a docker environment, you have to ensure that ports can be reached (https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/).