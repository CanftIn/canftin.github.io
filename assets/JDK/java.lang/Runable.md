---
layout: post
title: Runable
description: JDK source analysis
permalink: /JDK/java.lang/Runable.html
katex: true
---
# Runable
*interface* **Runable**

 * Runnable表示一类无返回值，且不抛出异常的任务

 * Runnable类任务通常由Thread直接执行，也可以交给【任务执行器】Executor去执行

 * 此外，Runnable还可以经过适配器的装配，与Callable类型、Future类型等配合使用

 * 该接口已函数化：
```java
Runnable runnable = new Runnable() {
     @Override
     public void run() {
         System.out.println("Runnable");
     }
 };
//可以简写为：
Runnable runnable = () -> { System.out.println("Runnable"); };
```






