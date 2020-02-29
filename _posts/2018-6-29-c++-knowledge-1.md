---
layout: post
title: c++笔记-1
category: PL
tags: C++
keywords: C++
description: c++笔记
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

以下为字符串的实现：
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
当我们创建对象的时候，有一下几种方式：
```c++
String s1();
String s2("hello");
String *p = new String("hello"); // 用new从堆中创建对象，最后需要手动delete掉指针，不然会内存泄漏
delete p;
```

**再说为什么有指针的类一定要写拷贝构造和拷贝赋值：**

假设有两个String对象：`String a("hello"); String b("world");`
这个时候a指向"hello"，b指向"world"，而当我们使用默认的编译器创建出来的拷贝构造和拷贝赋值时，即当使用`b = a`语句时，a和b同时指向"hello"，也就是发生了浅拷贝，原来的"world"没有释放，造成资源泄漏，而两个指针指向同一个地方也非常危险，如果改动其中一个指针，另一个也会随之发生改动。

那么开始写我们的拷贝构造：
```c++
String::String(const String& str)
{
    m_data = new char[strlen(str.m_data) + 1];
    strcpy(m_data, str.m_data);
}
// 使用
{
    String s1("hello");
    String s2(s1);
}
```

再来写我们的拷贝赋值：
```c++
String& String::operator=(const String& str)
{
    if(this == &str)
        return *this;
    delete[] m_data;
    m_data = new char[strlen(str.m_data) + 1];
    strcpy(m_data, str.m_data);
    return *this;
}
// 使用
{
    String s1("hello");
    String s2(s1);
    s2 = s1;
}
```
这里有个要说的点就是这个if判断this和&str是否相等的**检测自我赋值**的语句一定要写，原因有一下几点：
1. 若this和str一样，直接返回this，保证程序效率。
2. 因为假设this指针和传入的参数str在一开始就指向同一块位置，如果没有这一个自我赋值的检测，直接开始后面的拷贝，`delete[] m_data;`拷贝的第一行代码就是delete掉这块他们指向的这个位置，之后我们再new的时候，这个位置已经没有了，程序会报错。




