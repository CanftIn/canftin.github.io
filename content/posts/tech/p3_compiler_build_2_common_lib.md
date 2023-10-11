---
title: "从零构造现代语言编译器(2): 公共库"
date: 2023-09-21T18:05:39+08:00
lastmod: 2023-09-21T18:05:39+08:00
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

本章主要介绍公共库里的基础组件，这些组件抽象出来用于统一编程方式，达到可复用性，其中有一些重复造轮子的组件，这里也对这些组件和现有开源组件做对比分析。

## 1. 流

引入工具基类Printable如下：

```cpp
/// CRTP基类，用于打印类型，子类必须实现Print接口：
/// - auto Print(llvm::raw_ostream& out) -> void;
template <typename DerivedT>
class Printable {
  /// 提供给debugger的简单接口，
  /// `LLVM_DUMP_METHOD` 宏确保只有在调试构建中才会包含这个方法。
  LLVM_DUMP_METHOD void Dump() const {
    static_cast<const DerivedT*>(this)->Print(llvm::errs());
  }

  /// llvm::raw_ostream输出。
  friend auto operator<<(llvm::raw_ostream& out, const DerivedT& obj)
      -> llvm::raw_ostream& {
    obj.Print(out);
    return out;
  }

  /// std::ostream输出。
  friend auto operator<<(std::ostream& out, const DerivedT& obj)
      -> std::ostream& {
    llvm::raw_os_ostream raw_os(out);
    obj.Print(raw_os);
    return out;
  }

  friend auto PrintTo(DerivedT* p, std::ostream* out) -> void {
    *out << static_cast<const void*>(p);
    if (p) {
      *out << " pointing to " << *p;
    }
  }
};
```

这里的`Printable`类被设计为一个基类，用于实现可打印的对象，它期望子类实现一个`Print`接口。

### 1.1 `Printable`类的用途和功能

1. **类型打印**: 通过`Print`接口，子类可以自定义如何将其内容打印到输出流。
2. **多种输出流支持**: 支持`llvm::raw_ostream`和`std::ostream`两种输出流。
3. **调试支持**: 提供了一个`Dump`方法，用于在调试时快速查看对象的状态。

假设有一个`Person`类，我们希望能够打印其信息：

```cpp
class Person : public Printable<Person> {
public:
  Person(std::string name, int age) : name(name), age(age) {}
  void Print(llvm::raw_ostream& out) const {
    out << "Person { name: " << name << ", age: " << age << " }";
  }
private:
  std::string name;
  int age;
}
```

现在，`Person`类就可以使用`Printable`提供的所有功能。

```cpp
Person p("Alice", 30);
llvm::raw_ostream& os = llvm::outs();
os << p;  // 输出：Person { name: Alice, age: 30 }
```

### 1.2 介绍CRTP和Mixin

CRTP是C++中一种常用的编程模式，全名为“Curiously Recurring Template Pattern”，中文可以翻译为“奇异递归模板模式”。这个模式主要用于实现编译时多态性，也就是在编译时解析多态行为，而不是运行时。

1. **编译时多态**: 由于多态行为在编译时就被解析，因此运行时性能开销小。
2. **代码复用**: 可以在基类中实现通用逻辑，减少代码重复。
3. **类型安全**: 使用`static_cast`进行类型转换是安全的，因为基类知道派生类的确切类型。
4. **不适用于运行时多态**: CRTP无法实现运行时多态，因为它依赖于编译时类型信息。
5. **代码可读性**: 对于不熟悉CRTP的开发者来说，代码可能会显得有些复杂。

在CRTP中，一个模板基类会以其派生类作为模板参数。这样，基类就可以在编译时知道其派生类的类型，基类就可以调用派生类的方法或访问其成员，即使这些方法或成员在基类中并没有被声明。

```cpp
template <typename Derived>
class Base {
public:
  void interface() {
    static_cast<Derived*>(this)->implementation();
  }
};

class Derived : public Base<Derived> {
public:
  void implementation() {
    // 实际的实现
  }
};
```

在这个例子中，`Base`类有一个`interface`方法，它内部调用了`implementation`方法。这个`implementation`方法是在`Derived`类中定义的，但`Base`类可以通过`static_cast`安全地调用它。

CRTP常用于以下几种场景：

1. **静态多态**: 如上面的例子所示，可以用于实现编译时多态。
2. **Mixin 类**: 可以用CRTP实现mixin（混入）功能，即在一个类中混入另一个类的功能。
3. **工具类**: 如在问题中的`Printable`类，用于提供一组通用的接口或实现。

总体来说，CRTP是一种非常强大而灵活的编程模式，尤其适用于需要高性能和代码复用的场景。

#### Mixin 功能

