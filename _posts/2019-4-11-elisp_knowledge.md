---
layout: post
title: elisp 知识整理
category: PL
tags: lisp, eslip, emacs
keywords: lisp, eslip, emacs
description: elisp 知识整理
---
## 列表处理

## 函数定义
```lisp
(defun function-name (arguments-list)
  "document string"
  body)
```
## 局部作用域变量
```lisp
(let (bindings)
  body)
```
let* 和 let 的使用形式完全相同，唯一的区别是在 let* 声明中就能使用前面声明的变量，比如：
```lisp
(defun circle-area (radix)
  (let* ((pi 3.1415926)
         (area (* pi radix radix)))
    (message "直径为 %.2f 的圆面积是 %.2f" radix area)))
```
## lambda表达式
```lisp
(lambda (arguments-list)
  "documentation string"
  body)
```
调用 lambda 方法如下：
```lisp
(funcall (lambda (name)
           (message "Hello, %s!" name)) "Emacser")
```

## 一些和buffer相关的函数
可以通过输入**C-h f**然后输入函数名查看函数文档。
**describe-function**可以告诉你函数定义的位置。
如果想在源文件里查看函数，可以使用**xref-find-definitions**来进行跳转。
**beginning-of-buffer**和**M-<**绑定。
```lisp
(defun simplified-beginning-of-buffer ()
  "Move point to the beginning of the buffer;
  leave mark at previous position."
  (interactive)
  (push-mark)
  (goto-char (point-min)))
```
上面的函数的函数体包括两行：
```lisp
(push-mark)
(goto-char (point-min))
```
**describe-function**
**describe-variable**
Print the documentation for a function or variable. Conventionally
bound to C-h f and C-h v.
**xref-find-definitions**
Find the file containing the source for a function or variable and switch
buffers to it, positioning point at the beginning of the item. Conventionally
bound to M-. (that’s a period following the META key).
**save-excursion**
Save the location of point and restore its value after the arguments
to save-excursion have been evaluated. Also, remember the current
buffer and return to it.
**push-mark** Set mark at a location and record the value of the previous mark on
the mark ring. The mark is a location in the buffer that will keep its
relative position even if text is added to or removed from the buffer.
**goto-char** Set point to the location specified by the value of the argument, which
can be a number, a marker, or an expression that returns the number
of a position, such as (point-min).
**insert-buffer-substring**
Copy a region of text from a buffer that is passed to the function as
an argument and insert the region nto the current buffer.
**mark-whole-buffer**
Mark the whole buffer as a region. Normally bound to C-x h.
**set-buffer**
Switch the attention of Emacs to another buffer, but do not change
the window being displayed. Used when the program rather than a
human is to work on a different buffer.
**get-buffer-create**
**get-buffer**
Find a named buffer or create one if a buffer of that name does not
exist. The get-buffer function returns nil if the named buffer does
not exist.



