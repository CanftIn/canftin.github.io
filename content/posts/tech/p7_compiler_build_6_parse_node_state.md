---
title: "从零构造现代语言编译器(6): Parse节点和状态"
date: 2023-10-03T10:32:32+08:00
lastmod: 2023-10-03T10:32:32+08:00
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


## 1. 节点类型


## 2. 解析状态

这些状态代表了解析器在处理输入代码时可能遇到的各种情况。以下是对这些状态的详细解释：

1. **IndexExpression**：处理索引表达式，如`a[0]`。
2. **IndexExpressionFinish**：完成索引表达式的处理。
3. **ArrayExpression**：处理数组表达式，如`[T; N]`。
4. **ArrayExpressionSemi**：处理数组表达式中的分号。
5. **ArrayExpressionFinish**：完成数组表达式的处理。
6. **BraceExpression**：处理大括号表达式的开始，如`{...}`。
7. **BraceExpressionParameter**：处理大括号表达式中的参数。
8. **BraceExpressionParameterAfterDesignator**：处理大括号表达式中的参数，该参数在一个指示符之后。
9. **BraceExpressionParameterFinish**：完成大括号表达式中的参数处理。
10. **BraceExpressionFinish**：完成大括号表达式的处理。
11. **CallExpression**：处理调用表达式，如`func(...)`。
12. **CallExpressionParameterFinish**：处理调用表达式中的参数后的逗号或括号。
13. **CallExpressionFinish**：完成调用表达式的处理。
14. **CodeBlock**：处理典型的代码块的开始，如`{...}`。
15. **CodeBlockFinish**：完成代码块的处理。
16. **DeclarationNameAndParams**：处理声明的名称和参数，如`Foo[...](...)`。
17. **DeclarationNameAndParamsAfterName**：处理声明名称后的部分。
18. **DeclarationNameAndParamsAfterDeduced**：处理推导参数后的部分。
19. **DeclarationScopeLoop**：处理声明范围内的内容。
20. **Period**：处理点操作，如`.`。
21. **ArrowExpression**：处理箭头表达式，如`->`。
22. **Expression**：处理表达式。
23. **ExpressionInPostfix**：处理后缀表达式的开始部分。
24. **ExpressionInPostfixLoop**：处理后缀表达式的循环部分。
25. **ExpressionLoop**：处理表达式的循环部分。
26. **IfExpression**：处理`if`表达式。
27. **ParenExpression**：处理括号内的表达式，如`(expr)`。
28. **Statement**：处理单个语句。
29. **StatementForHeader**：处理`for`循环头部。
30. **StatementIf**：处理`if`语句。
31. **StatementWhile**：处理`while`循环。
32. **TypeIntroducer**：处理类型的引入。
33. **Var**：处理`var`声明。

此外，还有一些宏定义，如`COCKTAIL_PARSE_STATE_VARIANT`和`COCKTAIL_PARSE_STATE_VARIANTS2`，它们用于生成更多的状态，这些状态是基于其他状态但带有某种变体的。

总的来说，这些状态为解析器提供了一个框架，使其能够根据输入代码的不同部分进行适当的处理。
