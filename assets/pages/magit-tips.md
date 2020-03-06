---
layout: page
title: magit的使用
description: magit的使用
keywords: magit, git
comments: true
permalink: /pages/magit-tips.html
---

> 你可以使用 SPC h SPC 然后git回车可以查看其的文档介绍。

# 基本内容
可以使用`SPC SPC`后键入magit-clone来克隆。
使用快捷键`SPC g s`进入到magit-mode。
常用快捷键:

- `q` 退出
- `s` 将添加光标处文件的修改
- `S` 添加全部的文件修改
- `u` 不添加（取消）修改
- `x` 放弃文件的修改
- `c c` 提交这次的修改 相当于commit，此时会出现diff界面还有输入message的buffer输入commit的信息够`C-c C-c`提交成功
- `P u` 提交到远程仓库
- `P m` 提交本地分支到远程仓库。（新建本地分支时使用)
- `b b` 检出某一个分支
- `b c` 创建某一个分支

# 一些高级功能
## 使用tag
在magit-mode中。`t c`创造一个tag。然后使用`P T`上传到远程仓库。

## 合并分支
在magit-mode中。`m m`然后格局提示操作即可。