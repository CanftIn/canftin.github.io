---
layout: post
title: C++ 私有继承
category: PL
tags: C++
keywords: C++
description: C++ 私有继承
---
# C++ 私有继承

私有继承的第一个规则：和公有继承相反，如果两个类之间的继承关系为私有，编译器一般不会将派生类对象转换成基类对象。
第二个规则: 从私有基类继承而来的成员都成为了派生类的私有成员，即使它们在基类中是保护或公有成员。

私有继承的含义：私有继承意味着 "用...来实现"。
如果使类D私有继承于类B，这样做是因为你想利用类B中已经存在的某些代码，而不是因为类型B的对象和类型D的对象之间有什么概念上的关系。
因而，私有继承纯粹是一种实现技术。

私有继承意味着只是继承实现，接口会被忽略。如果D私有继承于B，就是说D对象在实现中用到了B对象，仅此而已。
私有继承在软件 "设计" 过程中毫无意义，只是在软件 "实现" 时才有用。

1、私有继承的声明形式： 
```
class Foo : private Bar 
{ 
    public: 
        void   fun(); 
        //   ... 
};   
```
基类的公有和保护成员在派生类里都成为私有成员；承属于is-a关系的一部分，而私有继承属于has-a关系的一部分
 
2、在架构上私有继承表达的是一种 'has   a '关系，但与聚合有以下不同: 

      私有继承形式可能引入不必要的多重继承   
      私有继承形式允许访问基类的保护（protected）成员   
      私有继承形式允许派生类重写基类的虚函数（多态）
3、尽可能用组合，万不得已才用私有继承 

      通常你不会想访问其他类的内部，而私有继承给你这样的一些的特权（和责任）。但是私有继承并不有害。只是由于它增加了别人更改某些东西时，破坏你的代码的可能性，从而使维护的花费更昂贵。
 
 
 
C++ 将公有继承视为 "是一个"的关系。通过这个例子证实：假如某个类层次结构中，Student类从Person类公有继承，为了使某个函数成功调用，编译器可以在必要时隐式地将Student转换为Person。不过现在，公有继承换成了私有继承：
```
class Person { ... };
class Student:                      
  private Person { ... };           // 使用私有继承
void dance(const Person& p);        // 每个人会跳舞
void study(const Student& s);       // 只有学生才学习
Person p;                           // p是一个人
Student s;                          // s是一个学生
dance(p);                           // 正确, p是一个人
dance(s);                           // 错误！一个学生不是一个人
```
很显然，私有继承的含义不是 "是一个"。
私有继承的第一个规则：和公有继承相反，如果两个类之间的继承关系为私有，编译器一般不会将派生类对象（如Student）转换成基类对象（如Person）。这就是上面的代码中为对象s调用dance会失败的原因。第二个规则是，从私有基类继承而来的成员都成为了派生类的私有成员，即使它们在基类中是保护或公有成员。

私有继承的含义：私有继承意味着 "用...来实现"。如果使类D私有继承于类B，这样做是因为想利用类B中已经存在的某些代码，而不是因为类型B的对象和类型D的对象之间有什么概念上的关系。因而，私有继承纯粹是一种实现技术。私有继承意味着只是继承实现，接口会被忽略。如果D私有继承于B，就是说D对象在实现中用到了B对象，仅此而已。私有继承在软件 "设计" 过程中毫无意义，只是在软件 "实现" 时才有用。

私有继承意味着 "用...来实现"。这一事实会给程序员带来一点混淆，"分层" 也具有相同的含义。二者之间如何进行选择。答案很简单：尽可能地使用分层，必须时才使用私有继承。什么时候必须，这往往是指有保护成员和/或虚函数介入时。

模板是C++最有用的组成部分之一，但一旦开始经常性地使用它，就会发现，如果实例化一个模板一百次，就可能实例化了那个模板的代码一百次。

例如Stack模板，构Stack<int>成员函数的代码和构成Stack<double>成员函数的代码是完全分开的。有时这是不可避免的，但即使模板函数实际上可以共享代码，这种代码重复还是可能存在。这种目标代码体积的增加有一个名字：模板导致的 "代码膨胀"。这不是件好事。

对于某些类，可以采用通用指针来避免它。采用这种方法的类存储的是指针，而不是对象，实现起来就是：

- 创建一个类，它存储的是对象的void*指针。

- 创建另外一组类，其唯一目的是用来保证类型安全。这些类都借助第一步中的通用类来完成实际工作。

下面的例子使用了非模板Stack类，不同的是这里存储的是通用指针，而不是对象：
```
class GenericStack {
public:
  GenericStack();
  ~GenericStack();
  void push(void *object);
  void * pop();
  bool empty() const; 
private:
  struct StackNode {
    void *data;                    // 节点数据
    StackNode *next;               // 下一节点
    StackNode(void *newData, StackNode *nextNode)
    : data(newData), next(nextNode) {}
  };
  StackNode *top;                          // 栈顶
  GenericStack(const GenericStack& rhs);   // 防止拷贝和赋值
  GenericStack& operator=(const GenericStack& rhs);    
};
```
因为这个类存储的是指针而不是对象，就有可能出现一个对象被多个堆栈指向的情况（即被压入到多个堆栈）。所以极其重要的一点是pop和类的析构函数销毁任何StackNode对象时，都不能删除data指针 