在 C++ 中，Mixin 是一种编程模式，用于通过组合而非继承来向一个类添加额外的功能或行为。Mixin 类通常是一些小型、可复用的组件，它们定义了特定的行为或功能，但不应该单独使用。通过将多个 Mixin 类组合在一起，你可以创建出具有多种功能的复杂对象。

Mixin 通常与模板编程和多重继承一起使用，以实现更高的灵活性和代码复用。

假设你有一个 `LoggerMixin` 类，它提供了日志功能。

```cpp
class LoggerMixin {
public:
  void log(const std::string& message) {
    std::cout << "[LOG]: " << message << std::endl;
  }
};
```

再假设你有一个 `TimerMixin` 类，用于计算代码执行时间。

```cpp
#include <chrono>

class TimerMixin {
public:
  void startTimer() {
    start = std::chrono::high_resolution_clock::now();
  }

  void stopTimer() {
    auto stop = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(stop - start);
    std::cout << "Time taken: " << duration.count() << " microseconds" << std::endl;
  }

private:
  std::chrono::time_point<std::chrono::high_resolution_clock> start;
};
```

现在，你可以创建一个新类，通过多重继承来组合这两个 Mixin。

```cpp
class MyClass : public LoggerMixin, public TimerMixin {
public:
  void doSomething() {
    log("Starting operation...");
    startTimer();

    // 执行一些操作
    // ...

    stopTimer();
    log("Operation completed.");
  }
};
```

使用：

```cpp
int main() {
  MyClass obj;
  obj.doSomething();
  return 0;
}
```

这样，`MyClass` 就继承了 `LoggerMixin` 和 `TimerMixin` 的所有功能，而你不需要在 `MyClass` 中重新实现这些功能。

1. **代码复用**: 你可以在多个类中重用同一个 Mixin。
2. **解耦**: Mixin 使得功能模块与业务逻辑解耦，更易于维护和扩展。
3. **灵活性**: 你可以灵活地组合多个 Mixin，以创建具有所需功能的新类。
4. **复杂性**: 使用多重继承和模板可能会增加代码复杂性。
5. **名称冲突**: 如果两个 Mixin 有相同的成员，可能会导致名称冲突。


### 1.3 LLVM输出流重载

LLVM是一个编译器基础设施项目，提供了一系列模块化的编译器组件和工具链。它用于开发编译器前端和后端，以及其他代码转换和代码生成工具。其中`llvm::raw_ostream`是llvm上的原始输出流。
```cpp
namespace llvm {

/// 注入一个 `operator<<` 重载到 llvm 命名空间，
/// 将 LLVM 类型的 `raw_ostream` 重载映射到 `std::ostream` 重载。
template <typename StreamT, typename ClassT,
          typename = std::enable_if_t<
              std::is_base_of_v<std::ostream, std::decay_t<StreamT>>>,
          typename = std::enable_if_t<
              !std::is_same_v<std::decay_t<ClassT>, raw_ostream>>>
auto operator<<(StreamT& standard_out, const ClassT& value) -> StreamT& {
  raw_os_ostream(standard_out) << value;
  return standard_out;
}

}  // namespace llvm
```

这段代码定义了一个模板函数 `operator<<`，该函数重载了流插入运算符 `<<`。这个重载函数位于 `llvm` 命名空间中，并且是为了将 LLVM 的 `raw_ostream` 类型的重载映射到 C++ 标准库的 `std::ostream` 类型。其中 `StreamT` 代表流类型，通常是 `std::ostream` 或其派生类，`ClassT` 代表要输出的类的类型。

`std::enable_if_t<std::is_base_of_v<std::ostream, std::decay_t<StreamT>>>`: 这个条件使用SFINAE（替换失败不是错误）确保 `StreamT` 是 `std::ostream` 的基类或者就是 `std::ostream` 本身。

`std::enable_if_t<!std::is_same_v<std::decay_t<ClassT>, raw_ostream>>` 这个条件确保 `ClassT` 不是 `raw_ostream` 类型。

`raw_os_ostream(standard_out) << value;` 这里创建了一个 `raw_os_ostream` 对象，该对象是 LLVM 提供的一个流类，用于将 `std::ostream` 包装成 `raw_ostream`。然后，使用 `raw_ostream` 的 `<<` 运算符将 `value` 输出到这个流中。

这样做的目的是利用 LLVM 已经为 `raw_ostream` 定义的 `<<` 运算符重载。这样，任何能够通过 `raw_ostream` 输出的 `ClassT` 类型都可以通过这个新的 `<<` 运算符重载输出到 `std::ostream`。

`return standard_out;` 最后，函数返回传入的 `std::ostream` 引用，以支持链式调用。

