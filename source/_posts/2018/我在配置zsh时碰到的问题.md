---
title: 我在配置zsh时碰到的问题
copyright: true
date: 2018-06-12 23:55:17
tags:
- 问题
categories:
- 未分类
---

上一篇文章提到了如何在VSCode中配置bash环境，这篇文章则记录我在配置zsh时的问题。

# 缘由
虽然bash虽然比windows上的一堆shell好看了许多，但是zsh搭载oh-my-zsh会更好看，使用agnoster主题配上emacs写lisp和scheme会非常舒服。
一个好看的terminal界面会增加操作的可读性。

# 配置zsh && oh-my-zsh

```sh
$ sudo apt-get install zsh
```

在oh-my-zsh的官方github上给出安装oh-my-zsh的方法

via curl

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

via wget

```sh
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
```
未完...
