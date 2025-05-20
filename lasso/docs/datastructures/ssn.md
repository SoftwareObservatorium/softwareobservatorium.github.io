---
sidebar_position: 1
---

# SSN - Sequence Sheet Notation

Version: 0.2

## Overview

Sequence sheets serve as comprehensive test specifications, enabling data-driven analysis. For a detailed introduction to sequence sheets and practical examples, refer to our [lecture slide set on Advanced Software Engineering](/web/pdfviewer?f=L9-Sequence-Sheets-24.pdf).

## Sequence Sheet Notation (SSN) Specification


### 1. Introduction

Sequence Sheet Notation (SSN) provides a tabular, spreadsheet-inspired format for specifying sequences of method invocations (stimuli) and, optionally, expected outputs for use in automated or manual test execution. It is designed for readability and traceability, and supports referencing, parameterization, and expressive code-based values.

When only a test scenario is specified in a sequence sheet, we refer to it as `Stimulus Sheet` that optionally may contain expected outputs in the first output column. When a stimulus sheet is invoked on a code module under test (e.g., class), the output column stores the actual observed outputs at runtime. The resulting sheet that stores the observations is referred to as `Actuation Sheet`.

---

### 2. Syntax Overview

Each sequence "sheet" consists of rows, each of which represents a single action (method invocation or object construction) in a test scenario.

Columns encode the following (left-to-right order):

| Column | Spreadsheet Letter | Meaning |
| --- | --- | --- |
| Output | A | Expected output (may be blank); at runtime, this holds the observed output |
| Operation | B | The method or constructor name to invoke (or `"create"` for object creation) |
| Target | C | Cell reference to the receiver object (e.g., `A1`), or class name for `"create"` |
| Argument 1+ | D, E, ... | Zero or more columns with method/constructor arguments (code expression, cell reference, parameter, etc.) |

- The row number (N) is implicit, from top to bottom (`1`, `2`, ...).
- "Cell references" always use `[ColumnLetter][RowNumber]` format; e.g. `A2`, `D3`.

---

### 3. Detailed Column Semantics

#### Basic Table Layout

| A (Output) | B (Operation) | C (Target) | D+ (Arg1, Arg2, …) |
|---|---|---|---|
|(row=1 → `A1`)|	(row=1 → `B1`)|	(row=1 → `C1`)	|(row=1 → `D1`, ...)	|
|(row=2 → `A2`)|	...|	...|	...	|

Each cell can be referenced in later rows (e.g., `A2` means the output of row 2).  
Parameters and results may include direct references to prior cells.

#### A. Output (Column A)

- The expected value/result of the operation in this row.
- If left blank: No oracle value is defined, but output is available for later referencing (e.g., output stored in cell `A1`).
- If filled: Can be used as an oracle value like in oracle assertions (expected vs. actual).
- Permitted content: Any Java expression, literal, parameter reference (e.g. `?p1`), or cell reference (`A1`).

#### B. Operation (Column B)

- The method or operation to invoke on the target.
- `create` is special and indicates an object instantiation (constructor call), with the "target" column providing the class name/type.
- Permitted content: A valid Java method/constructor name (as string).

#### C. Target (Column C)

- If Operation is `create`: The class name (e.g., `Stack`).
- Otherwise: A cell reference (e.g., `A2`) referring to the output of a previous row, which is the object on which the method is called.

#### D+, Arguments (Columns D, …)

- Zero or more arguments for the method/constructor.
- Permitted content: Any Java literal/expression, parameter reference, or cell reference.

---

### 4. Cell Content & Expressions

Each cell (except Operation) may contain:
- a Java literal (numbers, strings, booleans, null)
- a valid Java expression
- a cell reference (`A3`)
- a parameter reference (`?p1`, `?username`)
- blank (no value or not applicable)

Parameter references are substituted at runtime with provided values.

---

### 5. Referencing Rules

- Cell References:  
  - Notation: `[ColumnLetter][RowNumber]` (`A1`, `C2`, ...)  
  - Refers to the output value in that cell (i.e., value produced during execution).
  - May be used in Output/Input Argument or Target columns.
  - Forward references (i.e., referencing a cell below the current row) are disallowed.

- Parameters:  
  - Notation: `?` followed by identifier; e.g., `?p1`, `?inputString`.
  - Used for parameterized testing – these are provided at execution time (i.e., sheets can be invoked like any test methods/functions).

---

### 6. Evaluation Semantics

Each row is evaluated in order:
1. If Operation is `"create"`:
    - Instantiate object of class given in Target, using supplied arguments.
    - Store resulting reference in current Output cell.
2. If Operation is a method:
    - Resolve the Target reference (previous Output cell value).
    - Evaluate arguments (as Java values, resolved recursively for cell references/parameters).
    - Invoke method on Target with arguments.
    - Result is stored in Output cell (if any).
3. If Output cell is not blank and is not a parameter expression:
    - Enables comparison of actual result to expression in Output (done in later SRM analysis).

---

### 7. Parameterization

SSN supports parameterized sheets:
- Any cell may contain a parameter reference (e.g., `?p1`).
- Parameters are bound at execution (by LSL or the test runner)

---

### 8. Example Tables

Example 1: Stack Test (Basic Stimulus Sheet)

