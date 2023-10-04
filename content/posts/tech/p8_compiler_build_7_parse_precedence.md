---
title: "P8_compiler_build_7_parse_precedence"
date: 2023-10-03T11:20:53+08:00
lastmod: 2023-10-03T11:20:53+08:00
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

# 表达式

<!--
Carbon 语言项目的一部分，遵循 Apache License v2.0 和 LLVM 异常条款。
请查看 /LICENSE 以获取许可信息。
SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
-->

<!-- toc -->

## 目录

- [表达式](#表达式)
  - [目录](#目录)
  - [概述](#概述)
  - [优先级](#优先级)
  - [名称](#名称)
    - [非限定名称](#非限定名称)
    - [限定名称和成员访问](#限定名称和成员访问)
  - [操作符](#操作符)
  - [转换和类型转换](#转换和类型转换)
  - [`if` 表达式](#if-表达式)
  - [数值类型文字表达式](#数值类型文字表达式)
  - [考虑的替代方案](#考虑的替代方案)
  - [参考文献](#参考文献)

<!-- tocstop -->

## 概述

表达式是 Carbon 语法中产生值的部分。因为在 Carbon 中，类型是值，所以这包括指定类型的任何地方。

```
fn Foo(a: i32*) -> i32 {
  return *a;
}
```

这里，参数类型 `i32*`、返回类型 `i32` 和 `return` 语句的操作数 `*a` 都是表达式。

## 优先级

表达式基于部分[优先级排序](https://en.wikipedia.org/wiki/Order_of_operations)进行解释。
缺少相对排序的表达式组件必须由开发者进行消歧，例如通过添加括号；否则，由于模糊性，表达式将无效。
只有当大多数开发者在没有括号的情况下都能理解优先级时，才会添加优先级排序。

优先级图定义如下：

```mermaid
... (此处省略了图的内容，因为它是图形内容，不适合文字翻译)
```

图的属性包括：

- 每个非空节点代表一个优先级组。空圈用于简化图形，并不代表优先级组。

- 当一个表达式由不同的优先级组组成时，解释由优先级边确定：

  - 优先级边 A --> B 表示 A 的优先级低于 B，所以 A 可以不用括号包含 B。例如，`or --> not` 表示 `not x or y` 被视为 `(not x) or y`。

  - 优先级边是传递的。例如，`or --> == --> as` 表示 `or` 的优先级低于 `as`。

- 当一个二元操作符表达式由单个优先级组组成时，解释由优先级组的[结合性](https://en.wikipedia.org/wiki/Operator_associativity)确定：

  ```mermaid
  graph TD
      non["非结合性"]
      left["左结合性"]
  ```

  - 例如，`+` 和 `-` 是左结合的，并且在同一个优先级组中，所以 `a + b + c - d` 被视为 `((a + b) + c) - d`。

  - 注意，在 Carbon 中，我们目前只有左结合操作符。与 C++ 和其他语言不同，[赋值](/docs/design/assignment.md)不是右结合操作符，它使用自己的语句。

- 当一个一元操作符表达式由单个优先级组组成时，它可以允许不带括号的重复或不允许：

  ```mermaid
  graph TD
      non["非重复"]
      repeating["重复"]
  ```

  这与二元操作符的结合性类似。

## 名称

### 非限定名称

_非限定名称_ 是一个[单词](../lexical_conventions/words.md)，它不是关键字，并且前面没有句点(`.`)。

**待办事项:** 非限定名称的名称查找规则。

### 限定名称和成员访问

_限定名称_ 是一个单词，它紧跟在句点或向右的箭头后面。限定名称出现在以下上下文中：

- [指定符](/docs/design/classes.md#literals)：`.` _单词_
- [简单成员访问表达式](member_access.md)：_表达式_ `.` _单词_
- [简单指针成员访问表达式](member_access.md)：_表达式_ `->` _单词_

```
var x: auto = {.hello = 1, .world = 2};
                ^^^^^       ^^^^^ 限定名称
               ^^^^^^      ^^^^^^ 指定符

x.hello = x.world;
  ^^^^^     ^^^^^ 限定名称
^^^^^^^   ^^^^^^^ 成员访问表达式

x.hello = (&x)->world;
                ^^^^^ 限定名称
          ^^^^^^^^^^^ 指针成员访问表达式
```

限定名称引用由表达式出现的上下文确定的实体的成员。对于成员访问，实体由句点前的表达式命名。在结构字面量中，实体是结构类型。例如：

```
package Foo api;
namespace N;
fn N.F() {}

fn G() {
  // 与 `(Foo.N).F()` 相同。
  // `Foo.N` 命名包 `Foo` 中的命名空间 `N`。
  // `(Foo.N).F` 命名命名空间 `

N` 中的函数 `F`。
  Foo.N.F();
}

// `.n` 引用 `{.n: i32}` 的成员 `n`。
fn H(a: {.n: i32}) -> i32 {
  // `a.n` 解析为成员 `{.n: i32}.n`，
  // 并命名 `a` 的相应子对象。
  return a.n;
}

fn J() {
  // `.n` 引用 `{.n: i32}` 的成员 `n`。
  H({.n = 5 as i32});
}
```

成员访问表达式从左到右关联。如果成员名称比单个 _单词_ 更复杂，可以使用带有括号的成员名称的复合成员访问表达式：

- _表达式_ `.` `(` _表达式_ `)`
- _表达式_ `->` `(` _表达式_ `)`

```
interface I { fn F[self: Self](); }
class X {}
impl X as I { fn F[self: Self]() {} }

// `x.I.F()` 将意味着 `(x.I).F()`。
fn Q(x: X) { x.(I.F)(); }
```

简单或复合成员访问可以是 _指针_ 成员访问表达式的一部分，当使用 `->` 而不是 `.` 时，其中 _表达式_ `->` _..._ 是 `(` `*` _表达式_ `)` `.` _..._ 的语法糖。

## 操作符

大多数表达式都被建模为操作符：

| 类别       | 操作符                              | 语法      | 功能                                                                      |
| ---------- | ----------------------------------- | --------- | ------------------------------------------------------------------------- |
| 指针       | [`*`](pointer_operators.md) (一元)  | `*x`      | 指针解引用：由 `x` 指向的对象。                                            |
| 指针       | [`&`](pointer_operators.md) (一元)  | `&x`      | 地址：指向对象 `x` 的指针。                                                |
| 算术       | [`-`](arithmetic.md) (一元)         | `-x`      | `x` 的负数。                                                              |
| 位运算     | [`^`](bitwise.md) (一元)            | `^x`      | `x` 的位补数。                                                            |
| 算术       | [`+`](arithmetic.md)                | `x + y`   | `x` 和 `y` 的和。                                                         |
| 算术       | [`-`](arithmetic.md) (二元)         | `x - y`   | `x` 和 `y` 的差。                                                         |
| 算术       | [`*`](arithmetic.md)                | `x * y`   | `x` 和 `y` 的乘积。                                                       |
| 算术       | [`/`](arithmetic.md)                | `x / y`   | `x` 除以 `y`，或其商。                                                    |
| 算术       | [`%`](arithmetic.md)                | `x % y`   | `x` 对 `y` 的模。                                                         |
| 位运算     | [`&`](bitwise.md)                   | `x & y`   | `x` 和 `y` 的位与。                                                       |
| 位运算     | [`\|`](bitwise.md)                  | `x \| y`  | `x` 和 `y` 的位或。                                                       |
| 位运算     | [`^`](bitwise.md) (二元)            | `x ^ y`   | `x` 和 `y` 的位异或。                                                     |
| 位运算     | [`<<`](bitwise.md)                  | `x << y`  | `x` 左移 `y` 位。                                                         |
| 位运算     | [`>>`](bitwise.md)                  | `x >> y`  | `x` 右移 `y` 位。                                                         |
| 转换       | [`as`](as_expressions.md)           | `x as T`  | 将值 `x` 转换为类型 `T`。                                                 |
| 比较       | [`==`](comparison_operators.md)     | `x == y`  | 相等：如果 `x` 等于 `y`，则为 `true`。                                    |
| 比较       | [`!=`](comparison_operators.md)     | `x != y`  | 不等：如果 `x` 不等于 `y`，则为 `true`。                                  |
| 比较       | [`<`](comparison_operators.md)      | `x < y`   | 小于：如果 `x` 小于 `y`，则为 `true`。                                    |
| 比较       | [`<=`](comparison_operators.md)     | `x <= y`  | 小于或等于：如果 `x` 小于或等于 `y`，则为 `true`。                         |
| 比较       | [`>`](comparison_operators.md)      | `x > y`   | 大于：如果 `x` 大于 `y`，则为 `true`。                                    |
| 比较       | [`>=`](comparison_operators.md)     | `x >= y`  | 大于或等于：如果 `x` 大于或等于 `y`

，则为 `true`。                         |
| 逻辑       | [`and`](logical_operators.md)       | `x and y` | 短路逻辑与：如果两个操作数都为 `true`，则为 `true`。                       |
| 逻辑       | [`or`](logical_operators.md)        | `x or y`  | 短路逻辑或：如果任一操作数为 `true`，则为 `true`。                         |
| 逻辑       | [`not`](logical_operators.md)       | `not x`   | 逻辑非：如果操作数为 `false`，则为 `true`。                                |

二元算术和位运算操作符还有[复合赋值](/docs/design/assignment.md)形式。这些是语句而不是表达式，并且不产生值。

## 转换和类型转换

当表达式出现在需要特定类型的表达式的上下文中时，将应用[隐式转换](implicit_conversions.md)将表达式转换为目标类型。

表达式也可以使用[`as` 表达式](as_expressions.md)转换为特定类型。

```
fn Bar(n: i32);
fn Baz(n: i64) {
  // OK，与 Bar(n as i32) 相同
  Bar(n);
}
```

## `if` 表达式

[`if` 表达式](if.md)在两个表达式之间进行选择。

```
fn Run(args: Span(StringView)) {
  var file: StringView = if args.size() > 1 then args[1] else "/dev/stdin";
}
```

`if` 表达式与 C 和 C++ 中的 `?:` 三元表达式类似。

## 数值类型文字表达式

Carbon 的语法提供了一种简单的方法来表示不同类型的整数和浮点数。每种类型都用类似关键字的语法标识，前缀为 `i`、`u` 或 `f`，后跟 8 的倍数，表示数据类型的位大小。

这些被称为[数值类型文字](literals.md#numeric-type-literals)。

## 考虑的替代方案

其他表达式文档将列出更多的替代方案；此处列出的替代方案在其他地方没有提及。

- [总顺序](/proposals/p0555.md#total-order)
- [不同操作数的不同优先级](/proposals/p0555.md#different-precedence-for-different-operands)
- [要求少于部分顺序](/proposals/p0555.md#require-less-than-a-partial-order)

## 参考文献

其他表达式文档将列出更多的参考文献；此处列出的参考文献在其他地方没有提及。

- 提案
    [#555: 操作符优先级](https://github.com/carbon-language/carbon-lang/pull/555)。

这是使用 markdown 输出格式的中文全文翻译。您还想知道什么？

{{< mermaid >}}
%%{init: {'themeVariables': {'fontFamily': 'monospace'}}}%%
graph BT
    parens["(...)"]

    braces["{...}"]
    click braces "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/classes.md#literals"

    unqualifiedName["x"]
    click unqualifiedName "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/README.md#unqualified-names"

    top((" "))

    memberAccess>"x.y<br>
                  x.(...)<br>
                  x->y<br>
                  x->(...)"]
    click memberAccess "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/member_access.md"

    constType["const T"]
    click pointer-type "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/type_operators.md"

    pointerType{"T*"}
    click pointer-type "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/type_operators.md"

    pointer{"*x<br>
             &x<br>"}
    click pointer "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/pointer.md"

    negation["-x"]
    click negation "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/arithmetic.md"

    complement["^x"]
    click complement "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/bitwise.md"

    incDec["++x;<br>--x;"]
    click incDec "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/assignment.md"

    unary((" "))

    as["x as T"]
    click as "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/implicit_conversions.md"

    multiplication>"x * y<br>
                    x / y"]
    click multiplication "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/arithmetic.md"

    addition>"x + y<br>
              x - y"]
    click addition "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/arithmetic.md"

    modulo["x % y"]
    click modulo "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/arithmetic.md"

    bitwise_and>"x & y"]
    bitwise_or>"x | y"]
    bitwise_xor>"x ^ y"]
    click bitwise_and "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/bitwise.md"
    click bitwise_or "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/bitwise.md"
    click bitwise_xor "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/bitwise.md"

    shift["x << y<br>
           x >> y"]
    click shift "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/bitwise.md"

    comparison["x == y<br>
                x != y<br>
                x < y<br>
                x <= y<br>
                x > y<br>
                x >= y"]
    click comparison "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/comparison_operators.md"

    not["not x"]
    click not "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/logical_operators.md"

    logicalOperand((" "))

    and>"x and y"]
    click and "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/logical_operators.md"

    or>"x or y"]
    click or "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/logical_operators.md"

    logicalExpression((" "))

    if>"if x then y else z"]
    click if "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/expressions/if.md"

    insideParens["(...)"]

    assignment["x = y;<br>x $= y;"]
    click assignment "https://github.com/carbon-language/carbon-lang/blob/trunk/docs/design/assignment.md"

    expressionStatement["x;"]

    top --> parens & braces & unqualifiedName

    constType --> top
    pointerType --> constType
    as --> pointerType

    memberAccess --> top
    pointer --> memberAccess
    negation & complement & incDec --> pointer
    unary --> negation & complement
    %% Use a longer arrow here to put `not` next to `and` and `or`.
    not -------> memberAccess
    as & multiplication & modulo & bitwise_and & bitwise_or & bitwise_xor & shift --> unary
    addition --> multiplication
    comparison --> as & addition & modulo & bitwise_and & bitwise_or & bitwise_xor & shift
    logicalOperand --> comparison & not
    and & or --> logicalOperand
    logicalExpression --> and & or
    if & expressionStatement --> logicalExpression
    insideParens & assignment --> if
{{< /mermaid >}}
