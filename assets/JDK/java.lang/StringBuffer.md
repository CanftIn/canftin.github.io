---
layout: post
title: StringBuffer
description: JDK source analysis
permalink: /JDK/java.lang/StringBuffer.html
katex: true
---
# StringBuffer

 * 线程安全的字符序列，适合多线程下操作大量字符，内部实现为字节数组
 
 * 线程安全的原理是涉及到修改StringBuffer的操作被synchronized修饰