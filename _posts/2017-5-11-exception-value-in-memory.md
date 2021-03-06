---
layout: post
title: 内存中常见异常值的解释
category: problem
tags: memory
keywords: memory
description: 内存中常见异常值的解释
---
* 0xcccccccc : Used by Microsoft's C++ debugging runtime library to mark uninitialised stack memory

* 0xcdcdcdcd : Used by Microsoft's C++ debugging runtime library to mark uninitialised heap memory

* 0xfeeefeee : Used by Microsoft's HeapFree() to mark freed heap memory

* 0xabababab : Used by Microsoft's HeapAlloc() to mark "no man's land" guard bytes after allocated heap memory

* 0xabadcafe : A startup to this value to initialize all free memory to catch errant pointers

* 0xbaadf00d : Used by Microsoft's LocalAlloc(LMEM_FIXED) to mark uninitialised allocated heap memory

* 0xbadcab1e : Error Code returned to the Microsoft eVC debugger when connection is severed to the debugger

* 0xbeefcace : Used by Microsoft .NET as a magic number in resource files

        平时我们只需要了解上面常见的三种就可以了：0xcccccccc、0xcdcdcdcd和 0xfeeefeee ，以帮我们迅速地发现问题并分析问题。

        对于0xcccccccc和0xcdcdcdcd，在 Debug 模式下，VC 会把未初始化的栈内存上的指针全部填成 0xcccccccc ，当字符串看就是 “烫烫烫烫……”；会把未初始化的堆内存上的指针全部填成 0xcdcdcdcd，当字符串看就是 “屯屯屯屯……”。那么调试器为什么要这么做呢？VC的DEBUG版会把未初始化的指针自动初始化为0xcccccccc或0xcdcdcdcd，而不是就让取随机值，那是为了方便我们调试程序，如果野指针的初值不确定，那么每次调试同一个程序就可能出现不一样的结果，比如这次程序崩掉，下次却能正常运行，这样显然对我们解bug是非常不利的，所以自动初始化的目的是为了让我们一眼就能确定我们使用了未初始化的野指针了。

        对于0xfeeefeee，是用来标记堆上已经释放掉的内存。注意，如果指针指向的内存被释放了，变量变量本身的地址如未做改动，还是之前指向的内存的地址。如果该指针是一个类的指针，并且类中包含有指针变量，则内存被释放后（对于C++类，通常是执行delete操作），类中的指针变量就会被赋值为0xfeeefeee。如果早调试代码过程中，发现有值为0xfeeefeee的指针，就说明对应的内存被释放掉了，我们的代码已经出问题了。
关于VC 中 debug和Release模式下的变量初始化问题

大家都知道，debug跟release在初始化变量时所做的操作是不同的，debug是将每个字节位都赋成0xcc，而release的赋值近似于随机(我想是直接从内存中分配的，没有初始化过)。这样就明确了，如果你的程序中的某个变量没被初始化就被引用，就很有可能出现异常：用作控制变量将导致流程导向不一致；用作数组下标将会使程序崩溃；更加可能是造成其他变量的不准确而引起其他的错误。所以在声明变量后马上对其初始化一个默认的值是最简单有效的办法，否则项目大了你找都没地方找。代码存在错误在debug方式下可能会忽略而不被察觉到，如debug方式下数组越界也大多不会出错，在 release中就暴露出来了，这个找起来就比较难了（参考：http://bbs.csdn.net/topics/350212712）
