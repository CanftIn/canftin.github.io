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

这里的 `Printable` 类被设计为一个基类，用于实现可打印的对象，它期望子类实现一个 `Print` 接口。

### 1.1 `Printable` 类的用途和功能

1. **类型打印**: 通过 `Print` 接口，子类可以自定义如何将其内容打印到输出流。
2. **多种输出流支持**: 支持 `llvm::raw_ostream` 和 `std::ostream` 两种输出流。
3. **调试支持**: 提供了一个 `Dump` 方法，用于在调试时快速查看对象的状态。

假设有一个 `Person` 类，我们希望能够打印其信息：

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

现在，`Person` 类就可以使用 `Printable` 提供的所有功能。

```cpp
Person p("Alice", 30);
llvm::raw_ostream& os = llvm::outs();
os << p;  // 输出：Person { name: Alice, age: 30 }
```

### 1.2 介绍CRTP和Mixin

CRTP 是 C++ 中一种常用的编程模式，全名为“Curiously Recurring Template Pattern”，中文可以翻译为“奇异递归模板模式”。这个模式主要用于实现编译时多态性，也就是在编译时解析多态行为，而不是运行时。由于多态行为在编译时就被解析，因此运行时性能开销小。并且可以在基类中实现通用逻辑，减少代码重复。

在 CRTP 中，一个模板基类会以其派生类作为模板参数。这样，基类就可以在编译时知道其派生类的类型，基类就可以调用派生类的方法或访问其成员，即使这些方法或成员在基类中并没有被声明。

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

在这个例子中，`Base` 类有一个 `interface` 方法，它内部调用了 `implementation` 方法。这个 `implementation` 方法是在 `Derived` 类中定义的，但 `Base` 类可以通过 `static_cast` 安全地调用它。

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

### 1.3 LLVM输出流重载

LLVM 中 `llvm::raw_ostream` 是 LLVM 上的原始输出流。

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

### 2.3 TokenKind中的实际应用

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

EnumBase 主要用于以复用宏的方式生成Token类型，在词法分析里，不使用 EnumBase 的`TokenKind`是这样：

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

### 3.1 Error 相关类定义

```cpp
struct Success {};

class [[nodiscard]] Error : public Printable<Error> {
 public:
  /// 生成错误状态。
  explicit Error(llvm::Twine location, llvm::Twine message)
      : location_(location.str()), message_(message.str()) {
    COCKTAIL_CHECK(!message_.empty()) << "Errors must have a message.";
  }

  /// 生成不关联错误位置的错误状态。
  explicit Error(llvm::Twine message) : Error("", message) {}

  Error(Error&& other) noexcept
      : location_(std::move(other.location_)),
        message_(std::move(other.message_)) {}

  auto operator=(Error&& other) noexcept -> Error& {
    location_ = std::move(other.location_);
    message_ = std::move(other.message_);
    return *this;
  }

  auto Print(llvm::raw_ostream& out) const -> void {
    if (!location().empty()) {
      out << location() << ": ";
    }
    out << message();
  }

  /// 返回错误位置，错误位置的描述类似于"file.cc:123"。
  auto location() const -> const std::string& { return location_; }

  auto message() const -> const std::string& { return message_; }

 private:
  // error出现的位置。
  std::string location_;
  // 错误信息。
  std::string message_;
};
```

Success 是一个空结构体，表示操作成功。可能被用作函数的返回类型，表示没有错误。Error 类是一个表示错误的对象。它包含了错误发生的位置（例如文件名和行号）和一个错误消息。

```cpp
template <typename T>
class [[nodiscard]] ErrorOr {
 public:
  ErrorOr(Error err) : value_(std::move(err)) {}

  ErrorOr(T value) : value_(std::move(value)) {}

  auto ok() const -> bool { return std::holds_alternative<T>(value_); }

  auto error() const& -> const Error& {
    COCKTAIL_CHECK(!ok());
    return std::get<Error>(value_);
  }

  auto error() && -> Error {
    COCKTAIL_CHECK(!ok());
    return std::get<Error>(std::move(value_));
  }

  auto operator*() -> T& {
    COCKTAIL_CHECK(ok());
    return std::get<T>(value_);
  }

  auto operator*() const -> const T& {
    COCKTAIL_CHECK(ok());
    return std::get<T>(value_);
  }

  auto operator->() -> T* {
    COCKTAIL_CHECK(ok());
    return &std::get<T>(value_);
  }

  auto operator->() const -> const T* {
    COCKTAIL_CHECK(ok());
    return &std::get<T>(value_);
  }

 private:
  std::variant<Error, T> value_;
};
```

