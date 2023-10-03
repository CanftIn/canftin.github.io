---
title: "从零构造现代语言编译器(5): 缓冲区"
date: 2023-09-26T18:28:05+08:00
lastmod: 2023-09-26T18:28:05+08:00
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

<font color="red">

// TODO: 1. 分析老版本mmap的SourceBuffer。

// TODO: 2. 分vfs版本SourceBuffer。

// TODO: 3. 分析swift版本source manager和llvm。

</font>

## 1. 为什么需要SourceBuffer


## 2. mmap版本SourceBuffer

```cpp
class SourceBuffer {
 public:
  static auto CreateFromText(llvm::Twine text,
                             llvm::StringRef filename = "/text")
      -> llvm::Expected<SourceBuffer>;
  static auto CreateFromFile(llvm::StringRef filename)
      -> llvm::Expected<SourceBuffer>;

  SourceBuffer() = delete;

  SourceBuffer(const SourceBuffer&) = delete;

  SourceBuffer(SourceBuffer&& arg) noexcept;

  ~SourceBuffer();

  [[nodiscard]] auto filename() const -> llvm::StringRef { return filename_; }

  [[nodiscard]] auto text() const -> llvm::StringRef { return text_; }

 private:
  enum class ContentMode {
    Uninitialized,
    MMapped,
    Owned,
  };

  // Constructor for mmapped content.
  explicit SourceBuffer(std::string filename, llvm::StringRef text);
  // Constructor for owned content.
  explicit SourceBuffer(std::string filename, std::string text);

  ContentMode content_mode_;
  std::string filename_;
  std::string text_storage_;
  llvm::StringRef text_;
};
```

```cpp
static auto CheckContentSize(int64_t size) -> llvm::Error {
  if (size < std::numeric_limits<int32_t>::max()) {
    return llvm::Error::success();
  }
  return llvm::createStringError(llvm::inconvertibleErrorCode(),
                                 "Input too large!");
}

auto SourceBuffer::CreateFromText(llvm::Twine text, llvm::StringRef filename)
    -> llvm::Expected<SourceBuffer> {
  std::string buffer = text.str();
  auto size_check = CheckContentSize(buffer.size());
  if (size_check) {
    return std::move(size_check);
  }
  return SourceBuffer(filename.str(), std::move(buffer));
}

static auto ErrnoToError(int errno_value) -> llvm::Error {
  return llvm::errorCodeToError(
      std::error_code(errno_value, std::generic_category()));
}

auto SourceBuffer::CreateFromFile(llvm::StringRef filename)
    -> llvm::Expected<SourceBuffer> {
  std::string filename_str = filename.str();

  errno = 0;
  int file_descriptor = open(filename_str.c_str(), O_RDONLY);
  if (file_descriptor == -1) {
    return ErrnoToError(errno);
  }

  auto closer =
      llvm::make_scope_exit([file_descriptor] { close(file_descriptor); });

  struct stat stat_buffer = {};
  errno = 0;
  if (fstat(file_descriptor, &stat_buffer) == -1) {
    return ErrnoToError(errno);
  }

  int64_t size = stat_buffer.st_size;
  if (size == 0) {
    return SourceBuffer(std::move(filename_str), std::string());
  }
  auto size_check = CheckContentSize(size);
  if (size_check) {
    return std::move(size_check);
  }

  errno = 0;
  void* mapped_text = mmap(nullptr, size, PROT_READ, MAP_PRIVATE,
                           file_descriptor, /*offset=*/0);
  if (mapped_text == MAP_FAILED) {
    return ErrnoToError(errno);
  }

  errno = 0;
  closer.release();
  if (close(file_descriptor) == -1) {
    munmap(mapped_text, size);
    return ErrnoToError(errno);
  }

  return SourceBuffer(
      std::move(filename_str),
      llvm::StringRef(static_cast<const char*>(mapped_text), size));
}
SourceBuffer::SourceBuffer(SourceBuffer&& arg) noexcept
    : content_mode_(
          std::exchange(arg.content_mode_, ContentMode::Uninitialized)),
      filename_(std::move(arg.filename_)),
      text_storage_(std::move(arg.text_storage_)),
      text_(content_mode_ == ContentMode::Owned ? text_storage_ : arg.text_) {}

SourceBuffer::SourceBuffer(std::string filename, std::string text)
    : content_mode_(ContentMode::Owned),
      filename_(std::move(filename)),
      text_storage_(std::move(text)),
      text_(text_storage_) {}

SourceBuffer::SourceBuffer(std::string filename, llvm::StringRef text)
    : content_mode_(ContentMode::MMapped),
      filename_(std::move(filename)),
      text_(text) {
  COCKTAIL_CHECK(!text.empty())
      << "Must not have an empty text when we have mapped data from a file!";
}

SourceBuffer::~SourceBuffer() {
  if (content_mode_ == ContentMode::MMapped) {
    errno = 0;
    int result =
        munmap(const_cast<void*>(static_cast<const void*>(text_.data())),
               text_.size());
    COCKTAIL_CHECK(result != -1) << "Unmapping text failed!";
  }
}
```

## 3. llvm::vfs版本SourceBuffer

```cpp

```

这段代码定义了一个名为`SourceBuffer`的类，该类表示Carbon源代码的缓冲区。以下是对这段代码的详细解释：

### 注释概述

- **SourceBuffer**：这个类持有Carbon源代码的文本缓冲区，并使其可供Carbon编译器的其余部分使用。它拥有底层源代码文本的内存，并确保其与缓冲区对象一样长寿。
  
- **来源**：每个源代码文本缓冲区在概念上都是从Carbon源文件加载的，即使在构造缓冲区时直接提供。还保留并提供了应该用于该Carbon源文件的名称。
  
- **内存管理**：由于源代码文本的底层内存可能是从文件中读取的，我们可能希望使用像`mmap`这样的工具将该文件映射到内存中，所以为了避免需要为映射的文件定义复制语义，缓冲区本身是不可复制的。如果需要，我们可以在未来放宽这一限制，并增加一些实现复杂性。

### 类定义

- **SourceBuffer**：这是主要的类定义，它代表了Carbon源代码的缓冲区。

### 公共成员函数

- **CreateFromFile**：这是一个静态函数，用于从指定的文件名打开一个文件。如果成功，它返回一个`SourceBuffer`对象；如果失败，它打印一个错误并返回`nullopt`（即没有有效的`SourceBuffer`对象）。

- **构造函数**：默认构造函数被删除，这意味着你不能直接创建一个`SourceBuffer`对象。你必须使用上面的`CreateFromFile`函数或其他类似的工厂函数来创建一个`SourceBuffer`对象。

- **filename**：这是一个常量成员函数，返回源文件的名称。

- **text**：这是一个常量成员函数，返回源代码文本的引用。

### 私有成员

- **私有构造函数**：这个构造函数是私有的，这意味着你不能从类的外部直接调用它。它接受一个文件名和一个`llvm::MemoryBuffer`的唯一指针，并将它们存储在私有成员变量中。

- **filename_**：这是一个私有成员变量，用于存储源文件的名称。

- **text_**：这是一个私有成员变量，它是一个指向`llvm::MemoryBuffer`的唯一指针，用于存储源代码文本。

### 总结

`SourceBuffer`类是用于管理Carbon源代码的缓冲区的。它提供了从文件创建缓冲区的功能，并提供了访问源文件名和源代码文本的方法。为了内存管理和文件映射的方便，这个类是不可复制的。
