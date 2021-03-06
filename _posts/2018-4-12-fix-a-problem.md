---
layout: post
title: 解决了个大问题
category: problem
tags: ssh, git
keywords: ssg, git
description: 解决了个大问题
---
git的多用户问题。

关于ssh，我的配置：
```sh
 Directory of D:\linux_home\.ssh

04/12/2018  03:12 PM    <DIR>          .
04/12/2018  03:12 PM    <DIR>          ..
04/12/2018  03:39 PM               212 config
02/22/2018  01:56 PM             1,675 id_rsa
02/22/2018  01:56 PM               405 id_rsa.pub
04/12/2018  03:09 PM             1,675 id_rsa_vcanccc
04/12/2018  03:09 PM               397 id_rsa_vcanccc.pub
02/22/2018  01:57 PM             1,197 known_hosts
               6 File(s)          5,561 bytes
               2 Dir(s)  47,690,989,568 bytes free
```
其中id_rsa当然是CanftIn的私钥了，id_rsa_vcanccc则是Vcanccc这个我的早期账号的。
config文件内容如下：
<!--more-->
```
Host github_vcanccc
    HostName github.com
    User git
    IdentityFile /d/linux_home/.ssh/id_rsa_vcanccc

Host github.com
    HostName github.com
    User git
    IdentityFile /d/linux_home/.ssh/id_rsa
```

紧接着我就犯傻了，而且还犯了很久(约乎几十分钟吧...)，不过最终还是解决了。

遇到的问题是，我用Vcanccc这账号将hexo的站部署到github过程中出现了这么个事：

```
ERROR: Permission to Vcanccc/Vcanccc.github.io.git denied to CanftIn.
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
FATAL Something's wrong. Maybe you can find the solution here: http://hexo.io/docs/troubleshooting.html
```
这错误很明显，就是没有权限，而且我应该是Vcanccc的操作，这里变成是CanftIn，由于是我之前都是用CanftIn提交到CanftIn的github上。

所以这里需要在hexo博客源码目录下的_config.yml文件里加上

```
deploy:
  type: git
  repository: git@github.com:Vcanccc/Vcanccc.github.io.git
  branch: master
```
然后再执行命令 

```sh
$ hexo g
$ hexo d
```
这个时候就是犯傻的地方了，也是报错的地方，仔细再看一看之后，我们可以发现我在config文件中设置的一个Host名是github_vcanccc，而不是github.com:Vcanccc，只有默认的用户还是CanftIn。所以自然会报错了，于是我们将_config.yml文件里添加的内容改为

```
deploy:
  type: git
  repository: github_vcanccc:Vcanccc/Vcanccc.github.io.git
  branch: master
```

再执行上述命令，才会成功。


唉...原本是打算花一点时间搞完了做题目的，没想到浪费了这么多时间。:<