ErrorOr 类模板表示要么一个 Error 要么一个成功的值。使用 C++17 的 `std::variant` 来存储要么是一个 Error 要么是一个 T 类型的值。提供了检查是否成功的方法，以及获取错误或值的方法。并且重载了指针和解引用操作符来方便地访问值。

```cpp
class ErrorBuilder {
 public:
  explicit ErrorBuilder(std::string location = "")
      : location_(std::move(location)),
        out_(std::make_unique<llvm::raw_string_ostream>(message_)) {}

  template <typename T>
  [[nodiscard]] auto operator<<(const T& message) && -> ErrorBuilder&& {
    *out_ << message;
    return std::move(*this);
  }

  template <typename T>
  auto operator<<(const T& message) & -> ErrorBuilder& {
    *out_ << message;
    return *this;
  }

  operator Error() { return Error(location_, message_); }

  template <typename T>
  operator ErrorOr<T>() {
    return Error(location_, message_);
  }

 private:
  std::string location_;
  std::string message_;
  std::unique_ptr<llvm::raw_string_ostream> out_;
};
```

ErrorBuilder 类用于构建错误消息。它提供了一个流式API，允许用户逐步构建一个错误消息。使用LLVM的raw_string_ostream类来构建字符串。重载了左移操作符来追加到错误消息。提供了转换操作符来从建造器创建一个Error或ErrorOr。

### 3.2 Error 的使用

基于前面对 `Error` 和 `ErrorOr` 类的介绍，下面的代码展示了如何在实践中使用这两个类以及相关的工具。我们将逐段进行分析：

**1. 使用 `ErrorOr`**

```cpp
ErrorOr<int> err(Error("test"));
EXPECT_FALSE(err.ok());
EXPECT_EQ(err.error().message(), "test");
```

- 这里首先构建了一个类型为 `int` 的 `ErrorOr` 对象，但是给定了一个错误，而不是成功的值。
- 接着验证这个 `ErrorOr` 对象不表示一个成功的操作（使用 `ok()` 方法）。
- 最后检查错误消息是否与预期相符。

**2. 使用 `ErrorBuilder`**

```cpp
ErrorOr<int> result1 = ErrorBuilder() << "msg";
ASSERT_FALSE(result1.ok());
EXPECT_EQ(result1.error().message(), "msg");

auto result2 = static_cast<Error>(ErrorBuilder("TestFunc") << "msg");
std::string result2_output;
llvm::raw_string_ostream oss(result2_output);
result2.Print(oss);
EXPECT_EQ(oss.str(), "TestFunc: msg");
```

- 使用 `ErrorBuilder` 来构建错误消息。`ErrorBuilder` 允许我们流式地构建错误消息。
- `result1` 包含了一个错误，其消息为 "msg"。
- 对于 `result2`，我们为 `ErrorBuilder` 提供了一个位置 `"TestFunc"` 并追加了一个错误消息。
- 使用 `Print` 方法将 `result2` 的错误消息输出到 `llvm::raw_string_ostream`，然后验证它的内容是否符合预期。

**3. 使用 `COCKTAIL_ASSIGN_OR_RETURN` 宏**

```cpp
auto result = []() -> ErrorOr<int> {
  COCKTAIL_ASSIGN_OR_RETURN(int a, ErrorOr<int>(1));
  COCKTAIL_ASSIGN_OR_RETURN(const int b, ErrorOr<int>(2));
  int c = 0;
  COCKTAIL_ASSIGN_OR_RETURN(c, ErrorOr<int>(3));
  return a + b + c;
}();
ASSERT_TRUE(result.ok());
EXPECT_EQ(6, *result);
```

- 这里定义了一个 lambda 函数，返回类型为 `ErrorOr<int>`。
- 使用 `COCKTAIL_ASSIGN_OR_RETURN` 宏，我们尝试从 `ErrorOr` 对象中提取值并将其分配给变量。如果 `ErrorOr` 对象包含错误，宏将从当前函数返回这个错误。
- 在此例中，我们成功地从三个 `ErrorOr` 对象中提取了值，并将这些值相加。
- 最后验证了结果是否符合预期。

`Error` 和 `ErrorOr` 类以及相关的工具和宏提供了一个结构化、类型安全的方法来处理错误。它们使得我们可以明确地表示函数可能的错误，而不是使用例如异常或特殊返回值等传统的错误处理方法。这种方法特别适合于那些不使用或限制使用异常的项目。
