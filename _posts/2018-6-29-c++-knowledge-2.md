---
layout: post
title: c++笔记-2
category: PL
tags: C++
keywords: C++
description: c++笔记
---
> 本系列**c++笔记系列**文章主要记录一些我碰到的c++的问题以及需要注意的内容。
> 本文承接上一篇[c++笔记系列（零）：基础知识整理](https://www.canftin.com/2018/c++笔记系列_零_基础知识整理/)，主要讲述c++的模板部分。
> 可能对读者阅读不友好...因为暂时是我自己的一些小整理，本文内容大部分整理自侯捷老师的课程。
> 曾经写过一些cpp的tricks： [some tricks of cpp](https://www.canftin.com/2017/some-tricks-of-cpp/)

## 可变参数模板

例子printX：
```c++
void printX()
{}

template<typename T, typename ... Types>
void printX(const T& firstArgs, const Types&... args)
{
    cout << firstArgs << endl;
    printX(args...);
}
```
上面我们用可变参数模板实现出一个打印函数，这个是c++11之后的新特性。
过去的情况下的可变参数是使用C语言中va_list、va_start、va_arg、va_end这样的参数，下面为示例：
<!--more-->
```c
void simple_va_fun(int i, ...) 
{ 
    va_list arg_ptr; 
    va_start(arg_ptr, i); 
    int j = va_arg(arg_ptr, int); 
    va_end(arg_ptr); 
    printf("%d %d\n", i, j); 
    return; 
}
```

可变参数模板的用处在于递归函数调用。

## 关于initializer_list
C++11引入了“统一初始化”的概念。这意味着我们可以使用{}这种通用的语法在任何需要初始化的地方。
使用：
```c++
void print(std::initializer_list<int> vals)
{
    for(auto p = vals.begin(); p != vals.end(); ++p)
    {
        std::cout << *p << std::endl;
    }
}
print({1,2,3,4,5,6,7,8,9});
```

```c++
class Test
{
public:
    Test(int a, int b)
    {
        cout << "Test(int, int), a = " << a << ", b = " << b << endl;
    }
    Test(initializer_list<int> initlist)
    {
        cout << "Test(initializer_list<int>), values = ";
        for (auto i : initlist)
            cout << i << ' ';
        cout << endl;
    }
};
{
    Test a(77, 5);      // Test(int a, int b), a = 77, b = 5
    Test b{77, 5};      // Test(initializer_list<int>), values = 77 5
    Test c{77, 5, 42};  // Test(initializer_list<int>), values = 77 5 42
    Test s = {77, 5};   // Test(initializer_list<int>), values = 77 5
}
```
**initializer_list是浅拷贝，拷贝时一定要注意。**
initializer_list的实现：
```c++
template <class T>
class initializer_list
{
public:
    typedef T         value_type;
    typedef const T&  reference; //注意说明该对象永远为const，不能被外部修改！
    typedef const T&  const_reference;
    typedef size_t    size_type;
    typedef const T*  iterator;  //永远为const类型
    typedef const T*  const_iterator;
private:
    iterator    _M_array; //用于存放用{}初始化列表中的元素
    size_type   _M_len;   //元素的个数
    
    //编译器可以调用private的构造函数！！！
    //构造函数，在调用之前，编译会先在外部准备好一个array，同时把array的地址传入模板
    //并保存在_M_array中
    constexpr initializer_list(const_iterator __a, size_type __l)
    :_M_array(__a),_M_len(__l){};  //注意构造函数被放到private中！

    constexpr initializer_list() : _M_array(0), _M_len(0){} // empty list，无参构造函数
    
    //size()函数，用于获取元素的个数
    constexpr size_type size() const noexcept {return _M_len;}
    
    //获取第一个元素
    constexpr const_iterator begin() const noexcept {return _M_array;}
    
    //最后一个元素的下一个位置
    constexpr const_iterator end() const noexcept
    {
        return begin() + _M_len;
    }  
};
```