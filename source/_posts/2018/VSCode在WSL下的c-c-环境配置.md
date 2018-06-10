---
title: VSCode在WSL下的c/c++环境配置
copyright: true
date: 2018-06-10 16:50:32
tags:
- vscode
- c++
- c
categories:
- vscode
- c++
---

我在windows上使用wsl（Windows Subsystem for Linux）做为VScode的内置终端，借以使用gcc的工具链和linux的环境，但是实际上配置还是有一些问题，我把这些问题的解决办法写在这篇文章中。

# 配置VSCode的terminal为bash
首先在windows的文件管理器下可以找到```C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs```这样一个目录，这个目录貌似是windows版本更新之后有所变动，我目前的系统发布版本是windows10 1803 Version 10.0.17134.48，该目录中```<user>```为你的用户名，```<...>```为根据安装得到的一串随机字符串。

找到这个路径之后，可先在VSCode的setting中配置

```JSON
{
    "terminal.integrated.shell.windows": "bash.exe",
    "terminal.integrated.shellArgs.windows": [
        "-i"
    ],
}
```

其中"-i"命令是集成bash到VSCode自带终端环境中。

# 在WSL中安装gcc，g++

打开terminal，可以先更新wsl的镜像源到阿里云，因为Ubuntu自带的源很慢，而且软件包不一定最新。至于怎么配源这里不做介绍。

由于WSL中没有任何开发环境（如果你是刚刚装上WSL的话），镜像源配好后安装gcc-7
```sh
$ sudo apt-get update
$ sudo apt-get install build-essential
$ sudo apt-get install gcc-7
$ sudo apt-get install g++-7
```

# 检查标准包含目录

```bash
$ gcc -xc++ -E -v -
...
#include <...> search starts here:
 /usr/include/c++/7
 /usr/include/x86_64-linux-gnu/c++/7
 /usr/include/c++/7/backward
 /usr/lib/gcc/x86_64-linux-gnu/7/include
 /usr/local/include
 /usr/lib/gcc/x86_64-linux-gnu/7/include-fixed
 /usr/include/x86_64-linux-gnu
 /usr/include
End of search list.
```

然后设置配置文件```.vscode/c_cpp_properties.json```

```JSON
{
  "configurations": [
    {
      "name": "Win32",
      "includePath": [
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/include/c++/7",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/include/x86_64-linux-gnu/c++/7",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/include/c++/7/backward",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/lib/gcc/x86_64-linux-gnu/7/include",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/local/include",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/lib/gcc/x86_64-linux-gnu/7/include-fixed",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/include/x86_64-linux-gnu",
        "C:/Users/<user>/AppData/Local/Packages/CanonicalGroupLimited.UbuntuonWindows_<...>/LocalState/rootfs/usr/include",
        "${workspaceRoot}"
      ],
      "defines": ["__x86_64__"],
      "intelliSenseMode": "clang-x64"
    }
  ],
  "version": 3
}
```

# 测试

测试一段c代码，文件在和.vscode同级的目录下，文件名test.c
```c
#include <stdio.h>

#define MIN_PARAM_NUM 3

int chk_param(int argc, char **argv)
{
    if(argc < MIN_PARAM_NUM)
        return 0;
    else
        return 1;
}

int main(int argc, char **argv)
{
    return chk_param(argc, argv);
}
```

在VSCode的terminal中测试，这是后环境应该为bash了
```sh
$ gcc -c test.c -o test.exe
```