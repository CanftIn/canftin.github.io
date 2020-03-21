---
layout: post
title: Cloneable
description: JDK source analysis
permalink: /JDK/java.lang/Cloneable.html
katex: true
---
# Cloneable 
"克隆"接口，需要重写Object中clone()方法的类应当实现此接口

对象创建的几种方法:

1.使用new关键字

2.使用clone方法

3.反射机制

4.反序列化

利用clone，在内存中进行数据块的拷贝，复制已有的对象，也是生成对象的一种方式。前提是类实现Cloneable接口，Cloneable接口没有任何方法，是一个空接口，也可以称这样的接口为标志接口，只有实现了该接口，才会支持clone操作。

Object中有一个clone方法，为什么还必须要实现Cloneable接口呢，这就是cloneable接口这个标志接口的意义，只有实现了这个接口才能实现复制操作，因为jvm在复制对象的时候，会检查对象的类是否实现了Cloneable这个接口，如果没有实现，则会报CloneNotSupportedException异常。

clone方法只有在进行复杂的“浅克隆”时效率才会明显高于new构造方式.