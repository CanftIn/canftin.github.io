---
title: "从零构造现代语言编译器(3): 诊断信息"
date: 2023-09-25T15:30:08+08:00
lastmod: 2023-09-25T15:30:08+08:00
author: ["矩木"]
keywords: 
- 
categories: # 没有分类界面可以不填写
- 
tags: # 标签
- 
description: ""
weight:
slug: ""
draft: false # 是否为草稿
comments: true # 本页面是否显示评论
reward: true # 打赏
mermaid: true #是否开启mermaid
showToc: true # 显示目录
TocOpen: true # 自动展开目录
hidemeta: false # 是否隐藏文章的元信息，如发布日期、作者等
disableShare: true # 底部不显示分享栏
showbreadcrumbs: true #顶部显示路径
cover:
    image: "" #图片路径例如：posts/tech/123/123.png
    zoom: # 图片大小，例如填写 50% 表示原图像的一半大小
    caption: "" #图片底部描述
    alt: ""
    relative: false
---

## 1. 什么是诊断

诊断信息（Diagnostics）在编程语言中，通常是编译器用来告诉程序员源代码中存在的问题的消息。这些问题可能包括语法错误、类型错误、未定义的符号、可能的运行时错误等。每种编译器都有自己的方式来显示这些信息。

GCC（GNU Compiler Collection）：GCC是一个开源的编译器套件，支持C、C++、Java、Fortran等多种语言。当GCC遇到错误时，它会输出错误信息，包含了错误的类型、发生错误的源文件和行号，以及可能的原因。例如：
```bash
test.c: In function 'main':
test.c:2:5: error: 'printf' undeclared (first use in this function)
     printf("Hello, World!\n");
     ^~~~~~
```
这个错误信息告诉我们在test.c文件的main函数中，第2行第5个字符处使用了未声明的printf（应该是printf）。

Clang：Clang是一个编译器前端，支持C语言、C++、Objective-C和Objective-C++编程语言。Clang的诊断信息相比GCC更为友好和详细，它会以易于理解的方式提供错误的上下文和修复建议。例如：
```bash
test.cpp:1:1: error: C++ requires a type specifier for all declarations
"Test"
^~~~
int
```
这个错误信息告诉我们在test.cpp文件的第1行第1个字符处缺少类型说明符，并建议添加int。

Rust：Rust是一种系统编程语言，注重安全、并发和内存效率。Rust编译器的诊断信息非常友好，包含了错误类型、发生错误的源文件和行号、错误的代码片段以及可能的解决方法。例如：
```c++
error[E0425]: cannot find value `foo` in this scope
 --> main.rs:2:5
  |
2 |     foo;
  |     ^^^ not found in this scope
```
这个错误信息告诉我们在main.rs文件的第2行第5个字符处找不到foo这个值。

以上都是简单的例子，实际的诊断信息可能会更复杂，包含更多的上下文和建议。

## 2. 诊断信息有哪些

Carbon定义了一系列诊断信息，用于在编译或运行时报告错误、警告或其他信息。这些诊断信息通常用于编译器、解释器或其他代码分析工具。诊断信息被分为几个不同的类别：

### 1. SourceBuffer diagnostics（源缓冲区诊断）

- `ErrorOpeningFile`: 打开文件时出错。
- `ErrorStattingFile`: 获取文件状态时出错。
- `FileTooLarge`: 文件太大。
- `ErrorReadingFile`: 读取文件时出错。

### 2. Lexer diagnostics（词法分析器诊断）

这部分包含了与词法分析有关的诊断信息，例如无效的数字、字符串未终止等。