假设 LLVM 已经为一个名为 `MyLLVMClass` 的类定义了如下的 `<<` 运算符重载：

```cpp
llvm::raw_ostream& operator<<(llvm::raw_ostream& out, const MyLLVMClass& obj) {
  // ... 输出逻辑
  return out;
}
```

现在，你可以这样使用新的 `<<` 运算符重载：

```cpp
std::cout << MyLLVMClassInstance;  // 这里会调用上面定义的 operator<<
```

这样，`MyLLVMClassInstance` 就会被正确地输出到 `std::cout`，而这一切都是通过 LLVM 的 `raw_ostream` 完成的。

总结一下，这段代码的主要目的是为了提供一种机制，使得任何可以通过 LLVM 的 `raw_ostream` 输出的对象都可以直接通过 C++ 的 `std::ostream` 输出，从而实现两者之间的重载映射。这样做提高了代码的可复用性和一致性。

## 2. EnumBase枚举模版类型

```cpp
/// 用CRTP以及X-Macro来生成枚举类的模板类。
template <typename DerivedT, typename EnumT, const llvm::StringLiteral Names[]>
class EnumBase : public Printable<DerivedT> {
 public:
  using RawEnumType = EnumT;  // 用于定义原始的模版类型。
  using EnumType = DerivedT;  // 派生的枚举类型。
  using UnderlyingType =
      std::underlying_type_t<RawEnumType>;  // 原始枚举类型的底层类型。

  /// 允许将枚举类转换为原始的枚举类型，
  constexpr operator RawEnumType() const { return value_; }

  explicit operator bool() const = delete;

  /// 返回枚举的名称。
  [[nodiscard]] auto name() const -> llvm::StringRef { return Names[AsInt()]; }

  /// 打印名称，使用于Printable，必须实现。
  auto Print(llvm::raw_ostream& out) const -> void { out << name(); }

 protected:
  constexpr EnumBase() = default;

  /// 从原始枚举器创建类型。
  static constexpr auto Create(RawEnumType value) -> EnumType {
    EnumType result;
    result.value_ = value;
    return result;
  }

  /// 转换为整数类型。
  constexpr auto AsInt() const -> UnderlyingType {
    return static_cast<UnderlyingType>(value_);
  }

  /// 从底层整数类型转换为枚举类型。
  static constexpr auto FromInt(UnderlyingType value) -> EnumType {
    return Create(static_cast<RawEnumType>(value));
  }

 private:
  RawEnumType value_;
};
```

这段代码定义了一个用于生成枚举类的模板类 `EnumBase`，以及一系列用于辅助生成枚举类的宏。这个模板类和宏的组合提供了一种灵活、可复用的方式来创建和操作枚举类。它的设计目的：

1. **类型安全**: 通过使用强类型的枚举（`enum class`），提供更好的类型安全。
2. **可打印**: 通过继承以上的 `Printable`，使得枚举值可以被打印。
3. **名称获取**: 提供了一个 `name()` 方法，用于获取枚举值的名称。

### 2.1 主要宏

```cpp
// 创造原始枚举类（不涉及名称）。
#define COCKTAIL_DEFINE_RAW_ENUM_CLASS_NO_NAMES(EnumClassName, UnderlyingType) \
  namespace Internal {                                                         \
  enum class EnumClassName##RawEnum : UnderlyingType;                          \
  }                                                                            \
  enum class Internal::EnumClassName##RawEnum : UnderlyingType

// 创造原始枚举类。
#define COCKTAIL_DEFINE_RAW_ENUM_CLASS(EnumClassName, UnderlyingType) \
  namespace Internal {                                                \
  extern const llvm::StringLiteral EnumClassName##Names[];            \
  }                                                                   \
  COCKTAIL_DEFINE_RAW_ENUM_CLASS_NO_NAMES(EnumClassName, UnderlyingType)

// 在原始枚举类的定义中生成每个枚举值。
#define COCKTAIL_RAW_ENUM_ENUMERATOR(Name) Name,

#define COCKTAIL_ENUM_BASE(EnumClassName) \
  COCKTAIL_ENUM_BASE_CRTP(EnumClassName, EnumClassName, EnumClassName)

#define COCKTAIL_ENUM_BASE_CRTP(EnumClassName, LocalTypeNameForEnumClass, \
                                EnumClassNameForNames)                    \
  ::Cocktail::Internal::EnumBase<LocalTypeNameForEnumClass,               \
                                 Internal::EnumClassName##RawEnum,        \
                                 Internal::EnumClassNameForNames##Names>

// 枚举类体内生成每个值的命名常量声明。
#define COCKTAIL_ENUM_CONSTANT_DECLARATION(Name) static const EnumType Name;

// 枚举类体外定义每个命名常量。
#define COCKTAIL_ENUM_CONSTANT_DEFINITION(EnumClassName, Name) \
  constexpr EnumClassName EnumClassName::Name =                \
      EnumClassName::Create(RawEnumType::Name);

#define COCKTAIL_INLINE_ENUM_CONSTANT_DEFINITION(Name)   \
  static constexpr const typename Base::EnumType& Name = \
      Base::Create(Base::RawEnumType::Name);

// 在 `.cc` 文件中为枚举类开始定义每个枚举器的常量名数组。
#define COCKTAIL_DEFINE_ENUM_CLASS_NAMES(EnumClassName) \
  constexpr llvm::StringLiteral Internal::EnumClassName##Names[]

#define COCKTAIL_ENUM_CLASS_NAME_STRING(Name) #Name,
```

