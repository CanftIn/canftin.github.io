---
title: "从零构造现代语言编译器(0): 开始"
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

## carbon-lang介绍

Carbon作为一个实验性的通用编程语言，旨在成为“C++的后继语言”<sup>[[1](#references-anchor)]</sup>，目前仍在Google的项目孵化期中，预计2-3年内结束实验<sup>[[2](#references-anchor)]</sup>。

Carbon官方项目选择Bazel构建工具，一方面是因为Google内部工具链的高可用性，相比于Go语言早期构建方式，作为同样出自Google之手的Carbon语言，避免手搓Makefile的繁琐，选用更加现代的工具链作为构建工具，另一方面也由于Google在LLVM之上的积累和贡献<sup>[[3](#references-anchor)]</sup>，LLVM目前仓库中Bazel构建方式由Google团队完成及合并（不过经过测试发现，存在年久失修的问题<sup>[[4](#references-anchor)]</sup>）。

## 本项目介绍及依赖安装

本项目基于Carbon，为深入剖析现代编译器前端实现以及LLVM工具链上层使用，一步一步实现名为Cocktail（鸡尾酒）的语言，代码协议遵从官方仓库Lisence<sup>[[5](#references-anchor)]</sup>，项目按照LLVM仓库主流构建方式和代码结构组织，使用CMake、Google test、Google mock等工具完成。

本项目在Ubuntu 22.04系统环境下测试完成，其他环境暂未测试，需要安装的依赖环境参考如下命令：

```bash
sudo apt-get install cmake g++ clang bison flex libgtest-dev libgmock-dev make valgrind libbenchmark-dev llvm-15-dev
```

## CMake项目结构

首先从0到1构建CMake项目结构，参照clang的项目结构，[project_structure](/code/project_structure/section1)代码如下：

```bash
.
├── CMakeLists.txt
├── include
│   └── Cocktail
│       └── Lexer
│           └── Basic.h
├── lib
│   └── Lexer
│       └── Basic.cc
└── unittests
    ├── CMakeLists.txt
    └── Lexer
        ├── Basic.t.cc
        └── CMakeLists.txt
```

其中include作为Cocktail的头文件目录，lib作为Cocktail的库文件目录，其中C++文件一律以`.cc`作为后缀，unittests作为Cocktail单元测试文件目录，并且其中单元测试一律以`.t.cc`作为后缀，单元测试依赖头文件以`.t.h`为后缀。

可在该目录下执行如下命令完成构建（make），或自行选用Ninja build：

```bash
> mkdir build
> cd build
> cmake ..
> make -j$(nproc)
> ctest -j$(nproc)
```

cmake构建结果如下：
```bash
-- The C compiler identification is GNU 11.3.0
-- The CXX compiler identification is GNU 11.3.0
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Check for working C compiler: /usr/bin/cc - skipped
-- Detecting C compile features
-- Detecting C compile features - done
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Check for working CXX compiler: /usr/bin/c++ - skipped
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Project: 'cocktail'
-- Performing Test HAVE_FFI_CALL
-- Performing Test HAVE_FFI_CALL - Success
-- Found FFI: /usr/lib/x86_64-linux-gnu/libffi.so  
-- Performing Test Terminfo_LINKABLE
-- Performing Test Terminfo_LINKABLE - Success
-- Found Terminfo: /usr/lib/x86_64-linux-gnu/libtinfo.so  
-- Found ZLIB: /usr/lib/x86_64-linux-gnu/libz.so (found version "1.2.11") 
-- Found LibXml2: /usr/lib/x86_64-linux-gnu/libxml2.so (found version "2.9.13") 
-- Looking for pthread.h
-- Looking for pthread.h - found
-- Performing Test CMAKE_HAVE_LIBC_PTHREAD
-- Performing Test CMAKE_HAVE_LIBC_PTHREAD - Success
-- Found Threads: TRUE
-- unittest files found: Basic.t.cc
-- Configuring done
-- Generating done
-- Build files have been written to: /carbon-blog/code/project_structure/build
```

make构建结果如下：
```bash
[ 25%] Building CXX object CMakeFiles/cocktail.dir/lib/Lexer/Basic.cc.o
[ 50%] Linking CXX static library libcocktail.a
[ 50%] Built target cocktail
[ 75%] Building CXX object unittests/Lexer/CMakeFiles/Basic.t.dir/Basic.t.cc.o
[100%] Linking CXX executable Basic.t
[100%] Built target Basic.t
```

ctest构建结果如下：
```bash
Test project /carbon-blog/code/project_structure/build
    Start 1: Basic.t
1/2 Test #1: Basic.t ..........................   Passed    0.01 sec
    Start 2: Basic.t-memory-check
2/2 Test #2: Basic.t-memory-check .............   Passed    0.97 sec

100% tests passed, 0 tests failed out of 2

Total Test time (real) =   0.98 sec
```

## 介绍CMake构建文件

在主目录下`CMakeList.txt`文件中可以看到这条`add_compile_options(-fno-rtti)`编译选项，这里表明禁用C++的RTTI特性，由于LLVM实现了自己的一套RTTI机制，此处加入该选项禁用。

`set(LLVM_DIR /usr/lib/llvm-15/lib/cmake/llvm)`设置LLVM路径，由于上述使用apt包管理安装llvm-15-dev，LLVM默认CMake路径为`/usr/lib/llvm-15/lib/cmake/llvm`。

同时需要加入如下条件使得项目完成LLVM的引入：

```CMake
find_package(LLVM REQUIRED CONFIG)

include_directories(${LLVM_INCLUDE_DIRS})
add_definitions(${LLVM_DEFINITIONS})
```

关于内存泄漏检查，使用valgrind工具，将其加入ctest中，对编译出的二进制目标进行测试：
```CMake
find_program(CMAKE_MEMORYCHECK_COMMAND valgrind)
set(memcheck_command ${CMAKE_MEMORYCHECK_COMMAND} ${CMAKE_MEMORYCHECK_COMMAND_OPTIONS} --error-exitcode=1 --leak-check=full)

add_test(${FILE_NAME}-memory-check ${memcheck_command} ./${FILE_NAME})
```

## clang-format使用

clang-format作为LLVM官方提供的自动格式化工具，能够格式化排版C++代码，统一代码样式，本仓库代码一律使用官方.clang-format<sup>[[6](#references-anchor)]</sup>配置。

## clang-tidy使用

clang-tidy作为C++的静态检查工具，因为它基于AST，比基于正则表达式的静态检查工具更为精准。本仓库代码一律使用官方.clang-tidy<sup>[[7](#references-anchor)]</sup>配置。

## 项目调试的前置知识

由于本项目基于LLVM，需要用到诸如StringRef、SmallVector等LLVM基础工具，在使用lldb vscode前端调试时存在难以打印的问题，这里需要引入LLVM官方仓库中lldbDataFormatters插件<sup>[[8](#references-anchor)]</sup>，得以直观显示LLVM数据结构。


<div id="references-anchor"></div>

## 引用

- [1] : [“C++的后继语言”](https://en.wikipedia.org/wiki/Carbon_(programming_language))

- [2] : [实验](https://github.com/carbon-language/carbon-lang/blob/trunk/docs/project/roadmap.md)

- [3] : [贡献](https://github.com/google/llvm-bazel)

- [4] : [年久失修的问题](https://github.com/llvm/llvm-project/issues/62360)

- [5] : [官方仓库Lisence](https://github.com/carbon-language/carbon-lang/blob/trunk/LICENSE)

- [6] : [.clang-format](https://github.com/carbon-language/carbon-lang/blob/trunk/.clang-format)

- [7] : [.clang-tidy](https://github.com/carbon-language/carbon-lang/blob/trunk/.clang-tidy)

- [8] : [lldbDataFormatters插件](https://github.com/llvm/llvm-project/blob/main/llvm/utils/lldbDataFormatters.py)
