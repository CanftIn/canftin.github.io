---
layout: post
title: Git和github连接
category: unarrange
tags: git, github
keywords: git, github
description: Git和github连接
---
# Git和Github连接

1. 本地配置用户名和邮箱（如果已经设置好，跳过该步）：
- ``` git config --global user.name "你的用户名" ```

- ``` git config --global user.email "你的邮箱" ```
- 或者你直接在config文件里改，位置在 ``` C:\Users\你的用户名\.gitconfig``` .

2. 生成ssh key
- 运行 ``` ssh-keygen -t rsa -C "你的邮箱" ```，它会有三次等待你输入，直接回车即可。

3. 测试一下吧，执行 ``` ssh -T git@github.com ```

**注：**

- 对于 oschina 的 “码云” ，执行 ``` ssh -T git@git.oschina.net``` 
- 对于 coding 的 “码市” ，执行 ``` ssh -T git@git.coding.net``` 

4. 添加远程地址

```$ git remote add origin git@github.com/你的github用户名/仓库名.git```

例如，我的github的用户名是jikiuj仓库名是first git test,然后就这样打

```$ git remote add origin git@github.com/jikiuj/first-git-test.git   ```

发现了吗？仓库名的空格用 - 来代替


5. 本地文件夹目录下 ``` git init ```

6. add和commit

    ``` git add filename.xxx ```

    ``` git commit -m "reason" ```
    
    
7. push推送到你的github
    ``` git push -u origin master```