1. **COCKTAIL_DEFINE_RAW_ENUM_CLASS_NO_NAMES**: 定义一个没有名称数组的原始枚举类。
2. **COCKTAIL_DEFINE_RAW_ENUM_CLASS**: 定义一个有名称数组的原始枚举类。
3. **COCKTAIL_RAW_ENUM_ENUMERATOR**: 在原始枚举类定义中生成每个枚举值。
4. **COCKTAIL_ENUM_BASE**: 生成用于派生的 `EnumBase` 类型。
5. **COCKTAIL_ENUM_CONSTANT_DECLARATION**: 在枚举类体内生成每个值的命名常量声明。
6. **COCKTAIL_ENUM_CONSTANT_DEFINITION**: 在枚举类体外定义每个命名常量。
7. **COCKTAIL_INLINE_ENUM_CONSTANT_DEFINITION**: 用于内联定义每个命名常量。
8. **COCKTAIL_DEFINE_ENUM_CLASS_NAMES**: 在 `.cc` 文件中为枚举类开始定义每个枚举器的常量名数组。
9. **COCKTAIL_ENUM_CLASS_NAME_STRING**: 用于生成枚举值名称的字符串。

这个 `EnumBase` 类和相关的宏提供了一种高度可定制和可复用的方式来创建和操作枚举类。它们解决了类型安全、可打印性和名称获取等常见问题，同时也提供了一种简洁、一致的方式来定义和使用枚举类。这样的设计非常适用于大型项目中，特别是那些需要多次定义和使用不同枚举类的项目。

### 2.2 什么是X-Macro

X-Macro 是一种 C 和 C++ 预处理器技术，用于生成重复或模式化的代码。这种技术通过定义宏来实现，这些宏在不同的上下文中被多次展开，以生成不同的代码片段。X-Macro 主要用于减少代码重复，提高代码的可维护性。

一个典型的 X-Macro 的使用方式是定义一个宏，该宏接受一个或多个参数，并在不同的上下文中多次展开。

```cpp
#define COLOR_XMACRO \
  X(Red)             \
  X(Green)           \
  X(Blue)

// 定义枚举
enum Color {
#define X(name) name,
  COLOR_XMACRO
#undef X
};

// 定义字符串数组
const char* ColorNames[] = {
#define X(name) #name,
  COLOR_XMACRO
#undef X
};
```

在这个例子中，`COLOR_XMACRO` 宏定义了一个颜色列表。然后，通过在不同的上下文中展开 `X` 宏，我们生成了一个 `Color` 枚举和一个 `ColorNames` 字符串数组。

X-Macro 也可以用于更复杂的代码生成任务。

```cpp
#define PERSON_XMACRO  \
  X(std::string, Name) \
  X(int, Age)          \
  X(double, Height)

// 定义结构体
struct Person {
#define X(type, name) type name;
  PERSON_XMACRO
#undef X
};

// 序列化函数
std::string Serialize(const Person& p) {
  std::string result;
#define X(type, name) result += std::to_string(p.name) + " ";
  PERSON_XMACRO
#undef X
  return result;
}

// 反序列化函数（简化版）
void Deserialize(Person& p, const std::string& s) {
  std::istringstream iss(s);
#define X(type, name) iss >> p.name;
  PERSON_XMACRO
#undef X
}
```

在这个例子中，`PERSON_XMACRO` 定义了一个 `Person` 结构体的字段。然后，我们生成了该结构体的定义以及其序列化和反序列化函数。

1. **减少代码重复**: 通过在多个地方展开相同的宏，减少了代码重复。
2. **提高可维护性**: 如果需要添加、删除或修改某个元素，只需在一个地方进行更改。
3. **灵活性**: 可以在不同的上下文中以不同的方式展开相同的宏。
4. **可读性**: 对于不熟悉 X-Macro 的人来说，代码可能难以理解。
5. **调试困难**: 预处理器生成的代码可能难以调试。

