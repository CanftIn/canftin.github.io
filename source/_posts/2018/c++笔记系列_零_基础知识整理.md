---
title: c++笔记系列（零）：基础知识整理
copyright: true
date: 2018-06-28 16:54:34
tags:
- c++
- c++笔记系列
categories:
- c++
- c++笔记系列
---

> 本系列**c++笔记系列**文章主要记录一些我碰到的c++的问题以及需要注意的内容。
> 本文作为开篇，收纳c++的部分基础知识的小tips。
> 可能对读者阅读不友好...因为暂时是我自己的一些小整理，本文内容大部分整理自侯捷老师的课程。
> 曾经写过一些cpp的tricks： [some tricks of cpp](https://www.canftin.com/2017/some-tricks-of-cpp/)

## 一些小tips

- 相同类的各个objects互为友元。
- 数据一定要放在private里。
- 参数尽可能以reference处理（const看状况）
- 返回值尽可能以reference处理（为什么：传递者无需知道接受者是以reference接收）
    如果返回内容是函数内部新创建的对象（即local object），返回不能by reference而要by value。
- 该加const一定要加
- 构造函数尽量用initialize_list作参数

<!--more-->

## 关于操作符重载
以下为复数的实现
```c++
class complex
{
public:
    complex(double r = 0, double i = 0)
        : re(r), im(i)
    {}

    complex& operator+= (const complex& x);
    double real() const { return re; }
    double imag() const { return im; }

private:
    double re, im;

    friend complex& __doapl(complex* ths, const complex& x);
};

complex& complex::operator+=(const complex& x)
{
    return __doapl(this, x);
}

complex& __doapl(complex* ths, const complex& x)
{
    ths->re += x.re;
    ths->im += x.im;
    return *ths;
}
```

代码`complex& operator+= (this, const complex& r){ ... }`中一个参数`const complex& r`，这里可以传值也可以传指针。使用时`c2 += c1`，这里c2就是this，所有的成员函数都含有一个隐含参数this，这里写不写这个参数都行，c1则是`const complex& r`。返回为`complex&`，如果返回用reference接收，那么速度会快，用value接收，则要再复制一次，产生出一个临时对象，速度慢。
这里返回类型若为void的话，`c2 += c1`可以通过编译，`c3 += c2 += c1`这样的连串赋值无法通过编译。

**另一个有特点的操作符重载**
```c++
ostream& operator << (ostream& os, const complex& x)
{
    return os << '(' << real(x) << ',' << imag(x) << ')';
}
{
    complex c1(2, 1);
    cout << c1 << c1;   // 返回值不能为void，而是ostream&，cout作为os这参数传入函数
}
```

## 拷贝构造

**什么时候需要拷贝构造？**
以上的complex实现里就没有写类似 `complex(const complex& x);`这样的拷贝构造函数，原因是编译器内部给了一个拷贝构造，而这个默认的拷贝构造功能则是按位copy，即**浅拷贝**。

而编译器给的这一套在类内部有指针数据的情况下则不够用，比如有一个对象有一个指针指向一个地方，当需要拷贝的时候，新对象的指针还是指向这个地方，那么这个拷贝是内部默认拷贝构造的能力范围内，某些情况下不满足我们实际的需要，有时候我们实际上就是需要完完全全的两个内容，而不是两个指针指向一块相同的内容，这个时候我们就需要**深拷贝**。

以下为字符串内的实现：
```c++
class String
{
public:
    String(const char* cstr = 0);
    String(const String& str);
    String& operator=(const String& str);
    ~String() { delete[] m_data; }
    char* get_c_str() const { return m_data; }
private:
    char* m_data;
}

String::String(const char* cstr = 0)
{
    if(cstr) {
        m_data = new char[strlen(cstr)+1];
        strcpy(m_data, cstr);
    }
    else {
        m_data = new char[1];
        *m_data = '\0';
    }
}
```