- `BinaryRealLiteral`: 二进制实数字面量有问题，可能是格式错误。
- `ContentBeforeStringTerminator`: 在字符串终结符之前有额外的内容。
- `DecimalEscapeSequence`: 十进制转义序列有问题，可能是格式或值错误。
- `EmptyDigitSequence`: 数字序列为空，例如在一个预期应有数字的地方什么都没有。
- `HexadecimalEscapeMissingDigits`: 十六进制转义序列缺少必需的数字。
- `InvalidDigit`: 无效的数字字符，例如在十进制数中出现了非0-9的字符。
- `InvalidDigitSeparator`: 无效的数字分隔符，例如在数字中使用了不允许的字符作为分隔符。
- `InvalidHorizontalWhitespaceInString`: 在字符串中有无效的水平空白字符。
- `IrregularDigitSeparators`: 数字分隔符使用不规范，例如两个分隔符连续出现。
- `MismatchedClosing`: 不匹配的关闭符号，例如一个括号或引号没有与之匹配的开始符号。
- `MismatchedIndentInString`: 在多行字符串中，缩进不匹配。
- `MultiLineStringWithDoubleQuotes`: 使用双引号在多行字符串中可能是不允许的。
- `NoWhitespaceAfterCommentIntroducer`: 注释引导符（如`//`或`/*`）后面没有空白。
- `TooManyDigits`: 数字含有太多的位数，超出了处理能力。
- `TrailingComment`: 有尾随的注释，可能是在不应该出现注释的地方出现了注释。
- `UnicodeEscapeMissingBracedDigits`: Unicode转义序列缺少必需的括在大括号里的数字。
- `UnicodeEscapeSurrogate`: Unicode转义序列是一个代理项，这可能是不允许的。
- `UnicodeEscapeTooLarge`: Unicode转义序列中的值太大。
- `UnknownBaseSpecifier`: 未知的基数说明符，例如在数字前面有一个未知的前缀。
- `UnknownEscapeSequence`: 未知的转义序列，例如`\z`。
- `UnmatchedClosing`: 有一个不匹配的关闭符号，没有与之匹配的开始符号。
- `UnrecognizedCharacters`: 有无法识别的字符。
- `UnterminatedString`: 字符串没有正确终止，缺少结束引号。
- `WrongRealLiteralExponent`: 实数字面量的指数部分有误。

### 3. Parser diagnostics（语法分析器诊断）

- `BinaryOperatorRequiresWhitespace`: 二元运算符两侧需要空白字符。
- `ExpectedArraySemi`: 期望在数组定义或初始化中看到一个分号。
- `ExpectedCloseSymbol`: 期望一个关闭符号，如闭括号或闭花括号。
- `ExpectedCodeBlock`: 期望一个代码块，通常由花括号包围。
- `ExpectedExpression`: 期望一个表达式。
- `ExpectedIdentifierAfterDotOrArrow`: 在`.`或`->`后期望一个标识符。
- `ExpectedParameterName`: 期望一个参数名。
- `ExpectedParenAfter`: 在某个元素后期望一个括号。
- `ExpectedExpressionSemi`: 在表达式后期望一个分号。
- `ExpectedStatementSemi`: 在语句后期望一个分号。
- `ExpectedStructLiteralField`: 期望一个结构体字面量字段。
- `ExpectedVariableDeclaration`: 期望一个变量声明。
- `ExpectedVariableName`: 期望一个变量名。
- `OperatorRequiresParentheses`: 运算符需要括号。
- `StatementOperatorAsSubexpression`: 语句运算符用作子表达式。
- `UnaryOperatorRequiresParentheses`: 一元运算符需要括号。
- `UnaryOperatorHasWhitespace`: 一元运算符后有空白。
- `UnaryOperatorRequiresWhitespace`: 一元运算符需要空白。
- `UnexpectedTokenAfterListElement`: 列表元素后出现意外的令牌。
- `UnrecognizedDeclaration`: 无法识别的声明。

包相关诊断（Package-related diagnostics）

- `ExpectedIdentifierAfterPackage`: 在`package`关键字后期望一个标识符。
- `ExpectedLibraryName`: 期望一个库名。
- `MissingLibraryKeyword`: 缺少`library`关键字。
- `ExpectedApiOrImpl`: 期望`api`或`impl`。