总体来说，X-Macro 是一种非常强大的代码生成技术，尤其适用于需要生成重复或模式化代码的场景。然而，它也有一些缺点，如可能降低代码的可读性和可调试性。因此，在使用 X-Macro 时，应权衡其优缺点。

### 2.3 TokenKind实际使用

代码如下：

```cpp
#ifndef COCKTAIL_ENUM_BASE_TEST_KIND
#error "Must define the x-macro to use this file."
#endif

COCKTAIL_ENUM_BASE_TEST_KIND(Beep)
COCKTAIL_ENUM_BASE_TEST_KIND(Boop)
COCKTAIL_ENUM_BASE_TEST_KIND(Burr)

#undef COCKTAIL_ENUM_BASE_TEST_KIND

COCKTAIL_DEFINE_RAW_ENUM_CLASS(TestKind, uint8_t) {
#define COCKTAIL_ENUM_BASE_TEST_KIND(Name) COCKTAIL_RAW_ENUM_ENUMERATOR(Name)
#include "EnumBase.t.def"
};

class TestKind : public COCKTAIL_ENUM_BASE(TestKind) {
 public:
#define COCKTAIL_ENUM_BASE_TEST_KIND(Name) \
  COCKTAIL_ENUM_CONSTANT_DECLARATION(Name)
#include "EnumBase.t.def"

  using EnumBase::AsInt;
  using EnumBase::FromInt;
};

#define COCKTAIL_ENUM_BASE_TEST_KIND(Name) \
  COCKTAIL_ENUM_CONSTANT_DEFINITION(TestKind, Name)
#include "EnumBase.t.def"

COCKTAIL_DEFINE_ENUM_CLASS_NAMES(TestKind) = {
#define COCKTAIL_ENUM_BASE_TEST_KIND(Name) COCKTAIL_ENUM_CLASS_NAME_STRING(Name)
#include "EnumBase.t.def"
};
```

这段代码使用了 X-Macro 和其他预处理器宏来定义一个名为 `TestKind` 的枚举类，以及与之相关的一些功能。这里的 X-Macro 是 `COCKTAIL_ENUM_BASE_TEST_KIND`，它被用于定义枚举值（Beep、Boop、Burr）和其他相关的代码。

宏展开之后的样子: 

1. **定义原始枚举类**

```cpp
enum class TestKindRawEnum : uint8_t {
  Beep,
  Boop,
  Burr
};
```

2. **定义派生的枚举类**

```cpp
class TestKind : public EnumBase<TestKind, TestKindRawEnum, TestKindNames> {
public:
  static const TestKind Beep;
  static const TestKind Boop;
  static const TestKind Burr;

  using EnumBase::AsInt;
  using EnumBase::FromInt;
};
```

3. **定义命名常量**

```cpp
constexpr TestKind TestKind::Beep = TestKind::Create(TestKindRawEnum::Beep);
constexpr TestKind TestKind::Boop = TestKind::Create(TestKindRawEnum::Boop);
constexpr TestKind TestKind::Burr = TestKind::Create(TestKindRawEnum::Burr);
```

4. **定义枚举类名称数组**

```cpp
constexpr llvm::StringLiteral TestKindNames[] = {
  "Beep",
  "Boop",
  "Burr"
};
```

通过使用 X-Macro 和其他预处理器宏，这段代码成功地定义了一个名为 `TestKind` 的枚举类，该枚举类具有以下特性：

- 它有三个枚举值：Beep、Boop 和 Burr。
- 它继承自一个模板基类 `EnumBase`，该基类提供了一些额外的功能，如 `AsInt()` 和 `FromInt()` 方法。
- 它有一个与枚举值对应的名称数组 `TestKindNames`。

这样的设计提供了一种灵活、可复用的方式来创建和操作枚举类，同时也减少了代码重复和提高了可维护性。

EnumBase主要用于以复用宏的方式生成Token类型，在词法分析里，过去的`TokenKind`是这样：

