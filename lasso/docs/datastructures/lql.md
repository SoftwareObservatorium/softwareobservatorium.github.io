---
sidebar_position: 3
---

# LQL - LASSO Query Language

### Overview

LQL (LASSO Query Language) is a language used to define the interface of a functional abstraction or concrete code unit (e.g., class). It plays a crucial role in the [LASSO](https://github.com/SoftwareObservatorium/lasso) framework, enabling features such as:

* **Interface-driven code search** (IDCS): LQL is translated into Solr/Lucene queries to retrieve textual candidates that match a given interface specification.
* **Sequence Sheet Notation** (SSN): LQL defines the interface used by sequence sheets to identify units under test (e.g., class under test).

### How it Works

#### Interface-driven Code Search (IDCS)

In IDCS, LQL is converted into Solr/Lucene queries and optional filter queries to retrieve a set of textual candidates that match a given interface specification.

#### Sequence Sheet Notation (SSN)

LQL defines the interface used by sequence sheets to identify Systems Under Test (SUT).

### ANTLR4 Grammar

The grammar for LQL is written using [ANTLR4](https://www.antlr.org/). You can find it in:

* **Location**: [LQL.g4](https://github.com/SoftwareObservatorium/lasso/blob/develop/lql/src/main/antlr4/de/uni_mannheim/swt/lasso/lql/LQL.g4)
* **Generated Java Stub**: The Java stub is generated as part of Maven's build cycle (e.g., `mvn package`), see [ANTLR4 Maven plugin](https://www.antlr.org/maven-plugin/).

### JUnit Tests (Demonstrations)

The existing JUnit tests demonstrate all features present in LQL:

* **Location**: [LQLParserTest.java](https://github.com/SoftwareObservatorium/lasso/blob/develop/lql/src/test/java/de/uni_mannheim/swt/lasso/lql/LQLParserTest.java)

### Language

#### Typical Format

The typical format of a LQL interface definition is:
```text
InterfaceName {
    constructor(fullyQualifiedInputTypes*)
    methodName(fullyQualifiedInputTypes*)->fullyQualifiedOutputTypes*
} filters*
```
where:

* `InterfaceName` usually denotes the name of the functional abstraction at hand.
* `constructor` an optional constructor (initializer).
* `methodName` zero or more method signatures separated with newline, including an optional list of fully-qualified input parameter types as well as output parameter types separated by comma.

#### Stack Example

Here's a sample interface definition for a `Stack` class:
```text
Stack {
    push(java.lang.Object)->java.lang.Object
    pop()->java.lang.Object
    peek()->java.lang.Object
    size()->int
}
```
This example includes filters that represent a negative list in IDCS (fully optional):
```text
!name_fq:Queue !name_fq:Deque
```

#### Placeholders

In case the interface name is unimportant or missing, you can use placeholders like `$` to denote any name:
```text
$ {
    encode(byte[])->java.lang.String
}
```
Note that placeholders must start with a dollar sign (`$`).

#### Filters

Filters are fully optional. They can also be set in LSL using the `_filter_` command as part of the selection action.