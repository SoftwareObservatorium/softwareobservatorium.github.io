# Security

Be aware that the platform in its current form is not optimized for security.

We suggest that it is deployed in an isolated environment.

## Cluster Communication

### Trust store / SSL for secure cluster communication

The communication of managers, workers and thin clients in Ignite's distributed architecture is secured with SSL.

The default (unsecure) trust store is located in [ssl](https://github.com/SoftwareObservatorium/lasso/tree/develop/engine/src/main/resources/ssl)

Password is _lassorocks_.

### Worker RESTful Interface

Workers exhibit a RESTful interface to easy distributed file access of trace files etc (based on data locality principle).

The RESTful API is password protected for basic protection.

The credentials are configured in

* service: [application.properties](https://github.com/SoftwareObservatorium/lasso/tree/develop/service/src/main/resources/)
* worker: [application.properties](https://github.com/SoftwareObservatorium/lasso/tree/develop/worker/src/main/resources/)

Note: the user and password in both files have to match!

```
# worker REST API credentials
worker.rest.user = 
worker.rest.password = 
```

## LASSO Web App(s) / RESTful API

### User Management

Currently, users are managed in a users file. A template can be found here:

* [users.json](https://github.com/SoftwareObservatorium/lasso/tree/develop/doc/lasso_config)

The path to the users configuration is then passed as an argument to the command line arguments of the service (see [deploy](../installation/deploy.md)):

```
-Dusers=/my/path/to/users.conf
```

### Bearer Tokens

The RESTful API uses bearer tokens. Secret keys can be configured in

* service: [application.properties](https://github.com/SoftwareObservatorium/lasso/tree/develop/service/src/main/resources/)

```
security.jwt.token.secret-key=
```

## Sandbox code execution environments

Executing foreign code is of high risk and may lead to unexpected events (e.g., connections, file system access etc.).

(Foreign) code is therefore executed in isolated sandbox environments using docker.

Accordingly, take precautions wrt. docker configurations (run in user mode etc.).
