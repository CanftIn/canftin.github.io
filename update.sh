#!/usr/bin/env bash

echo "###############################"
echo "####### current status ########"
echo "###############################"

git status

echo "###############################"
echo "########## pulling ############"
echo "###############################"

git pull origin master

echo "###############################"
read -p "### Enter commit message:"
echo "###############################"

rm *~
rm **/*~
rm **/**/*~

git add *
git add .*
git commit -a -m "${REPLY}"

echo "###############################"
echo "########## pushing ############"
echo "###############################"

git gc
git push https://canftin@github.com/canftin/canftin.github.io.git master

echo "###############################"
echo "########## finished ###########"
echo "###############################"
