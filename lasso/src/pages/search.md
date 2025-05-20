# Code Search Services

## Interface-Driven Code Search: Finding Code by Interface with LASSO's Query Language (LQL)

LASSO's Query Language (LQL) enables a powerful and precise way to search for code based on the interfaces it implements or extends.  Instead of traditional text-based searches, LQL allows you to target code that conforms to specific interface contracts, making it invaluable for finding implementations, extensions, or code interacting with particular interfaces.

**Learn More & Get Started:**

*   [**Try the Interface-driven Code Search**](/web/lasso/search) -  Start searching with LQL now.
*   [**LQL Documentation**](/web/docs/datastructures/lql) -  Deep dive into LQL syntax, operators, and advanced querying techniques.

### Examples

* [**Base64 encoding**](/web/lasso/search?example=BASE64)
* [**Stack**](/web/lasso/search?example=STACK)

---

## Test-Driven Code Search: Finding Code by Test Specifications with LASSO's Sequence Sheet Notation (SSN)

LASSO's Sequence Sheet Notation (SSN) allows for a unique form of code search based on test specifications. This *test-driven code search* approach enables you to pinpoint code that produces the expected behavior defined by your test specifications, represented as stimulus sheets in SSN.  This is extremely helpful for verifying functional correctness and ensuring code meets established requirements.

**Learn More & Get Started:**

*   [**Try the Test-Driven Code Search**](/web/lasso/ssn?recommendation=search) - Begin exploring code based on your SSN test specifications.
*   [**SSN Documentation**](/web/docs/datastructures/ssn) - Understand the structure and capabilities of SSN for defining test specifications.

### Examples

* [**Base64 encoding**](/web/lasso/ssn?recommendation=search&example=BASE64)
* [**Base64 encoding (Parameterized Tests)**](/web/lasso/ssn?recommendation=search&example=BASE64_PARAMETERIZED)
* [**Stack**](/web/lasso/ssn?recommendation=search&example=STACK)

## Research

More details about LASSO's code search services can be found in our recent article [Code search engines for the next generation](https://doi.org/10.1016/j.jss.2024.112065).