---- 虽然还是得要删除StackNode对象本身。毕竟，StackNode对象是在GenericStack类内部分配的，所以还是得在类的内部释放。

仅仅有GenericStack这一个类是没有什么用处的，但很多人会很容易误用它。例如，对于一个用来保存int的堆栈，一个用户会错误地将一个指向Cat对象的指针压入到这个堆栈中，但编译却会通过，因为对void*参数来说，指针就是指针。

为了重新获得你所习惯的类型安全，就要为GenericStack创建接口类（interface class），象这样：
```
class IntStack {                  // int接口类
public:
  void push(int *intPtr) { s.push(intPtr); }
  int * pop() { return static_cast<int*>(s.pop()); }
  bool empty() const { return s.empty(); }
private:
  GenericStack s;                 // 实现
};
class CatStack {                  // cat接口类
public:
  void push(Cat *catPtr) { s.push(catPtr); }
  Cat * pop() { return static_cast<Cat*>(s.pop()); }
  bool empty() const { return s.empty(); }
private:
  GenericStack s;                 // 实现
};
```
正如所看到的，IntStack和CatStack只是适用于特定类型。只有int指针可以被压入或弹出IntStack，只有Cat指针可以被压入或弹出CatStack。IntStack和CatStack都通过GenericStack类来实现，这种关系是通过分层来体现的，IntStack和CatStack将共享GenericStack中真正实现它们行为的函数代码。另外，IntStack和CatStack所有成员函数是（隐式）内联函数，这意味着使用这些接口类所带来的开销几乎是零。

但如果有些用户没认识到这一点怎么办？如果他们错误地认为使用GenericStack更高效，或者，如果他们鲁莽而轻率地认为类型安全不重要，那该怎么办？怎么才能阻止他们绕过IntStack和CatStack而直接使用GenericStack呢？在开始就提到，要表示类之间 "用...来实现"的关系，有一个选择是通过私有继承。现在这种情况下，这一技术就比分层更有优势，因为通过它可以告诉别人：GenericStack使用起来不安全，它只能用来实现其它的类。具体做法是将GenericStack的成员函数声明为保护类型：
```
class GenericStack {
protected:
  GenericStack();
  ~GenericStack();
  void push(void *object);
  void * pop();
  bool empty() const; 
private:
  ...                             // 同上
};
GenericStack s;                   // 错误! 构造函数被保护
class IntStack: private GenericStack {
public:
  void push(int *intPtr) { GenericStack::push(intPtr); }
  int * pop() { return static_cast<int*>(GenericStack::pop()); }
  bool empty() const { return GenericStack::empty(); }
};
class CatStack: private GenericStack {
public:
  void push(Cat *catPtr) { GenericStack::push(catPtr); }
  Cat * pop() { return static_cast<Cat*>(GenericStack::pop()); }
  bool empty() const { return GenericStack::empty(); }
};
IntStack is;                     // 正确
CatStack cs;                     // 也正确
```
和分层的方法一样，基于私有继承的实现避免了代码重复，因为这个类型安全的接口类只包含有对GenericStack函数的内联调用。

在GenericStack类之上构筑类型安全的接口是个很花俏的技巧，但需要手工去写所有那些接口类是件很烦的事。幸运的是，不必这样。可以让模板来自动生成它们。下面是一个模板，它通过私有继承来生成类型安全的堆栈接口：
```
template<class T>
class Stack: private GenericStack {
public:
  void push(T *objectPtr) { GenericStack::push(objectPtr); }
  T * pop() { return static_cast<T*>(GenericStack::pop()); }
  bool empty() const { return GenericStack::empty(); }
};
```
因为这是一个模板，编译器将根据你的需要自动生成所有的接口类。因为这些类是类型安全的，用户类型错误在编译期间就能发现。因为GenericStack的成员函数是保护类型，并且接口类把GenericStack作为私有基类来使用，用户将不可能绕过接口类。因为每个接口类成员函数被（隐式）声明为inline，使用这些类型安全的类时不会带来运行开销；生成的代码就象用户直接使用GenericStack来编写的一样（假设编译器满足了inline请求）。因为GenericStack使用了void*指针，操作堆栈的代码就只需要一份，而不管程序中使用了多少不同类型的堆栈。简而言之，这个设计使代码达到了最高的效率和最高的类型安全。很难做得比这更好。

从这个例子中可以发现，如果使用分层，就达不到这样的效果。只有继承才能访问保护成员，只有继承才使得虚函数可以重新被定义。（虚函数的存在会引发私有继承的使用）因为存在虚函数和保护成员，有时私有继承是表达类之间 "用...来实现"

关系的唯一有效途径。所以，当私有继承是可以使用的最合适的实现方法时，就要大胆地使用它。同时，广泛意义上来说，分层是应该优先采用的技术，所以只要有可能，就要尽量使用它。