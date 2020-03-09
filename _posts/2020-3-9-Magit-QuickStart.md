---
layout: post
title: Magit-QuickStart
category: TOOL
tags: Magit，git, spacemacs
keywords: Magit, git, spacemacs
description: Magit QuickStart
---
# Contents
*  contents
{:toc}

## Show git status
- `SPC` `g` `s` show Magit status view

## Show help
- `SPC` `g` `s` show Magit status view
- `?` get help

## Show git log
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view

## Show all commits for the current file
- `SPC` `g` `f` `l` show git log for the current file

## Diff a range of commits
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on a commit
- `V` to select the line
- use `j` and `k` to position the cursor on another commit
- `d` `r` to show a diff of the range of commits

## Checkout a local branch
- `SPC` `g` `s` show Magit status view
- `b` `b` checkout a branch
- select or enter the branch name and hit ENTER

## Checkout a commit
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on a commit
- `b` `b` ENTER to checkout that commit

## Checkout a different revision of a file
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- move point to the commit you want to checkout (using `j` and `k`)
- `O` (capital letter O) `f` reset a file
- hit `ENTER` to select the default revision selected above. (it will look something like - master)
- select a file
- `q` to close the log view and see the file at the selected revision is staged

## Open a different revision of a file
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- move point to the commit you want to checkout (using `j` and `k`)
- `SPC` `g` `f` `f` (magit-find-file) to open a file at a revision
- `ENTER` to use the selected commit
- select the name of the file to open

## Create a local branch from a remote branch
- `SPC` `g` `s` show Magit status view
- `b` `c` create a branch
- select or enter the remote branch and hit `ENTER`
- hit `ENTER` to use the same name or enter a new name and hit `ENTER`

## Pull from upstream
- `SPC` `g` `s` show Magit status view
- `F` `u` pull from upstream

## Push to upstream
- `SPC` `g` `s` show Magit status view
- `P` `u` push to upstream

## Stage files and commit
- `SPC` `g` `s` show Magit status view
- use `j` and `k` to position the cursor on a file
- `TAB` to show and hide the diff for the file
- `s` to stage a file (`u` to unstage a file and `x` to discard changes to a file)
- `c` `c` to commit
- write a commit message and save with `SPC` `f` `s`
- `,` `c` to finish the commit message

## Stage specific hunks
- `SPC` `g` `s` show Magit status view
- `M-n` / `M-p` to move to the "Unstaged changes" section
- `j` / `k` to move to the desired file
- `TAB` to expand the hunks in the file
- `M-n` / `M-p` to move to different hunks
- `s` / `u` to stage or unstange hunks
- `x` to discard a hunk
- `c` `c` to commit
- Enter a commit message and save with `SPC` `f` `s`
- `,` `c` to finish the commit

## Merge master into the current branch
- `SPC` `g` `s` show Magit status view
- `m` `m` merge
- select or enter master and hit `ENTER`

## Rebase the current branch onto master
- `SPC` `g` `s` show Magit status view
- `r` `e` rebase
- select or enter master and hit `ENTER`

## Use interactive rebase to squash commits
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on a commit
- `r` `i` to start the interactive rebase
- use `j` and `k` to position the cursor on a commit to squash
- `s` to mark the commit as to be squashed. (use `s` multiple times to squash multiple commits)
- `,` `c` to make it happen
- edit the new squashed commit message and save with `SPC` `f` `s`
- `,` `c` to finish

## Use interactive rebase to reorder commits 
- `SPC` `g` `s `show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on a commit
- `ri` to start the interactive rebase
- use `j` and `k` to position the cursor on a commit to reorder
- use `M-k` or `M-j` to move the commit up or down
- `,` `c` to make it happen

## Revert a commit
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on the commit you want to revert
- `_` `O` (capital letter O) to revert the commit
- edit the commit message and save with `SPC` `f` `s`
- `,` `c` to finish

## (Soft) reset the last commit
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor one commit before the last one
- `O` (capital letter O) `s` to soft reset
- the selected commit should be e.g. master. Hit `ENTER`

## Stash changes
- `SPC` `g` `s` show Magit status view
- `z` `z` stash changes
- enter stash message and hit `ENTER`

## Pop stash
- `SPC` `g` `s` show Magit status view
- `z` `p` pop from stash
- select the stash to pop and hit `ENTER`

## Copy git commit SHA
- `SPC` `g` `s` show Magit status view
- `l` `l` show log view
- use `j` and `k` to position the cursor on a commit
- `y` `s` copy the git commit SHA

## Copy text from a Magit buffer
- `SPC` `g` `s` show Magit status view
- `\` switch to text mode
- copy text using normal vim keystrokes
- `\` switch back to Magit mode

## Run a shell command
- `SPC` `g` `s` show Magit status view
- `!` `s` run a shell command
- enter a command to run and hit `ENTER`

- ## List all branches
- `SPC` `g` `s` show Magit status view
- `y` `r` show refs

## Jump to the next/prev section in the status view
- `SPC` `g` `s` show Magit status view
- `g` `j` jump to the next section
- `g` `k` jump to the previous section