```cpp
class TokenKind {
  enum class KindEnum : uint8_t {
#define COCKTAIL_TOKEN(TokenName) TokenName,
#include "Cocktail/Lexer/TokenRegistry.def"
  };

 public:
#define COCKTAIL_TOKEN(TokenName)                  \
  static constexpr auto TokenName() -> TokenKind { \
    return TokenKind(KindEnum::TokenName);         \
  }
#include "Cocktail/Lexer/TokenRegistry.def"

  TokenKind() = delete;

  friend auto operator==(const TokenKind& lhs, const TokenKind& rhs) -> bool {
    return lhs.kind_value_ == rhs.kind_value_;
  }

  friend auto operator!=(const TokenKind& lhs, const TokenKind& rhs) -> bool {
    return lhs.kind_value_ != rhs.kind_value_;
  }

  [[nodiscard]] auto Name() const -> llvm::StringRef;

  [[nodiscard]] auto IsKeyword() const -> bool;

  [[nodiscard]] auto IsSymbol() const -> bool;

  [[nodiscard]] auto IsGroupingSymbol() const -> bool;

  [[nodiscard]] auto IsOpeningSymbol() const -> bool;

  [[nodiscard]] auto IsClosingSymbol() const -> bool;

  [[nodiscard]] auto GetOpeningSymbol() const -> TokenKind;

  [[nodiscard]] auto GetClosingSymbol() const -> TokenKind;

  [[nodiscard]] auto GetFixedSpelling() const -> llvm::StringRef;

  [[nodiscard]] auto IsOneOf(std::initializer_list<TokenKind> kinds) const
      -> bool {
    for (TokenKind kind : kinds) {
      if (*this == kind) {
        return true;
      }
    }
    return false;
  }

  [[nodiscard]] auto IsSizedTypeLiteral() const -> bool;

  constexpr operator KindEnum() const { return kind_value_; }

  auto Print(llvm::raw_ostream& out) const -> void {
    out << GetFixedSpelling();
  }

 private:
  constexpr explicit TokenKind(KindEnum kind_value) : kind_value_(kind_value) {}

  KindEnum kind_value_;
};

auto TokenKind::Name() const -> llvm::StringRef {
  static constexpr llvm::StringLiteral Names[] = {
#define COCKTAIL_TOKEN(TokenName) #TokenName,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Names[static_cast<int>(kind_value_)];
}

auto TokenKind::IsKeyword() const -> bool {
  static constexpr bool Table[] = {
#define COCKTAIL_TOKEN(TokenName) false,
#define COCKTAIL_KEYWORD_TOKEN(TokenName, Spelling) true,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}

auto TokenKind::IsSymbol() const -> bool {
  static constexpr bool Table[] = {
#define COCKTAIL_TOKEN(TokenName) false,
#define COCKTAIL_SYMBOL_TOKEN(TokenName, Spelling) true,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}

auto TokenKind::IsGroupingSymbol() const -> bool {
  static constexpr bool Table[] = {
#define COCKTAIL_TOKEN(TokenName) false,
#define COCKTAIL_OPENING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, ClosingName) \
  true,
#define COCKTAIL_CLOSING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, OpeningName) \
  true,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}

auto TokenKind::IsOpeningSymbol() const -> bool {
  static constexpr bool Table[] = {
#define COCKTAIL_TOKEN(TokenName) false,
#define COCKTAIL_OPENING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, ClosingName) \
  true,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}

auto TokenKind::IsClosingSymbol() const -> bool {
  static constexpr bool Table[] = {
#define COCKTAIL_TOKEN(TokenName) false,
#define COCKTAIL_CLOSING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, OpeningName) \
  true,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}

auto TokenKind::IsSizedTypeLiteral() const -> bool {
  return *this == TokenKind::IntegerTypeLiteral() ||
         *this == TokenKind::UnsignedIntegerTypeLiteral() ||
         *this == TokenKind::FloatingPointTypeLiteral();
}

auto TokenKind::GetOpeningSymbol() const -> TokenKind {
  static constexpr TokenKind Table[] = {
#define COCKTAIL_TOKEN(TokenName) Error(),
#define COCKTAIL_CLOSING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, OpeningName) \
  OpeningName(),
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  auto result = Table[static_cast<int>(kind_value_)];
  // COCKTAIL_CHECK(result != Error()) << "Only closing symbols are valid!";
  return result;
}

auto TokenKind::GetClosingSymbol() const -> TokenKind {
  static constexpr TokenKind Table[] = {
#define COCKTAIL_TOKEN(TokenName) Error(),
#define COCKTAIL_OPENING_GROUP_SYMBOL_TOKEN(TokenName, Spelling, ClosingName) \
  ClosingName(),
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  auto result = Table[static_cast<int>(kind_value_)];
  // COCKTAIL_CHECK(result != Error()) << "Only closing symbols are valid!";
  return result;
}

auto TokenKind::GetFixedSpelling() const -> llvm::StringRef {
  static constexpr llvm::StringLiteral Table[] = {
#define COCKTAIL_TOKEN(TokenName) "",
#define COCKTAIL_SYMBOL_TOKEN(TokenName, Spelling) Spelling,
#define COCKTAIL_KEYWORD_TOKEN(TokenName, Spelling) Spelling,
#include "Cocktail/Lexer/TokenRegistry.def"
  };
  return Table[static_cast<int>(kind_value_)];
}
```

