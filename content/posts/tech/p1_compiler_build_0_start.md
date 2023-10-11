---
title: "从零构造现代语言编译器(0): C++后继语言"
date: 2023-09-21T12:33:27+08:00
lastmod: 2023-09-21T12:33:27+08:00
author: ["CanftIn"]
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

## 1. carbon-lang介绍

自去年（2020.7）Chandler Carruth 作为 Google 的 tech leader 官方宣布 Carbon 语言，这个项目在 github 上热度一度飙升，至今已有30k+的 star。

Carbon 作为一个实验性的通用编程语言，旨在成为“C++的后继语言”<sup>[[1](#references-anchor)]</sup>，目前（2023.10）仍在项目孵化期中，预计2-3年内结束实验<sup>[[2](#references-anchor)]</sup>，Carbon 由于它的设计和目标，实现编译器会具有非常大难度与挑战性，因而 Chandler 将它作为一个 long-term 的开发项目，预期在2026年发布1.0版本。

但即使是可能要在比较长的时间后才能看到生产可用的版本，目前的 Carbon 仓库代码也仍然值得学习，包含非常多足够现代的 C++ 实现方式，本系列文章就从 Carbon 开始，介绍并分析一个完整的现代语言编译器的实现过程，以及它背后的设计思想。

Carbon 官方项目选择 Bazel 构建工具，一方面是因为 Google 内部工具链的高可用性，相比于 Go 语言早期手搓 Makefile 的构建方式，Carbon 语言选用更加现代的工具链作为构建工具，另一方面也由于 Google 在LLVM之上的积累和贡献<sup>[[3](#references-anchor)]</sup>，LLVM 目前仓库中 Bazel 构建方式由 Google 团队完成及合并（不过存在一些 build 的问题<sup>[[4](#references-anchor)]</sup>，并且随着 llvm 的版本迭代常需要对 Bazel 进行一些 patch）。

我提供了一个 Fork 于 Carbon 所修改的仓库：[https://github.com/CanftIn/cocktail-lang](https://github.com/CanftIn/cocktail-lang)，为深入剖析现代编译器前端实现，一步一步进行其中的构建，项目按照LLVM仓库主流构建方式和代码结构组织，后续的系列文章也按这个仓库和 Carbon 官方仓库共同进行讲解。

该项目在Ubuntu 22.04系统环境下测试完成，其他环境暂未测试。

## 2. C++后继语言元年

2022年被称为 C++ 后继语言（successor languages）元年。三种可能的继任者语言在 C++ 的主要会议上的主题演讲中被宣布。

首先，Dave Abrahams 和 Dimitri Racordon 在 C++ Now 上宣布了 Val 语言（后更名为hylo-lang）。Val 的核心思想是，人们可以使用可变的值语义来构建安全、高效的程序。

两个月后，Chandler Carruth 在 CppNorth 上宣布了 Carbon 语言。Carbon 语言试图解决 C++ 的几个问题：数十年的技术债务，对向后兼容性的优先考虑以及 C++ 的演变过程。

再过两个月，在 CppCon 上，Herb Sutter 宣布了 CppFront，作为 C++ 的可能继任者。他的主要目标是“加强 C++ 自身，并双倍重视 C++”，防止用户迁移到其他语言。宣称的目标是使 C++ 更安全50倍，更简单10倍。

而早在更早之前 github 上的项目 circle 就完成了很多 C++ 之上的现代语言特性。

**为什么 C++ 存在近40年仍然经久不衰？**

C++ 是一种特殊的编程语言，具有多种编程范式。它是最常用的编程语言之一，但也是最受批评的语言之一。热爱 C++ 的人备受喜爱，但更多的人都抱怨这门语言太大、太复杂，既有不必要的功能，又缺乏足够的功能。过于概括地说，C++ 似乎是一系列随机的功能组合，没有一个清晰连贯的主线。

Bjarne Stroustrup 为了辩护这门语言说："within C++, there is a much smaller and cleaner language struggling to get out"（在 C++ 中，有一个更小、更干净的语言努力地想要脱颖而出）。尽管这句话旨在为 C++ 辩护，但仔细回想后会发现它也是一种隐含的批评：C++ 仍然没有成为人们期望的那种更小、更干净的语言。

C++ 的标准委员会一直在不断地改进这门语言。但是这也意味着 C++ 积累了大量的技术债务。这部分是因为标准委员会一直在试图修复这门语言的错误，部分是因为技术进步导致了新的需求。为了避免破坏现有的代码，C++ 标准委员会非常重视向后兼容性。这意味着新版本的 C++ 通常不能删除旧的或过时的功能。此外，C++ 标准委员会的工作方式导致了 C++ 形成了一个缓慢的演变过程。新功能必须经过多年的实验和讨论才能被添加到标准中。

所以，主要的问题是：如何得到一门比现有的C++更简单、更干净，而且在系统编程领域的更好的语言？C++的继任者应该是什么样子的？

**那么什么是后继语言？**

- 相较于 C++，这是一种具有更少缺陷/错误的语言。
- 与 C++ 相比，这是一种具有友好特性的语言。
- 这是一种会比 C++ 更安全、更清晰、更高效的语言。
- 这是一种与现有 C++ 代码广泛兼容的语言（兼容方式可能是Subset/Superset/Overlap）：

![p1_cpp_intersection](/img/post_pic/p1_cpp_intersection.png)

后继语言这个目标对于 C++ 来说是很值得尝试的目标，上面这张图也表示了去实现 C++ 后继语言的方式，新语言作为 C++ 的子集或者超集又或者它们之间互有交叉。

引发出来的一个问题是，为了实现新语言，发明新的编译器是否富有成效或价值？Carbon 就是这样一个实验性项目，通过发展现有的 C++ 工具链如 LLVM 和 Clang 来实现新语言。Carbon 试图解决 C++ 的几个问题：

- 数十年的技术债务
- 对向后兼容性的优先考虑
- C++ 的演变过程

Carbon 还提出了新的目标：
- 默认快速：与 C++ 相比，Carbon 代码应该至少同样快。
- 默认安全：与Rust不同，Carbon 的设计师没有试图创造一个绝对安全的语言。而是创造一个默认安全的语言。
- 简单：删除了一些已经过时的功能，例如宏、模板、继承和异常，并引入了新的功能，例如类型推导和类型类。

尽管 Carbon 有许多有趣的想法，但它还需要经过时间的考验。特别是其简化 C++ 的目标，这可能是一个很大的挑战，因为 C++ 是一个非常复杂的语言。

Carbon 作为 C++ 后继语言采用的策略并非上面的 intersection 是 C++ interop，即和现有的 C++ 代码进行交互，Carbon 与 C++ 之间具有互操作能力，类似于 TypeScript 之于 JavaScript、Kotlin 之于 Java、Swift 之于 Object-C，一个新语言的发展离不开一个性能优秀的编译器或解释器，但更重要的是语言之上的生态，为了成功，任何希望替代 C++ 的语言都必须与 C++ 有很好的互操作性，这也是 Carbon 的目标。Carbon 期望能利用现有 C++ 的生态的同时，去实践更多语言上的目标。

![p1_cpp_interop](/img/post_pic/p1_cpp_interop.png)

## 3. Cocktail CMake项目结构

首先从0到1构建CMake项目结构，参照clang的项目结构，初版结构链接：[project_structure](https://github.com/CanftIn/carbon-blog/tree/master/code/project_structure/section1)。

其中 include 作为Cocktail的头文件目录，lib 作为 Cocktail 的库文件目录，其中 C++ 文件一律以 `.cc` 作为后缀，unittests 作为 Cocktail 单元测试文件目录，并且其中单元测试一律以 `.t.cc` 作为后缀，单元测试依赖头文件以 `.t.h` 为后缀。

在主目录下 `CMakeList.txt` 文件中可以看到这条 `add_compile_options(-fno-rtti)` 编译选项，这里表明禁用 C++ 的 RTTI 特性，由于 LLVM 实现了自己的一套 RTTI 机制，此处加入该选项禁用。

项目依赖于 LLVM，CMake 中 `set(LLVM_DIR /usr/lib/llvm-15/lib/cmake/llvm)` 设置 LLVM 路径，需要按 readme 介绍使用 apt 包管理安装 `llvm-15-dev`（项目开始暂不手动构建 LLVM），LLVM 默认 CMake 路径为 `/usr/lib/llvm-15/lib/cmake/llvm`。

同时需要加入如下条件使得项目完成 LLVM 的引入：

```CMake
find_package(LLVM REQUIRED CONFIG)

include_directories(${LLVM_INCLUDE_DIRS})
add_definitions(${LLVM_DEFINITIONS})
```

关于内存泄漏检查，使用valgrind工具，可将其加入ctest中，对编译出的二进制目标进行测试：
```CMake
find_program(CMAKE_MEMORYCHECK_COMMAND valgrind)
set(memcheck_command ${CMAKE_MEMORYCHECK_COMMAND} ${CMAKE_MEMORYCHECK_COMMAND_OPTIONS} --error-exitcode=1 --leak-check=full)

add_test(${FILE_NAME}-memory-check ${memcheck_command} ./${FILE_NAME})
```

### 3.1 clang-format使用

clang-format作为LLVM官方提供的自动格式化工具，能够格式化排版C++代码，统一代码样式，本仓库代码一律使用官方.clang-format<sup>[[5](#references-anchor)]</sup>配置。

### 3.2 clang-tidy使用

clang-tidy作为C++的静态检查工具，因为它基于AST，比基于正则表达式的静态检查工具更为精准。本仓库代码一律使用官方.clang-tidy<sup>[[6](#references-anchor)]</sup>配置。

### 3.3 项目调试的前置知识

由于本项目基于LLVM，需要用到诸如StringRef、SmallVector等LLVM基础工具，在使用lldb vscode前端调试时存在难以打印的问题，这里需要引入LLVM官方仓库中lldbDataFormatters插件<sup>[[7](#references-anchor)]</sup>，得以直观显示LLVM数据结构。


<div id="references-anchor"></div>

## 4. 引用

- [1] : [“C++的后继语言”](https://en.wikipedia.org/wiki/Carbon_(programming_language))

- [2] : [实验](https://github.com/carbon-language/carbon-lang/blob/trunk/docs/project/roadmap.md)

- [3] : [贡献](https://github.com/google/llvm-bazel)

- [4] : [年久失修的问题](https://github.com/llvm/llvm-project/issues/62360)

- [5] : [.clang-format](https://github.com/carbon-language/carbon-lang/blob/trunk/.clang-format)

- [6] : [.clang-tidy](https://github.com/carbon-language/carbon-lang/blob/trunk/.clang-tidy)

- [7] : [lldbDataFormatters插件](https://github.com/llvm/llvm-project/blob/main/llvm/utils/lldbDataFormatters.py)

- [8] : [https://accu.org/journals/overload/30/172/teodorescu/](https://accu.org/journals/overload/30/172/teodorescu/)
