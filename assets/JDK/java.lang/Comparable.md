---
layout: post
title: Comparable
description: JDK source analysis
permalink: /JDK/java.lang/Comparable.html
katex: true
---
# Comparable

 * 内部比较器，常用作自然排序接口，需要实现内部的compareTo方法

 * 内部比较器的特点是：嵌入式

 * 其比较行为必须在待比较对象内部实现

 * 一个类如果实现了Comparable接口，就意味着“该类本身支持排序”，并且可以直接通过Arrays.sort()或Collections.sort()进行排序

 * 当然，一个类如果没有实现Comparable接口，也可以挂载外部比较器Comparator进行排序

 * 注：区别于外部比较器Comparator
 
 ```java
/*
 * 通过 x.compareTo(y) 来“比较x和y的大小”：
 * 返回“负数”，意味着“x<y”
 * 返回“零”，意味着“x==y”
 * 返回“正数”，意味着“x>y”
 */
int compareTo(T o);
```
 