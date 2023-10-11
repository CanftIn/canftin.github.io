---
title: "LLVM源码分析系列(0): formatv"
date: 2023-10-10T16:03:07+08:00
lastmod: 2023-10-10T16:03:07+08:00
author: ["矩木"]
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

这篇文章作为LLVM源码分析系列的开篇，初步介绍LLVM中format的相关机制和原理，format在LLVM中较为容易理解，从这里启航，后续慢慢剖析LLVM中的实现。

## 1. 关于代码格式化

在讲这篇文章之前，首先要讲讲 format 到底是什么，在不同的语言中以及不同的库中，它的输出形式是什么样子，如何对程序员友好的输出 format，以及关于它的性能。

### 1.1 什么是 format

在大多数现代语言中都提供了基本的 format 即格式化操作，在 Rust 中，格式化字符串和其他数据主要通过 `std::fmt` 模块和 `println!` 宏实现。

```rust
struct Point {
    x: i32,
    y: i32,
}

impl std::fmt::Display for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

let point = Point { x: 5, y: 10 };
println!("{}", point);  // 输出: (5, 10)
```

以上，`std::fmt::Formatter` 类型提供了一系列方法和选项，为用户友好的输出格式化类型。`std::fmt` 提供的功能允许用户以各种方式格式化和显示数据，使 Rust 代码更具可读性。

```rust
let name = "world";
let message = format!("Hello, {}!", name);
let num = 15;
let x = 10;
let ref_to_x = &x;
println!("{}", message);
println!("{:b}", num);  // 输出二进制: 1111
println!("{:o}", num);  // 输出八进制: 17
println!("{:x}", num);  // 输出小写十六进制: f
println!("{:p}", ref_to_x);  // 输出 x 的引用的内存地址
println!("{:e}", num);  // 输出小写的科学记数法
```
Rust 的 `format!` 宏提供了类型安全的字符串格式化。这意味着编译时会检查格式字符串与给定参数是否匹配，有助于避免许多常见的运行时错误。

Go 的 `fmt` 包提供了格式化 I/O 功能，其中包括了各种函数如 `Println()`, `Printf()`, `Sprint()` 等。
```go
import "fmt"

func main() {
    name := "world"
    message := fmt.Sprintf("Hello, %s!", name)
    fmt.Println(message)
}
```
`Sprintf` 用于格式化并返回一个字符串。Go 的格式化是反射驱动的，为多种类型提供了强大的格式化选项。

在 C# 中，字符串格式化的主要方式是 `string.Format()` 方法和 `$` 字符串插值（从 C# 6 开始）。
```csharp
using System;

public class HelloWorld {
    public static void Main() {
        string name = "world";
        string message = String.Format("Hello, {0}!", name);
        Console.WriteLine(message);
    }
}
```
`String.Format` 方法提供了一个格式化字符串和参数列表，并返回格式化后的字符串。该方法在运行时检查格式与参数是否匹配，并提供了各种格式化选项，例如日期、货币和自定义格式化。

Python 提供了多种字符串格式化方法，如 `%` 格式化、`str.format()` 和 f-strings。f-strings 是 Python 3.6 之后引入的，提供了简洁的内嵌表达式插值。
```python
name = "world"
message = "Hello, {}!".format(name)
print(message)
```
或使用 f-string (Python 3.6+):
```python
name = "world"
message = f"Hello, {name}!"
print(message)
```

而在 C++ 中，C++ 的标准输出流（如 `std::cout`、`std::cerr`）与流操作符（如 `<<`）结合使用，提供了一种顺序、连续的方式来输出数据。

通过流操作符可以轻松地链式输出各种数据类型。但是格式化能力相对有限。例如，设置字段宽度、填充字符和精度通常需要先设置特定的 I/O 操作符或成员函数。