这里会更直观，类型变量存在类中，直接用于所有接口中的底层数据，但可复用性会降低。

使用EnumBase更新后的TokenKind如下：

```cpp
COCKTAIL_DEFINE_RAW_ENUM_CLASS(TokenKind, uint8_t) {
#define COCKTAIL_TOKEN(TokenName) COCKTAIL_RAW_ENUM_ENUMERATOR(TokenName)
#include "Cocktail/Lex/TokenKind.def"
};

class TokenKind : public COCKTAIL_ENUM_BASE(TokenKind) {
 public:
#define COCKTAIL_TOKEN(TokenName) COCKTAIL_ENUM_CONSTANT_DECLARATION(TokenName)
#include "Cocktail/Lex/TokenKind.def"

  /// 所有keyword token。
  static const llvm::ArrayRef<TokenKind> KeywordTokens;

  /// 检查此标记是否为简单的符号序列（如标点符号）。
  /// 这些符号可以直接出现在源代码中，并且可以使用starts_with进行词法分析。
  [[nodiscard]] auto is_symbol() const -> bool { return IsSymbol[AsInt()]; }

  /// 检查此标记是否为分组符号（如括号、大括号等），这些符号在标记流中必须匹配。
  [[nodiscard]] auto is_grouping_symbol() const -> bool {
    return IsGroupingSymbol[AsInt()];
  }

  /// 对于结束符号，返回其对应的开头符号。
  [[nodiscard]] auto opening_symbol() const -> TokenKind {
    auto result = OpeningSymbol[AsInt()];
    COCKTAIL_CHECK(result != Error) << "Only closing symbols are valid!";
    return result;
  }

  /// 检查此标记是否为分组的开头符号。
  [[nodiscard]] auto is_opening_symbol() const -> bool {
    return IsOpeningSymbol[AsInt()];
  }

  /// 对于开头符号，返回其对应的结束符号。
  [[nodiscard]] auto closing_symbol() const -> TokenKind {
    auto result = ClosingSymbol[AsInt()];
    COCKTAIL_CHECK(result != Error) << "Only opening symbol are valid!";
    return result;
  }

  /// 检查此标记是否为分组的结束符号。
  [[nodiscard]] auto is_closing_symbol() const -> bool {
    return IsClosingSymbol[AsInt()];
  }

  /// 检查此标记是否为单字符符号，且此字符不是其他符号的一部分。
  [[nodiscard]] auto is_one_char_symbol() const -> bool {
    return IsOneCharSymbol[AsInt()];
  };

  /// 检查此标记是否为关键字。
  [[nodiscard]] auto is_keyword() const -> bool { return IsKeyword[AsInt()]; };

  /// 检查此标记是否为带有大小的类型字面量（如整数、浮点数类型字面量）。
  [[nodiscard]] auto is_sized_type_literal() const -> bool {
    return *this == TokenKind::IntegerTypeLiteral ||
           *this == TokenKind::UnsignedIntegerTypeLiteral ||
           *this == TokenKind::FloatingPointTypeLiteral;
  };

  /// 如果此标记在源代码中有固定的拼写，则返回它。否则返回空字符串。
  [[nodiscard]] auto fixed_spelling() const -> llvm::StringRef {
    return FixedSpelling[AsInt()];
  };

  /// 获取此标记所对应的解析树节点的预期数量。
  [[nodiscard]] auto expected_parse_tree_size() const -> int {
    return ExpectedParseTreeSize[AsInt()];
  }

  /// 检查此标记是否在提供的列表中。
  [[nodiscard]] auto IsOneOf(std::initializer_list<TokenKind> kinds) const
      -> bool {
    for (TokenKind kind : kinds) {
      if (*this == kind) {
        return true;
      }
    }
    return false;
  }

 private:
  static const TokenKind KeywordTokensStorage[];

  static const bool IsSymbol[];
  static const bool IsGroupingSymbol[];
  static const bool IsOpeningSymbol[];
  static const TokenKind ClosingSymbol[];
  static const bool IsClosingSymbol[];
  static const TokenKind OpeningSymbol[];
  static const bool IsOneCharSymbol[];
  static const bool IsKeyword[];
  static const llvm::StringLiteral FixedSpelling[];
  static const int8_t ExpectedParseTreeSize[];
};

#define COCKTAIL_TOKEN(TokenName) \
  COCKTAIL_ENUM_CONSTANT_DEFINITION(TokenKind, TokenName)
#include "Cocktail/Lex/TokenKind.def"

constexpr TokenKind TokenKind::KeywordTokensStorage[] = {
#define COCKTAIL_KEYWORD_TOKEN(TokenName, Spelling) TokenKind::TokenName,
#include "Cocktail/Lex/TokenKind.def"
};

constexpr llvm::ArrayRef<TokenKind> TokenKind::KeywordTokens =
    KeywordTokensStorage;
```