For循环特定诊断（For-specific diagnostics）

- `ExpectedIn`: 在`for`循环中期望`in`关键字。
- `ExpectedInNotColon`: 期望`in`而不是冒号。

If条件特定诊断（If-specific diagnostics）

- `ExpectedThenAfterIf`: 在`if`后期望`then`。
- `ExpectedElseAfterIf`: 在`if`后期望`else`。

声明诊断（Declaration diagnostics）

- `ExpectedDeclarationName`: 期望一个声明名。
- `ExpectedDeclarationSemi`: 在声明后期望一个分号。
- `ExpectedDeclarationSemiOrDefinition`: 在声明后期望一个分号或定义。
- `MethodImplNotAllowed`: 方法实现不允许。
- `ParametersRequiredByIntroducer`: 引入者需要参数。
- `ParametersRequiredByDeduced`: 由推导出的类型需要参数。

### 4. Semantics diagnostics（语义诊断）

这部分包含了与代码语义有关的诊断信息，例如类型不匹配、数组越界等。

这些都是用于在语义分析阶段报告各种类型的错误或警告的诊断标识符。语义分析通常涉及类型检查、作用域解析等。下面是对每个标识符可能代表的含义的解释：

- `SemanticsTodo`: 一个占位符，用于标记尚未实现的语义检查。
- `AddressOfEphemeralReference`: 尝试获取短暂引用（例如，函数返回值）的地址。
- `AddressOfNonReference`: 尝试获取非引用类型的地址。
- `ArrayInitFromLiteralArgCountMismatch`: 数组从字面量初始化时，参数数量不匹配。
- `ArrayInitFromExpressionArgCountMismatch`: 数组从表达式初始化时，参数数量不匹配。
- `AssignmentToNonAssignable`: 尝试给不可赋值的对象（例如，常量或表达式）赋值。
- `DereferenceOfNonPointer`: 尝试解引用非指针类型。
- `DereferenceOfType`: 尝试解引用一个类型（而不是变量或表达式）。
- `NameNotFound`: 找不到指定的名称（变量、函数等）。
- `NameDeclarationDuplicate`: 名称声明重复。
- `NameDeclarationPrevious`: 名称在之前已经被声明。
- `CallArgCountMismatch`: 函数调用的参数数量不匹配。
- `InCallToFunction`: 在对函数的调用中有问题。
- `InCallToFunctionParam`: 在对函数参数的处理中有问题。
- `MissingReturnStatement`: 缺少返回语句。
- `RepeatedConst`: `const`关键字被重复使用。
- `InvalidArrayExpression`: 无效的数组表达式。
- `TypeNotIndexable`: 尝试索引一个不可索引的类型。
- `IndexOutOfBounds`: 数组或其他可索引对象的索引越界。
- `TupleIndexIntegerLiteral`: 元组索引必须是整数字面量。
- `ReturnStatementDisallowExpression`: 返回语句中不允许有表达式。
- `ReturnStatementImplicitNote`: 返回语句有隐式的注意事项（可能是类型推断或其他）。
- `ReturnStatementMissingExpression`: 返回语句缺少表达式。
- `ImplicitAsConversionFailure`: 隐式转换失败。
- `QualifiedDeclarationInNonScope`: 在非作用域内有限定声明。
- `QualifiedDeclarationNonScopeEntity`: 限定声明不是作用域实体。
- `QualifiedExpressionUnsupported`: 不支持限定表达式。
- `QualifiedExpressionNameNotFound`: 限定表达式中找不到名称。
- `UseOfNonExpressionAsValue`: 尝试将非表达式用作值。

### 5.  Other diagnostics（其他诊断）

- `COCKTAIL_DIAGNOSTIC_KIND(TestDiagnostic)`: 仅用于单元测试的诊断。
- `COCKTAIL_DIAGNOSTIC_KIND(TestDiagnosticNote)`: 仅用于单元测试的诊断注释。

## 3. 诊断信息模块构建

责任链模式