| Row | (A) Output        | (B) Operation | (C) Target | (D) Arg1             |
|-----|----------------|-----------|--------|------------------|
| 1   |                | create    | Stack  |                  |
| 2   |                | push      | A1     | "Hello World!"  |
| 3   |                | size      | A1     |                  |
| 4   | "Hello World!"| pop       | A1     |                  |
| 5   | 0              | size      | A1     |                  |

How to read:
- Row 1 (`A1`): Creates a Stack (output reference).
- Row 2 (`A2`): Pushes string onto the stack created in `A1`.
- Row 3 (`A3`): Gets the size of the stack from `A1`.
- Row 4 (`A4`): Pops the value from the stack (`A1`). Expected output: "Hello World!"
- Row 5 (`A5`): Gets stack size after pop; should be 0.

References: Later rows can use any above output (e.g., `D2`) as arguments.

| Row | (A) Output        | (B) Operation | (C) Target | (D) Arg1             |
|-----|----------------|-----------|--------|------------------|
| 1   |                | create    | Stack  |                  |
| 2   |                | push      | A1     | "Hello World!"  |
| 3   |                | size      | A1     |                  |
| 4   | **D2** (instead of "Hello World!") | pop       | A1     |                  |
| 5   | 0              | size      | A1     |                  |

---

Example 2: Base64 Encoding/Decoding

| Row | A (Output) | B (Operation) | C (Target) | D (Arg1) |
| --- | --- | --- | --- | --- |
| 1  | | create      | Base64         |            |          |
| 2  | | encode      | A1             | "Hello World".getBytes()     |          |
| 3  | "Hello World".getBytes() | decode       | A1               | "SGVsbG8gV29ybGQ=".getBytes()

- Row 2: Encodes the string, using the Base64 object created in `A1`.
- Row 3: Decodes a Base64 input, expecting "Hello World".getBytes() as output (compared in test).

---

## Schema (Format)

(under construction)

Internally, the format used to store stimulus/actuation sheets is based on JSONL.

```javascript
{"cells": {"A1": {}, "B1": "create", "C1": "Stack"}}
{"cells": {"A2": {}, "B2": "create", "C2": "java.lang.String", "D2": "'Hello World!'"}}
{"cells": {"A3": {}, "B3": "push", "C3": "A1", "D3": "A2"}}
{"cells": {"A4": 1, "B4": "size", "C4": "A1"}}
```

## Storing Observations - Serializing Outputs / Protocol

(under construction)

Current serialization logic can be found in [GSONMapper](https://github.com/SoftwareObservatorium/lasso/blob/develop/arena/src/main/java/de/uni_mannheim/swt/lasso/arena/sequence/sheetengine/interpreter/serialize/GsonMapper.java).

```
# placeholders
"$N/A" -> internal issue with serializing object
"$*" -> undefined cell value (e.g., undefined oracle values in the output column)
"$EXCEPTION@" + throwable.getClass().getCanonicalName() + "@" + throwable.getMessage() --> storing observed exceptions
"$CUT@" + obj.getTypeAsName() + "@" + obj.getProducerIndex() -> storing object references (typically unit under test)
{} -> special handling for storing instance of type Object (i.e., new Object()) or Void
toJson(obj.getValue()) -> storing primitives and object types (note: certain object properties are typically retrieved as part of a test scenario)
```

---

## Summary

- SSN is column- and row-based, with strict positional semantics and cell reference support.
- Rows: Each row is an operation (method or constructor).
- Columns: Output (A), Operation (B), Target (C), Arguments (D+).
- Cell Notation: Use spreadsheet-style (e.g., `A3`).
- Expressions: Each cell can be a literal, parameter, cell ref, or code expression.
- Operation `create`: Special case for object construction.
- Parameters: Mark with `?name` and provide values at execution.

---

## Appendix

### (Partial) Formal EBNF Grammar for SSN

```ebnf
Sheet           = { Row } ;

Row             = OutputCell, OperationCell, TargetCell, { ArgumentCell }, Newline ;

OutputCell      = CellContent ;                         // Can be empty (implied by position in row)
OperationCell   = OperationName ;                       // E.g., "push", "create", "pop"
TargetCell      = TargetContent ;                       // E.g., A1, className
ArgumentCell    = CellContent ;                         // Repeated (0..N)

CellContent     = [ Expression ] ;                      // Expression OR empty for cells

OperationName   = "create" | Identifier ;               // Valid Java method names or 'create'

TargetContent   = CellReference | ClassName ;           // Reference (A1) or class name (for create)

CellReference   = ColumnLetter, RowNumber ;             // E.g., A1, B2 etc.
ClassName       = Identifier ;     // simple class

Expression      = JavaLiteral
                | JavaExpression
                | CellReference
                | ParameterReference                   // ?p1, ?param2
                ;

ParameterReference = "?", Identifier ;

JavaLiteral     = number | string | boolean | null ;
JavaExpression  = /* Any legal Java expression (for code, as a string) */ ;

ColumnLetter    = 'A'..'Z' ;
RowNumber       = digit, { digit } ;                   // 1..999

Identifier      = letter, { letter | digit | "_" } ;

Newline         = '\n' | '\r\n' ;
digit           = '0'..'9' ;
letter          = 'A'..'Z' | 'a'..'z' ;
```