## 3. 错误状态

## 4. commandline


// # 命令行参数解析库。
//
// 这是一个用于描述简单和相对复杂命令行界面，并基于这些描述解析参数的工具集合。它针对每次执行只解析一次参数的命令行工具进行了优化，特别是那些大量使用子命令样式命令行界面的工具。
//
// ## 本库使用的术语
//
// _参数_ 或 _arg_：命令行的一个解析组件。
//
// _选项_：一个以 `--` 开头的 _命名_ 参数，用于配置工具的某些方面。它们通常有长形式以 `--` 开头，还有短形式以 `-` 开头，可以与其他单字符选项一起捆绑使用。
//
// _标志_：布尔或二进制选项。它们只能启用或禁用。
//
// _位置参数_：根据在命令行中出现的顺序而不是名称来识别的参数，其中排除了选项。只有叶子命令可以包含位置参数。
//
// _值_：提供给参数的值参数。对于选项来说，这是在参数名称后面使用 `=` 提供的。对于位置参数来说，值就是唯一提供的内容。值的字符串根据参数的类型进行解析，遵循相对简单的规则。有关更多详细信息，请参阅参数构建器。
//
// _命令_：包含要解析的选项、子命令和位置参数以及成功时要执行的操作的容器。
//
// _叶子命令_：不包含子命令的命令。这是唯一可以包含位置参数的命令类型。
//
// _子命令_：嵌套在另一个命令中的命令，并由特定名称标识，该名称结束了基于父命令的参数解析，并切换到基于特定子命令的选项和位置参数解析。具有子命令的命令不能解析位置参数。
//
// _操作_：一个开放式回调，通常反映正在解析的特定子命令。可以直接执行操作，也可以仅标记所选操作。
//
// _元操作_：由参数解析完全处理的操作，例如显示帮助、版本信息或完成。
//
// 以下是一个示例命令，用于说明不同的组件：
//
//     git --no-pager clone --shared --filter=blob:none my-repo my-directory
//
// 这个命令分解为：
// - `git`：顶级命令。
// - `--no-pager`：在顶级命令 (`git`) 上的否定标志。
// - `clone`：一个子命令。
// - `--shared`：子命令 (`clone`) 的正标志。
// - `--filter=blob:none`：具有值 `blob:none` 的选项 `filter`。
// - `my-repo`：子命令的第一个位置参数。
// - `my-directory`：子命令的第二个位置参数。
//
// **注意：**虽然示例使用了 `git` 命令以使其相对熟悉和有文档记录，但该库不支持与 `git` 相同的标志语法，也不使用与解析的语法重叠的任何内容。此示例仅用于帮助澄清使用的术语，并经过谨慎选择，仅使用与此库解析语法重叠的语法。
//
// ## 选项和标志
//
// 该库支持的选项语法和行为旨在严格且相对简单，同时仍支持各种预期的用例：
//
// - 所有选项必须具有唯一的长名称，使用 `--` 前缀访问。名称必须由集合 [-a-zA-Z0-9] 中的字符组成，并且不能以 `-` 或 `no-` 开头。
//
// - 值始终使用名称后面的 `=` 附加。仅支持少量简单的值格式：
//   - 任意字符串
//   - 由 `llvm::StringRef` 解析的整数，其值适合于 `int`。
//   - 固定一组字符串之一
//
// - 选项可以多次解析，并且行为可以配置：
//   - 每次可以设置新值，覆盖任何先前的值。
//   - 它们可以将值附加到容器。
//   - TODO: 它们可以增加计数。
//
// - 选项可以具有默认值，即使在解析的命令行中没有出现它们，也将合成该值。
//
// - 标志（布尔选项）具有一些特殊规则。
//   - 它们可以正常拼写，默认为将该标志设置为 `true`。
//   - 它们还可以接受值，值必须完全是 `true` 或 `false`。
//   - 它们可以带有 `no-` 前缀，例如 `--no-verbose`，这与 `--verbose=false` 完全等效。
//   - 对于默认为 `true` 值的标志，在帮助中使用 `no-` 前缀呈现。
//
// - 选项还可以具有单个字符的短名称 [a-zA-Z]。
//   - 长名称和短名称之间的行为没有区别。
//   - 短名称只能指定标志的正值或 `true` 值。没有短名称的负值形式。
//   - 短名称在单个 `-` 之后解析，例如 `-v`。
//   - 可以在 `-` 后捆绑任意数量的布尔标志或具有默认值的选项的短名称，例如 `-xyz
