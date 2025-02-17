# Actions

In the following we present a developer-oriented documentation for actions.

## Action API
-------------

The workflow engine of the LASSO platform is based on the principle of Inversion of Control (IoC), as known from popular frameworks like Spring.

### Java Action Class Structure
-------------------------------

A Java Action class must inherit from a certain subclass from the Action API, such as `DefaultAction`. The general structure of a Java Action class is:

```java
@LassoAction(desc = "An action with no behaviour")
public class MyAction extends DefaultAction {
    @LassoInput(desc = "a configuration parameter", optional = true)
    public String paramExample;
    
    @Override
    public void execute(LSLExecutionContext ctx, ActionConfiguration conf) throws IOException {
        // abstraction container (SM)
        Abstraction abstraction = conf.getAbstraction();
    }
}
```

### Key Concepts

*   **Inheritance**: Java Actions must inherit from a subclass of the `DefaultAction` class.
*   **Lifecycle Methods**: The workflow engine uses well-defined lifecycle methods, which are inherited by the Action class implementation.
*   **Annotations**: The Action class implementation is further described to the workflow engine using annotation classes like `@LassoInput`, `@LassoAction`, and others.

## Using Java Actions in LSL Pipeline Scripts
--------------------------------------------

Once a Java Action class is known to the workflow engine, it can be used as part of an LSL pipeline script execution. The syntax for this is:

```groovy
action(name:'noOp',type:'MyAction') {
    paramExample = 'hello world'
    dependsOn '...'
    include '...'
    analyze() { ... }
}
```

## Docker Images for Actions
---------------------------

LASSO Actions may require additional tools or techniques to be present. A common approach to integrate external tools/techniques is to use Docker images.

*   For more information on using Docker with LASSO, see [docker.md](../infrastructure/docker.md).