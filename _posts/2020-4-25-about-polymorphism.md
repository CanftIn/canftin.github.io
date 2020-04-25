---
layout: post
title: about_polymorphism in C++
---
C++中的四个多态性

>多态（Polymorphism）指的是一种相同的形式（名称和操作等）表现出不同行为的概念，多态的概念由Christopher Strachey于1967年[1]定义为两个分支：特设型多态（Ad-hoc polymorphism）和通用型多态（Universal polymorphism），此处的特设仅与通用相对，并非贬义的。特设型多态在之后又被细分为特设强制多态（Ad-hoc coercion polymorphism）及特设重载多态（Ad-hoc overloading polymorphism，有时候也简称为特设多态）两类，通用型多态也被细分为参数多态（Parametric polymorphism）及包含多态（Inclusion polymorphism，又称子类型多态 Subtyping polymorphism）。
>作者：夏之幻想
>链接：https://zhuanlan.zhihu.com/p/44526108


通常通过基类指针或引用使用派生类，这称为子类型多态性subtype polymorphism 。

C++中还有其他各种多态性，如参数多态性 (parametric polymorphism)、特设多态性(ad-hoc polymorphism)和强制多态性(coercion polymorphism)。

以下是一些C++内的不同名字的多态类型。

- 子类型多态性也称为运行时多态性。
- 参数多态性也称为编译时多态性。
- 特设多态性也称为重载。
- 强制多态性也称为（隐式或显式）强制转换。


## 1. 子类型多态性（运行时多态性）
子类型多态性是每个人在C++说"多态性"时所理解的。它是通过基类指针和引用使用派生类的能力
例如对于Felidae猫科动物而言，
```cpp
// file cats.h

class Felid {
public:
 virtual void meow() = 0;
};

class Cat : public Felid {
public:
 void meow() { std::cout << "Meowing like a regular cat! meow!\n"; }
};

class Tiger : public Felid {
public:
 void meow() { std::cout << "Meowing like a tiger! MREOWWW!\n"; }
};

class Ocelot : public Felid {
public:
 void meow() { std::cout << "Meowing like an ocelot! mews!\n"; }
};
```
然后主程序可以通过指针互换实现动态绑定。
```cpp
#include <iostream>
#include "cats.h"

void do_meowing(Felid *cat) {
 cat->meow();
}

int main() {
 Cat cat;
 Tiger tiger;
 Ocelot ocelot;

 do_meowing(&cat);
 do_meowing(&tiger);
 do_meowing(&ocelot);
}
```
输出：
```cpp
Meowing like a regular cat! meow!
Meowing like a tiger! MREOWWW!
Meowing like an ocelot! mews!
```
子型多态性也称为**运行时多态性**。多态函数调用的解析在运行时通过虚函数表间接进行。
解释这一点的另一种方法是编译器不会找到在编译时要调用的函数的地址，而是在运行程序时，通过取消引用虚拟表中的指针来调用该函数。

## 2. 参数多态性（编译时多态性）
参数化多态性提供了为任何类型的执行相同代码的方法。在C++参数多态性是通过模板实现的。
最简单的示例之一是一个max通用函数：
```cpp
#include <iostream>
#include <string>

template <class T>
T max(T a, T b) {
 return a > b ? a : b;
}

int main() {
 std::cout << ::max(9, 5) << std::endl;     // 9

 std::string foo("foo"), bar("bar");
 std::cout << ::max(foo, bar) << std::endl; // "foo"
}
```
这里函数max的多态类型为T。但是请注意，它不适用于指针类型，因为比较指针比较内存地址而不是内容。
要使其适用于指针，您必须专门化指针类型的模板，这不再是参数多态性（parametric polymorphism），而是特设多态性（ad-hoc polymorphism）。

由于参数多态性发生在编译时，它也被称为编译时多态性。

## 3. 特设多态性（重载）
特设多态性允许具有相同名称的函数对每种类型执行不同的操作。例如，给定两个 `int`s 和 `+` 运算符，它将它们相加。给定两个 `std::string`s，将他们串在一起。这称为重载。
下面是一个具体示例：
```cpp
#include <iostream>
#include <string>

int add(int a, int b) {
 return a + b;
}

std::string add(const char *a, const char *b) {
 std::string result(a);
 result += b;
 return result;
}

int main() {
 std::cout << add(5, 9) << std::endl;
 std::cout << add("hello ", "world") << std::endl;
}
```

如果专门化模板，则特设多态性也会出现在C++中。返回到前面的max函数的示例，下面是如何为两个 `char*` 编写最大值:

```cpp
template <>
const char *max(const char *a, const char *b) {
 return strcmp(a, b) > 0 ? a : b;
}
```

## 4. 强制多态性（转换）
当对象或原始类型被强制转换为其他对象类型或原始类型时，就会发生强制转换。例如
```cpp
float b = 6; // int gets promoted (cast) to float implicitly
int a = 9.99 // float gets demoted to int implicitly
```
显示类型转换在你使用诸如 `(unsigned int *)` 或 `(int)` 等C类型转换或者 `static_cast`, `const_cast`, `reinterpret_cast`, `dynamic_cast`等C++类型转换时发生。

例如，如果类的构造函数不是`explicit`
```cpp
#include <iostream>

class A {
 int foo;
public:
 A(int ffoo) : foo(ffoo) {}
 void giggidy() { std::cout << foo << std::endl; }
};

void moo(A a) {
 a.giggidy();
}

int main() {
 moo(55);     // prints 55
}
```
前面讨论过的子类型多态性实际上也是强制多态性，因为派生类被转换为基类类型。

引用：

[1.](https://catonmat.net/cpp-polymorphism) https://catonmat.net/cpp-polymorphism

[2.](https://en.wikipedia.org/wiki/Parametric_polymorphism) Wiki -> Parametric polymorphism