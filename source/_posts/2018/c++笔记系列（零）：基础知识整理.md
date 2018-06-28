---
title: c++笔记系列（零）：基础知识整理
copyright: true
date: 2018-06-28 16:54:34
tags:
- c++笔记系列
categories:
- c++笔记系列
---

本系列**c++笔记系列**文章主要记录一些我碰到的c++的问题以及需要注意的内容。
本文作为开篇，收纳c++的部分基础知识的小tips。
可能对读者阅读不友好...因为暂时是我自己的一些小收集。

- 相同类的各个objects互为友元。
- 数据一定要放在private里。
- 参数尽可能以reference处理（const看状况）
- 返回值尽可能以reference处理（为什么：传递者无需知道接受者是以reference接收）
    如果返回内容是函数内部新创建的对象（即local object），返回不能by reference而要by value。
- 该加const一定要加
- 构造函数尽量用initialize_list作参数

关于操作符重载：
代码：
`
complex& operator+= (this, const complex& r)
{
    ...
}
`
上面其中一个参数`const complex& r`，这里可以传值也可以传指针。
使用时`c2 += c1`，这里c2就是this，所有的成员函数都含有一个隐含参数this，这里写不写这个参数都行，c1则是`const complex& r`。
返回为`complex&`，如果返回用reference接收，那么速度会快，用value接收，则要再复制一次，产生出一个临时对象，速度慢。
这里返回类型若为void的话，`c2 += c1`可以通过编译，`c3 += c2 += c1`这样的连串赋值无法通过编译。

另一个有特点的操作符重载
```
ostream& operator << (ostream& os, const complex& x)
{
    return os << '(' << real(x) << ',' << imag(x) << ')';
}
{
    complex c1(2, 1);
    cout << c1 << c1;   // 返回值不能为void，而是ostream&，cout作为os这参数传入函数
}
```