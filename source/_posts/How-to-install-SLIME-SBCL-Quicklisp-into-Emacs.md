---
title: How to install SLIME+SBCL+Quicklisp into Emacs
date: 2018-04-11 20:34:56
tags:
---
# How to install SLIME+SBCL+Quicklisp into Emacs
SLIME – SLIME is a Emacs mode for Common Lisp development. Inspired by existing systems such Emacs Lisp and ILISP, we are working to create an environment for hacking Common Lisp in. (https://common-lisp.net/project/slime/)

SBCL – Steel Bank Common Lisp (SBCL) is a high performance Common Lisp compiler. It is open source / free software, with a permissive license. In addition to the compiler and runtime system for ANSI Common Lisp, it provides an interactive environment including a debugger, a statistical profiler, a code coverage tool, and many other extensions. (http://www.sbcl.org/)

Quicklisp – Quicklisp is a library manager for Common Lisp. It works with your existing Common Lisp implementation to download, install, and load any of over 1,200 libraries with a few simple commands. (https://www.quicklisp.org/beta/)

This article is a simple instruction for installing SLIME, SBCL and Quicklisp into Emacs, which is the environment I recommend for learning Common Lisp.

## Step 1 – Install SLIME

Firstly, you need to install the SLIME by MELPA or Git. Basically, the package in MELPA is always stable, while the files in official Git repository are newest.

If you choose to install it by MELPA, add lines below into your .emacs file.

```
(require 'package)
(add-to-list 'package-archives
'("melpa"     . "http://melpa.milkbox.net/packages/"))
(package-initialize)
```

After that, you should be able to install SLIME by M-x package-install RET slime RET. If you found that there is no package named “slime” in the list, running M-x package-refresh-contents will fix it.

By using Git, you need to run these commands in your terminal.

cd path/where/you/want/slime/installed
git clone https://github.com/slime/slime.git

Then add lines below into your .emacs file.

```
(add-to-list 'load-path "path/of/slime")
(require 'slime-autoloads)
```

## Step 2 – Install SBCL

Download the source archive in official site and unzip it. Run commands below in your terminal after doing that.

```
cd path/where/files/unzipped
sh install.sh
```

SBCL should be installed right now, to make sure, run sbcl in your terminal, there should be a banner produced like this.

This is SBCL 1.2.14, an implementation of ANSI Common Lisp.
More information about SBCL is available at <http://www.sbcl.org/&gt;.

SBCL is free software, provided as is, with absolutely no warranty.
It is mostly in the public domain; some portions are provided under
BSD-style licenses. See the CREDITS and COPYING files in the
distribution for more information.
*

And you can install it by cloning the git repository (git://git.code.sf.net/p/sbcl/sbcl) as well.

After the steps above are done, add the line below into your .emacs file.

(setq inferior-lisp-program "path/of/sbcl")

The path of sbcl can be known by running command “which sbcl” in your terminal.

## Step 3 – Install Quicklisp

Download the file for installation. (https://beta.quicklisp.org/quicklisp.lisp)

Then run sbcl with that file loaded by this command.

```
sbcl --load path/of/quicklisp.lisp
```

After sbcl launched, type in the command below.

```
(quicklisp-quickstart:install)
```

At this moment, Quicklisp has already been installed. If you want to load Quicklisp every time you start Lisp (which is recommended), type in command below.

```
(ql:add-to-init-file)
```

Then, type in the command which will create a file you can load in Emacs that configures the right load-path for loading Quicklisp’s installation of SLIME.

```
(ql:quickload "quicklisp-slime-helper")
```

Now, you should be able to see a message looks like this.

To use, add this to your ~/.emacs:

```
(load (expand-file-name "~/quicklisp/slime-helper.el"))
;; Replace "sbcl" with the path to your implementation
(setq inferior-lisp-program "sbcl")
```

As we have already set for sbcl, you just need to copy the first line into your .emacs file.

## Step 4 – Enjoy Common Lisp

The basic installation has already been done. You can enjoy that by running M-x slime in your Emacs.