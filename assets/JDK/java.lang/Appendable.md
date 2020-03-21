---
layout: post
title: Appendable
description: JDK source analysis
permalink: /JDK/java.lang/Appendable.html
katex: true
---
# Appendable
---
*interface* **Appendable**

添加字符的接口。代表该对象具有添加字符序列的能力.

- 向该对象添加一个字符序列
```
Appendable append(CharSequence csq) throws IOException;
```

- 向该对象添加一个字符序列，该字符序列是csq在[start, end)范围内的一个子序列
```
Appendable append(CharSequence csq, int start, int end) throws IOException;
```

- 向该对象添加一个字符
```
Appendable append(char c) throws IOException;
```