C++20 已经引入了 std::format，基于github上的 [fmtlib](https://github.com/fmtlib/fmt) 库，format 提供了一种更加灵活、描述性强、类型安全的格式化字符串的方法，能够使用更丰富的格式选项来构造字符串。例如：

```cpp
std::string message = std::format("Hello, {}!", "world");
```

以上介绍了几种不同语言中的format，总而言之，各种语言中的 `format` 功能都是为了使字符串格式化变得更加简单、安全和强大。

### 1.2 LLVM 的 `formatv` 字符串格式化

LLVM 虽然不经常进行大量的字符串操作和解析，但进行了大量的字符串格式化。从诊断信息、到 LLVM 工具的输出，例如 `llvm-readobj`，再到打印详细的反汇编列表和 LLDB 运行时日志，都需要字符串格式化。

`formatv` 在使用上类似于 `printf`，但使用了不同的语法，该语法主要受到 Python 和 C# 的影响。但不同于 `printf`，它在编译时推断要格式化的类型，因此不需要像 `%d` 这样的格式说明符。这减少了尝试构造可移植格式字符串的心智负担，特别是对于平台特定类型，如 `size_t` 或指针类型。与 `printf` 和 Python 都不同，如果 LLVM 不知道如何格式化该类型，它还会失败并不编译。以上这两个属性确保该函数比传统的格式化方法（如 `printf` 函数族）更安全、更简单。

**使用 llvm format 的方式：**
- 调用 `formatv` 包括一个由 0 个或多个替换序列组成的格式字符串，后跟一个可变长度的替换值列表。
- 替换序列是 `{N[[,align]:style]}` 形式的字符串。
- `N` 是替换值列表中的参数的 0 为索引。这意味着可以多次、可能使用不同的样式和/或对齐选项、以任何顺序引用相同的参数。

**自定义格式化：**

有两种方法可以自定义类型的格式化行为。

1. 为类型 `T` 提供 `llvm::format_provider<T>` 的模板特化，以及相应的静态格式化方法。

```cpp
namespace llvm {
  template<>
  struct format_provider<MyFooBar> {
    static void format(const MyFooBar &V, raw_ostream &Stream, StringRef Style) {
      // Do whatever is necessary to format `V` into `Stream`
    }
  };
  void foo() {
    MyFooBar X;
    std::string S = formatv("{0}", X);
  }
}
```
这是一种有用的扩展性机制，用于为用户自定义类型添加支持自定义选项的格式化。但当想要扩展已知如何格式化的类型的机制时，则需要其他方法。

2. 提供从 `llvm::FormatAdapter<T>` 继承的格式化适配器。

```cpp
namespace anything {
  struct format_int_custom : public llvm::FormatAdapter<int> {
    explicit format_int_custom(int N) : llvm::FormatAdapter<int>(N) {}
    void format(llvm::raw_ostream &Stream, StringRef Style) override {
      // Do whatever is necessary to format ``this->Item`` into ``Stream``
    }
  };
}
namespace llvm {
  void foo() {
    std::string S = formatv("{0}", anything::format_int_custom(42));
  }
}
```

如果检测到类型是从 `FormatAdapter<T>` 派生出来的，`formatv` 将在传入指定样式的参数上调用格式化方法。这允许为任何类型提供自定义格式化，包括已经具有内置格式化提供程序的类型。

**formatv 示例：**

以下提供了一组示例，演示了 `formatv` 的用法。

```cpp
std::string S;
// 对基本类型和隐式字符串转换的简单格式化。
S = formatv("{0} ({1:P})", 7, 0.35);  // S == "7 (35.00%)"

// 乱序引用和多重引用
outs() << formatv("{0} {2} {1} {0}", 1, "test", 3); // 输出 "1 3 test 1"

// 左、右和中心对齐
S = formatv("{0,7}",  'a');  // S == "      a";
S = formatv("{0,-7}", 'a');  // S == "a      ";
S = formatv("{0,=7}", 'a');  // S == "   a   ";
S = formatv("{0,+7}", 'a');  // S == "      a";

// 自定义样式
S = formatv("{0:N} - {0:x} - {1:E}", 12345, 123908342); // S == "12,345 - 0x3039 - 1.24E8"

// 适配器
S = formatv("{0}", fmt_align(42, AlignStyle::Center, 7));  // S == "  42   "
S = formatv("{0}", fmt_repeat("hi", 3)); // S == "hihihi"
S = formatv("{0}", fmt_pad("hi", 2, 6)); // S == "  hi      "

// 范围
std::vector<int> V = {8, 9, 10};
S = formatv("{0}", make_range(V.begin(), V.end())); // S == "8, 9, 10"
S = formatv("{0:$[+]}", make_range(V.begin(), V.end())); // S == "8+9+10"
S = formatv("{0:$[ + ]@[x]}", make_range(V.begin(), V.end())); // S == "0x8 + 0x9 + 0xA"
```

这些示例展示了 `formatv` 的使用方式，可用于灵活和类型安全地格式化字符串。


**`formatv` 示例：**
```cpp
std::string S;
S = formatv("{0} ({1:P})", 7, 0.35);  // S == "7 (35.00%)"
// ... (其他示例)
S = formatv("{0:$[ + ]@[x]}", make_range(V.begin(), V.end())); // S == "0x8 + 0x9 + 0xA"
```

**llvm formatv 对比 printf 的好处：**
- 比传统的 `printf` 更安全、简单。
- 类型安全，防止格式化错误。
- 更易于构造可移植的格式字符串。

**llvm formatv 与 fmtlib 的不同：**
- `formatv` 有着与 Python 和 C# 类似的格式化语法，而 `fmtlib` 的语法受到 Python 的 `str.format()` 的影响。
- `formatv` 在编译时推断格式化类型，而 `fmtlib` 也提供了相似的类型安全特性。
- `formatv` 的扩展性可能与 `fmtlib` 有所不同，因为它们采用了不同的方法来实现自定义格式化。

总的来说，`formatv` 提供了一个强大而类型安全的方式来格式化字符串，并具有与其他格式化方法不同的特性和优点。

## 2. formatv的极简实现

以下我提供一个简单的format实现：

```cpp
template <typename... Args>
auto Format(const char* formatter, const Args&... args) -> std::string;

template <typename... Args>
auto Format(const std::string& formatter, const Args&... args) -> std::string;

template <typename... Args>
auto PrintFormatted(const char* formatter, const Args&... args) -> void;

template <typename... Args>
auto PrintFormatted(const std::string& formatter, const Args&... args) -> void;

inline auto IsDigit(char c) -> bool { return c >= '0' && c <= '9'; }

inline auto Consume(const char*& s) -> char {
  assert(*s);
  return *(s++);
}

inline auto ConsumeIf(const char*& s, char c) -> bool {
  assert(c != '\0');
  if (*s == c) {
    ++s;
    return true;
  }
  return false;
}

class FormatError : public std::runtime_error {
 public:
  explicit FormatError(const std::string& msg) : std::runtime_error(msg) {}
};

inline void FormatAssert(bool pred, std::string msg = "Unknown format error.") {
  if (!pred) {
    throw FormatError(msg);
  }
}

template <typename Stream, typename... Args>
auto FormatImpl(Stream& output, const std::string& formatter,
                const Args&... args) -> void {
  static_assert(sizeof...(args) < 11, "Only support 10 args.");

  if (formatter.empty()) {
    return;
  }

  constexpr auto ArgsCount = sizeof...(args);
  std::function<void(Stream&)> helpers[10] = {[&](auto& ss) { ss << args; }...};

  size_t next_id = 0;
  for (const auto* p = formatter.c_str(); *p;) {
    if (ConsumeIf(p, '{')) {
      if (ConsumeIf(p, '{')) {
        output.put('{');
      } else {
        size_t id;
        if (ConsumeIf(p, '}')) {
          id = next_id++;
        } else {
          assert(IsDigit(*p));
          id = Consume(p) - '0';
          FormatAssert(id >= 0 && id <= 9,
                       "Argument id must be within [0,10).");
          FormatAssert(id < ArgsCount, "Not enough arguments.");

          FormatAssert(ConsumeIf(p, '}'), "Invalid argument reference.");
        }
        helpers[id](output);
      }
    } else if (ConsumeIf(p, '}')) {
      if (ConsumeIf(p, '}')) {
        output.put('}');
      } else {
        FormatAssert(false, "An isolated closing brace is not allowed.");
      }
    } else {
      output.put(Consume(p));
    }
  }
}

template <typename... Args>
auto Format(const char* formatter, const Args&... args) -> std::string {
  std::stringstream ss;
  FormatImpl(ss, formatter, args...);
  return ss.str();
}

template <typename... Args>
auto PrintFormatted(const char* formatter, const Args&... args) -> void {
  FormatImpl(std::cout, formatter, args...);
}
```

这段代码实现了一种类似于字符串格式化的机制，它允许使用占位符来动态替换字符串中的值。该机制包括两个主要函数模板：`Format` 和 `PrintFormatted`，以及相关的辅助函数。

逐步详细分析这段代码：

### 2.1 辅助函数 `FormatAssert`

`FormatAssert` 是一个辅助函数，用于在断言失败时抛出 `FormatError` 异常。这个函数的目的是确保断言的条件为真，如果条件为假，就会抛出异常。用于检查格式字符串的有效性和参数的合法性。

### 2.2 函数模板 `FormatImpl`

`FormatImpl` 是一个模板函数，接受一个输出流（通常是 `std::stringstream` 或 `std::cout`）以及一个格式字符串和一系列参数。它的主要任务是解析格式字符串并根据参数的数量和格式进行替换，然后将结果输出到给定的输出流。

函数内部的关键部分是解析格式字符串的循环。它遍历格式字符串的每个字符，根据字符的不同来执行不同的操作：

- 如果遇到双花括号 `{{`，则输出一个单独的花括号 `{`。
- 如果遇到花括号 `{`，则开始解析占位符。
- 占位符中可以包含占位符索引，例如 `{0}`、`{1}`，或者可以省略，例如 `{}`。
- 解析占位符时，首先检查是否有索引，如果没有则使用下一个可用索引。
- 然后根据索引查找对应的参数，并使用参数的类型的 `<<` 操作符将参数添加到输出流中。
- 如果占位符不是合法的格式，例如 `{10}`，或者没有正确的闭合括号，将会抛出异常。

### 2.3 函数模板 `Format` 和 `PrintFormatted`

这两个函数是对 `FormatImpl` 函数的封装，使其更加方便地使用。

- `Format` 函数接受一个格式字符串和一系列参数，然后创建一个 `std::stringstream` 对象，在其中使用 `FormatImpl` 将格式化后的字符串放入流中，并返回最终的格式化结果作为一个字符串。
- `PrintFormatted` 函数接受一个格式字符串和一系列参数，然后直接使用 `FormatImpl` 将格式化后的内容输出到标准输出流 `std::cout`。

这两个函数使得使用格式化字符串更加方便。

### 2.4 测试使用

```cpp
std::string yield = Format("a({},{},{},{})", 1, 2.2, '3', "\"4\"");
std::string yield = Format("{{{0}}}", "text");
std::string yield = Format("{{{0}, {2}", "foo", "bar", "baz");
std::string yield = Format("test-{2}{1}{0}", 11, 22, 33);
std::string yield = Format("{}{}{0}!!", 11, 22);
```

这个简易实现代码的问题在于它只能接受10个 id，只是在字符串语法层面完成了基础的功能，接下来我们看一下llvm format的实现。

## 3. LLVM formatv源码分析

LLVM formatv使用了LLVM Support 和 ADT 库做支持。这里我提供抽离出 LLVM format 组件后的仓库：[https://github.com/CanftIn/formatv](https://github.com/CanftIn/formatv)，这个修改后的format库仅依赖于标准库，便于我们进行代码分析。

### 3.1 FormatVariadicDetails

```cpp
// 这是一个模板结构，充当自定义的格式提供者。
// 用户应该为特定的类型特化这个模板以提供格式化功能。
template <typename T, typename Enable = void>
struct FormatProvider {};

namespace Internal {

// 它是一个抽象基类，定义了一个纯虚函数format。所有适配器类都需要继承这个基类并实现这个函数。
class FormatAdapter {
 public:
  virtual void format(std::ostream& os, std::string options) = 0;

 protected:
  virtual ~FormatAdapter() = default;

 private:
  virtual void anchor() {}
};

// ProviderFormatAdapter 和 StreamOperatorFormatAdapter 类: 
// 这两个类都是FormatAdapter的具体子类。
//
// ProviderFormatAdapter使用FormatProvider为特定类型进行格式化，
// 而StreamOperatorFormatAdapter则使用流插入运算符(<<)为类型进行格式化。
template <typename T>
class ProviderFormatAdapter : public FormatAdapter {
 public:
  explicit ProviderFormatAdapter(T&& item) : item_(std::forward<T>(item)) {}

  void format(std::ostream& os, std::string options) override {
    FormatProvider<std::decay_t<T>>::format(item_, os, options);
  }

 private:
  T item_;
};

template <typename T>
class StreamOperatorFormatAdapter : public FormatAdapter {
 public:
  explicit StreamOperatorFormatAdapter(T&& item)
      : item_(std::forward<T>(item)) {}

  void format(std::ostream& os, std::string /*options*/) override {
    os << item_;
  }

 private:
  T item_;
};

template <typename T>
class MissingFormatAdapter;

template <typename T, T>
struct SameType;

// HasFormatProvider 和 HasStreamOperator 类:
// 这两个模板结构用于检查一个给定的类型是否有与FormatProvider或流插入运算符相关的格式化功能。
// FormatProvider should have the signature:
//   static void format(const T&, raw_stream &, StringRef);
template <class T>
class HasFormatProvider {
 public:
  using Decayed = std::decay_t<T>;
  using SignatureFormat = void (*)(const Decayed&, std::ostream&, std::string);

  template <typename U>
  static auto test(SameType<SignatureFormat, &U::format>*) -> char;

  template <typename U>
  static auto test(...) -> double;

  static constexpr bool const Value =
      (sizeof(test<FormatProvider<Decayed>>(nullptr)) == 1);
};

template <class T>
class HasStreamOperator {
 public:
  using ConstRefT = const std::decay_t<T>&;

  template <typename U>
  static auto test(
      std::enable_if_t<std::is_same_v<decltype(std::declval<std::ostream&>()
                                               << std::declval<U>()),
                                      std::ostream&>,
                       int*>) -> char;

  template <typename U>
  static auto test(...) -> double;

  static constexpr bool const Value = (sizeof(test<ConstRefT>(nullptr)) == 1);
};

// Uses* 结构:
// 这些结构根据上面的检查，决定哪种适配器应该用于给定的类型。
template <typename T>
struct UsesFormatMember
    : public std::integral_constant<
          bool, std::is_base_of_v<FormatAdapter, std::remove_reference_t<T>>> {
};

template <typename T>
struct UsesFormatProvider
    : public std::integral_constant<bool, !UsesFormatMember<T>::value &&
                                              HasFormatProvider<T>::Value> {};

template <typename T>
struct UsesStreamOperator
    : public std::integral_constant<bool, !UsesFormatMember<T>::value &&
                                              !UsesFormatProvider<T>::value &&
                                              HasStreamOperator<T>::Value> {};

template <typename T>
struct UsesMissingProvider
    : public std::integral_constant<bool, !UsesFormatMember<T>::value &&
                                              !UsesFormatProvider<T>::value &&
                                              !HasStreamOperator<T>::Value> {};

// build_format_adapter 函数模板:
// 这是一个函数模板的重载集合，根据对象的类型选择合适的格式适配器，
// 并将对象传递给适配器进行格式化。它使用SFINAE来选择适当的重载版本，
// 根据对象是否满足不同的格式化要求。
template <typename T>
auto build_format_adapter(T&& item)
    -> std::enable_if_t<UsesFormatMember<T>::value, T> {
  return std::forward<T>(item);
}

template <typename T>
auto build_format_adapter(T&& item)
    -> std::enable_if_t<UsesFormatProvider<T>::value,
                        ProviderFormatAdapter<T>> {
  return ProviderFormatAdapter<T>(std::forward<T>(item));
}

template <typename T>
auto build_format_adapter(T&& item)
    -> std::enable_if_t<UsesStreamOperator<T>::value,
                        StreamOperatorFormatAdapter<T>> {
  return StreamOperatorFormatAdapter<T>(std::forward<T>(item));
}

template <typename T>
auto build_format_adapter(T&& item)
    -> std::enable_if_t<UsesMissingProvider<T>::value,
                        MissingFormatAdapter<T>> {
  return MissingFormatAdapter<T>(std::forward<T>(item));
}

}  // namespace Internal
```

这里先简单讲一下上面用到的适配器模式。

**1. 适配器模式简单示例：**

假设我们有一个旧的系统，其中有一个 `OldPrinter` 类可以打印简单的文本消息。现在我们想要一个新的打印机类 `NewPrinter`，它可以打印富文本。但我们不想改变旧代码。我们可以使用适配器模式来实现这一目标。

```cpp
// 旧的打印机
class OldPrinter {
public:
    void printSimpleMessage(const std::string& msg) {
        std::cout << msg << std::endl;
    }
};

// 新的打印机
class NewPrinter {
public:
    void printRichMessage(const std::string& msg) {
        // 假设这里有一些富文本处理
        std::cout << "<rich>" << msg << "</rich>" << std::endl;
    }
};

// 适配器
class PrinterAdapter : public OldPrinter {
    NewPrinter newPrinter;
public:
    void printSimpleMessage(const std::string& msg) override {
        newPrinter.printRichMessage(msg);
    }
};

int main() {
    PrinterAdapter adaptedPrinter;
    adaptedPrinter.printSimpleMessage("Hello, Adapter Pattern!");
    return 0;
}
```

输出：
```html
<rich>Hello, Adapter Pattern!</rich>
```

**2. 大型项目实际使用的代码例子：**

在大型项目中，数据库迁移是一个常见的场景。假设我们的项目最初使用 SQLite，但现在想迁移到 PostgreSQL。这两个数据库在某些查询语法上可能有所不同。我们可以使用适配器模式来确保代码的一致性。

首先，定义一个数据库接口：
```cpp
class Database {
public:
    virtual void connect() = 0;
    virtual void query(const std::string& q) = 0;
};

class SQLite : public Database {
    // 实现SQLite的具体逻辑
};

class PostgreSQL : public Database {
    // 实现PostgreSQL的具体逻辑
};

class DatabaseAdapter : public SQLite {
    PostgreSQL pg;
public:
    void connect() override {
        pg.connect();
    }
    
    void query(const std::string& q) override {
        // 可能需要将SQLite的查询语法转换为PostgreSQL的查询语法
        pg.query(convertQuery(q));
    }
    
    std::string convertQuery(const std::string& q) {
        // 实现转换逻辑
        return q;
    }
};
```

在上面提供的 `format` 代码部分中，适配器模式的使用有其特定的优点：

1. **统一格式化接口：** 虽然不同的数据类型可能有不同的格式化需求和实现，但使用适配器模式可以为所有这些类型提供统一的格式化接口。这意味着无论数据类型的内部如何，调用代码只需知道如何与`FormatAdapter`接口交互。

2. **解耦：** 适配器模式允许将数据类型的具体格式化逻辑从其使用方式中分离出来。这意味着，如果某个类型的格式化逻辑需要更改，那么只需要更改相应的适配器或 `FormatProvider`，而不需要更改调用格式化功能的其他部分。

3. **灵活性：** 使用适配器模式，可以轻松地为不支持默认格式化（例如流运算符）的类型提供自定义的格式化方法。

4. **扩展性：** 如果在未来需要添加对新的数据类型或格式化方法的支持，只需添加新的 `FormatProvider` 或适配器，而无需修改现有的调用代码。

5. **可维护性：** 由于格式化逻辑与其使用方式分离，因此更容易维护。对一个类型的格式化逻辑的更改不会影响其他类型或调用代码。

6. **降低复杂性：** 通过提供一个统一的接口和几个适配器，可以将复杂的格式化决策和逻辑隐藏在适配器模式的实现中，从而降低客户端代码的复杂性。

7. **更好的代码组织：** 有了明确的结构和分离的职责，代码组织得更加清晰。每个适配器或 `FormatProvider` 都有其明确的目的，使得开发人员更容易理解和跟踪代码的工作方式。

总的来说，适配器模式提供了一种灵活、扩展性强并且易于维护的方法，来处理可能存在的不同的格式化需求。

### 3.2 FormatAlign

```cpp
enum class AlignStyle : uint8_t {
  Left,    // "-"
  Center,  // "="
  Right,   // "+"
};

struct FormatAlign {
  Internal::FormatAdapter& adapter_; // 引用要格式化并对齐的FormatAdapter。
  AlignStyle where_; // 一个指示如何对齐输出的AlignStyle枚举值。
  size_t amount_; // 指示总共需要多少字符宽度的大小。
  char fill_; // 当输出的文本不足指定的字符宽度时，用来填充的字符，默认为空格。

  FormatAlign(Internal::FormatAdapter& adapter, AlignStyle where, size_t amount,
              char fill = ' ')
      : adapter_(adapter), where_(where), amount_(amount), fill_(fill) {}

  void format(std::ostream& os, std::string options) {
    if (amount_ == 0) {
      adapter_.format(os, options);
      return;
    }

    std::ostringstream stream;

    adapter_.format(stream, options);

    std::string item = stream.str();
    if (amount_ <= item.size()) {
      os << item;
      return;
    }

    size_t pad_amount = amount_ - item.size();
    switch (where_) {
      case AlignStyle::Left:
        os << item;
        fill(os, pad_amount);
        break;
      case AlignStyle::Center: {
        size_t x = pad_amount / 2;
        fill(os, x);
        os << item;
        fill(os, pad_amount - x);
        break;
      }
      default:
        fill(os, pad_amount);
        os << item;
        break;
    }
  }

 private:
  void fill(std::ostream& os, uint32_t count) {
    for (uint32_t i = 0; i < count; ++i) {
      os << fill_;
    }
  }
};
```

这段代码定义了一个关于文本对齐的功能。它能够对 `FormatAdapter` 的输出进行对齐。

1. **AlignStyle 枚举类：**
    - 这是一个指示对齐方式的枚举。有三种对齐方式：左对齐、居中和右对齐，它们被标记为 "-", "=" 和 "+"。

2. **FormatAlign 结构体：**
    - 这个结构体的目的是对一个给定的 `FormatAdapter` 的输出进行对齐。

    - `format` 方法是这个结构体的核心，它的目的是首先使用 `adapter_` 来获取要对齐的字符串，并将其对齐到指定的宽度 `amount_`。具体的对齐方式取决于 `where_` 成员的值。
    
    - `fill` 是一个私有的辅助函数，用于在 `std::ostream` 中插入指定数量的 `fill_` 字符。

此部分代码允许用户指定文本的对齐方式和宽度，并选择填充字符。例如，用户可能希望将数字对齐到右侧，使用空格作为填充字符，以使所有数字都能在相同的宽度内对齐。

假设有一个可以使用 `FormatAdapter` 接口的数字，并且将这个数字格式化为10个字符宽，并将其居中对齐，使用 '.' 作为填充字符：

```cpp
#include <iostream>

int main() {
    std::ostringstream num_stream;
    num_stream << 12345;

    Internal::FormatAdapter adapter;
    FormatAlign align(adapter, AlignStyle::Center, 10, '.');
    
    std::ostringstream final_stream;
    align.format(final_stream, "");
    std::cout << final_stream.str() << std::endl;  // 输出: "...12345..."
    
    return 0;
}
```

### 3.3 FormatVariadic

```cpp
// 格式化字符串中的替换操作类型。
enum class ReplacementType : uint8_t {
  Empty, // 表示没有替换。
  Format, // 表示应该格式化和替换的项目。
  Literal, // 表示应原样插入的字符串字面量。
};

// 保存每个替换项的格式说明详情。
struct ReplacementItem {
  ReplacementItem() = default;
  explicit ReplacementItem(std::string literal)
      : type(ReplacementType::Literal), spec(std::move(literal)) {}
  ReplacementItem(std::string spec, size_t index, size_t align,
                  AlignStyle where, char pad, std::string options)
      : type(ReplacementType::Format),
        spec(std::move(spec)),
        index(index),
        align(align),
        where(where),
        pad(pad),
        options(std::move(options)) {}

  // 替换的类型。
  ReplacementType type = ReplacementType::Empty;
  // 来自格式的原始字符串。
  std::string spec;
  // 要替换的值的索引。
  size_t index = 0;
  // align, where, pad: 对齐的规格说明。
  size_t align = 0; // 对齐大小。
  AlignStyle where = AlignStyle::Right; // 对齐样式。
  char pad = 0; // 填充字符。
  // 替换项的其他格式选项。
  std::string options;
};

class FormatvObjectBase;

auto operator<<(std::ostream& os, const FormatvObjectBase& obj)
    -> std::ostream&;

// 用于格式化对象的基类。
class FormatvObjectBase {
 public:
  FormatvObjectBase(const FormatvObjectBase&) = delete;
  auto operator=(const FormatvObjectBase&) -> FormatvObjectBase& = delete;

  // 根据替换项格式化字符串并将其写入给定的ostream。
  void format(std::ostream& os) const {
    for (auto& r : ParseFormatString(fmt_)) {
      switch (r.type) {
        case ReplacementType::Empty:
          continue;
        case ReplacementType::Literal:
          os << r.spec;
          continue;
        case ReplacementType::Format: {
          if (r.index >= adapters_.size()) {
            os << r.spec;
            continue;
          }

          auto* w = adapters_[r.index];
          FormatAlign align(*w, r.where, r.align, r.pad);
          align.format(os, r.options);
        }
        default:
          continue;
      }
    }
  }

  // 解析格式字符串以获取替换项列表。
  static auto ParseFormatString(std::string fmt)
      -> std::vector<ReplacementItem> {
    std::vector<ReplacementItem> replacements;
    ReplacementItem i;
    while (!fmt.empty()) {
      std::tie(i, fmt) = SplitLiteralAndReplacement(fmt);
      if (i.type != ReplacementType::Empty) {
        replacements.push_back(i);
      }
    }
    return replacements;
  }

  // 将单个替换规格解析为ReplacementItem。
  static auto ParseReplacementItem(std::string spec)
      -> std::optional<ReplacementItem> {
    // 移除 spec 字符串的 { 和 }。
    std::string rep_string = FormatUtil::trim(spec, "{}");

    char pad = ' ';
    std::size_t align = 0;
    AlignStyle where = AlignStyle::Right;
    std::string options;
    size_t index = 0;

    // 移除 rep_string 的前后空白字符。
    rep_string = FormatUtil::trim(rep_string);
    // 尝试从 rep_string 开始的位置解析一个整数，并将其赋值给 index。
    if (FormatUtil::ConsumeInteger(rep_string, 0, index)) {
      assert(false && "Invalid replacement sequence index!");
      return ReplacementItem{};
    }

    rep_string = FormatUtil::trim(rep_string);
    // 第一个字符为 `,`，它将尝试解析字段布局。
    // `,`: 通常是用于字段布局或对齐的指示符。
    // 例如，`{0,10}`，其中 0 是要替换的参数索引，
    // 10 是指示字段宽度或对齐的数字。`,` 符号在此处用作分隔符。
    if (!rep_string.empty() && rep_string.front() == ',') {
      rep_string = FormatUtil::drop_front(rep_string, 1);
      if (!ConsumeFieldLayout(rep_string, where, align, pad)) {
        assert(false && "Invalid replacement field layout specification!");
      }
    }

    rep_string = FormatUtil::trim(rep_string);
    // 第一个字符是否为 `:`，它会从 rep_string 中提取选项字符串。
    // `:`: 这通常是用于格式选项的指示符。
    // 例如， `{0:0.00}`，其中 0 是要替换的参数索引，0.00 是指示
    // 如何格式化数字的选项（例如，始终显示两位小数）。
    if (!rep_string.empty() && rep_string.front() == ':') {
      rep_string = FormatUtil::drop_front(rep_string, 1);
      options = FormatUtil::trim(rep_string);
      rep_string = "";
    }

    rep_string = FormatUtil::trim(rep_string);
    if (!rep_string.empty()) {
      assert(false && "Unexpected characters found in replacement string!");
    }

    return ReplacementItem{spec, index, align, where, pad, options};
  }

  // 返回格式化的字符串。
  auto str() const -> std::string {
    std::ostringstream stream;
    stream << *this;
    std::string result = stream.str();
    stream.flush();
    return result;
  }

  // 将对象转换为字符串。
  operator std::string() const { return str(); }

 protected:
  FormatvObjectBase(std::string fmt,
                    ArrayRef<Internal::FormatAdapter*> adapters)
      : fmt_(std::move(fmt)), adapters_(adapters.begin(), adapters.end()) {}

  FormatvObjectBase(FormatvObjectBase&&) = default;

  // 解析对齐、填充和宽度规格。
  static auto ConsumeFieldLayout(std::string& spec, AlignStyle& where,
                                 size_t& align, char& pad) -> bool {
    where = AlignStyle::Right;
    align = 0;
    pad = ' ';
    if (spec.empty()) {
      return true;
    }

    if (spec.size() > 1) {
      if (auto loc = FormatUtil::TranslateLocChar(spec[1])) {
        pad = spec[0];
        where = *loc;
        spec = FormatUtil::drop_front(spec, 2);
      } else if (auto loc = FormatUtil::TranslateLocChar(spec[0])) {
        where = *loc;
        spec = FormatUtil::drop_front(spec, 1);
      }
    }

    bool failed = FormatUtil::ConsumeInteger(spec, 0, align);
    return !failed;
  }

  // 从输入的 fmt 字符串中分离字面量和替换项。
  // 即它寻找 `{...}` 结构中的替换项，并将其与其前面的字面量一起返回。
  // 如果找到一个连续的 `{` 或者 `{{`，它将按照适当的逻辑对其进行处理。
  static auto SplitLiteralAndReplacement(std::string fmt)
      -> std::pair<ReplacementItem, std::string> {
    while (!fmt.empty()) {
      // 处理没有 { 开头的字符串。
      if (fmt.front() != '{') {
        std::size_t bo = FormatUtil::find_first_of(fmt, '{');
        return std::make_pair(ReplacementItem{FormatUtil::substr(fmt, 0, bo)},
                              FormatUtil::substr(fmt, bo));
      }

      // 处理连续的 { 字符。
      // 如果找到一个或多个 {，它会尝试获取连续的 { 个数，并将其保存在 braces 中。
      std::string braces =
          FormatUtil::take_while(fmt, [](char c) { return c == '{'; });
      // 如果连续的 `{` 个数大于1（即 `{{`），它将其解释为转义字符，
      // 并只保留其中一半作为字面量返回。剩下的部分被视为后续的字符串。
      if (braces.size() > 1) {
        size_t num_excaped_braces = braces.size() / 2;
        std::string middle = FormatUtil::take_front(fmt, num_excaped_braces);
        std::string right = FormatUtil::drop_front(fmt, num_excaped_braces * 2);
        return std::make_pair(ReplacementItem{middle}, right);
      }

      // 查找匹配的 }。
      std::size_t bc = FormatUtil::find_first_of(fmt, '}');
      if (bc == std::string::npos) {
        assert(false &&
               "Unterminated brace sequence.  Escape with {{ for a literal "
               "brace.");
        return std::make_pair(ReplacementItem{fmt}, std::string());
      }

      // 查找嵌套的 {。
      std::size_t bo2 = FormatUtil::find_first_of(fmt, '{', 1);
      if (bo2 < bc) {
        return std::make_pair(ReplacementItem{FormatUtil::substr(fmt, 0, bo2)},
                              FormatUtil::substr(fmt, bo2));
      }

      // 处理格式说明符。
      // 在 { 和 } 之间的字符串被视为替换项的格式说明符。
      std::string spec = FormatUtil::slice(fmt, 1, bc);
      std::string right = FormatUtil::substr(fmt, bc + 1);
      // 调用 ParseReplacementItem 函数来解析这个说明符。
      auto ri = ParseReplacementItem(spec);
      // 解析成功，它返回解析得到的 ReplacementItem 和 } 之后的字符串。
      if (ri) {
        return std::make_pair(*ri, right);
      }

      // 上述所有情况都没有返回结果，函数将删除 fmt 中到 bc 位置之前的所有字符，并继续循环。
      fmt = FormatUtil::drop_front(fmt, bc + 1);
    }
    // 遍历完整个 fmt 字符串仍然没有找到任何替换项，它将返回整个字符串作为字面量。
    return std::make_pair(ReplacementItem{fmt}, std::string());
  }

  std::string fmt_;

  ArrayRef<Internal::FormatAdapter*> adapters_;
};

// 允许直接将格式化的结果流式传输到输出流。
inline auto operator<<(std::ostream& os, const FormatvObjectBase& obj)
    -> std::ostream& {
  obj.format(os);
  return os;
}

// 表示具有特定参数的格式化操作的模板类。
// 它捕获格式字符串和作为元组的格式化值。
// 保存每个参数的格式适配器的指针，这些适配器知道如何格式化该特定类型。
template <typename Tuple>
class FormatvObject : public FormatvObjectBase {
 public:
  FormatvObject(std::string fmt, Tuple&& params)
      : FormatvObjectBase(fmt, parameter_pointers_),
        parameters_(std::move(params)),
        parameter_pointers_(std::apply(CreateAdapters(), parameters_)) {}

  FormatvObject(const FormatvObject& rhs) = delete;

  FormatvObject(FormatvObject&& rhs)
      : FormatvObjectBase(std::move(rhs)),
        parameters_(std::move(rhs.parameters_)) {
    parameter_pointers_ = std::apply(CreateAdapters(), parameters_);
    adapters_ = parameter_pointers_;
  }

 private:
  // 创建格式适配器。
  struct CreateAdapters {
    template <typename... Ts>
    auto operator()(Ts&... items)
        -> std::array<Internal::FormatAdapter*, std::tuple_size<Tuple>::value> {
      return {{&items...}};
    }
  };

  Tuple parameters_;

  std::array<Internal::FormatAdapter*, std::tuple_size<Tuple>::value>
      parameter_pointers_;
};

///   // 用户创建格式化字符串的主要接口。
///   // Convert to std::string.
///   std::string S = formatv("{0} {1}", 1234.412, "test").str();
///
///   OS << formatv("{0} {1}", 1234.412, "test");
template <typename... Ts>
inline auto formatv(const char* fmt, Ts&&... vals)
    -> FormatvObject<decltype(std::make_tuple(
        Internal::build_format_adapter(std::forward<Ts>(vals))...))> {
  using ParamTuple = decltype(std::make_tuple(
      Internal::build_format_adapter(std::forward<Ts>(vals))...));
  return FormatvObject<ParamTuple>(
      fmt, std::make_tuple(
               Internal::build_format_adapter(std::forward<Ts>(vals))...));
}
```

单独对 `SplitLiteralAndReplacement` 函数中多个连续`{`，只保留其中一半作为字面量返回的原因：

这种处理方式是为了使得格式化字符串中可以包含字面量的大括号 `{` 和 `}`。在许多格式化库中，`{` 和 `}` 用于定义变量替换的位置，但如果你真的想在结果字符串中包含一个 `{` 或 `}` 怎么办呢？这时，你就需要一种方法来"转义"这些特殊字符，使它们被解释为普通字符。

为了实现这一目的，这段代码使用了一个简单的规则：连续的两个 `{` 被解释为一个字面量的 `{`。同样，连续的两个 `}` 被解释为一个字面量的 `}`。

考虑以下格式化字符串：
```
"Hello {{name}}! The braces are: {{ and }}"
```

在这个字符串中，`{{name}}` 是一个变量替换，而连续的 `{{` 和 `}}` 是转义的大括号。当这个格式化字符串被处理时，它应该产生以下输出（假设 `name` 被替换为 "Alice"）：
```
"Hello Alice! The braces are: { and }"
```

所以，连续的 `{{` 被解释为单个的 `{`，连续的 `}}` 被解释为单个的 `}`，这就是为什么只保留一半的原因。

### 3.4 Format

Format 接口不做赘述，主要使用 `std::snprintf` 作为内部输出函数，主体实现方式和 `FormatVariadic` 类似。

至此对llvm中format部分的分析结束。

## 4. 引用

[1]. [https://zh.cppreference.com/w/cpp/header/format](https://zh.cppreference.com/w/cpp/header/format)

[2]. [https://llvm.org/docs/ProgrammersManual.html#formatting-strings-the-formatv-function](https://llvm.org/docs/ProgrammersManual.html#formatting-strings-the-formatv-function)

[3]. [https://github.com/CanftIn/formatv](https://github.com/CanftIn/formatv)
