---
title: some tricks of cpp
date: 2017-11-30 
copyright: true
tags:
- c++
- c++笔记系列
categories:
- c++
- c++笔记系列
---
# Some Tricks Of C Plus Plus

## shared_ptr


```
class FXXK
{
    string shit_;
public:
    FXXK(string shit) : shit_(shit) { cout << "FXXK-shit is created: " << shit << endl; }
    FXXK() { cout << "Smelly FXXK created. " << endl; shit_ = "Smelly"; }
    ~FXXK() { cout << "FXXK is destroyed: " << shit_ << endl; }
    void shit() { cout << "FXXK " << shit_ << "...." << endl; }
};
```
case:

```
FXXK* fxxk = new FXXK("shit");
fxxk->shit(); //fxxk is a dangling pointer, the memory will be leaked.
```
so we need to:

<!--more-->

```
{
    shared_ptr<FXXK> fxxk(new FXXK("Shit"));    //count = 1
    cout << fxxk.use_count() << endl;   	//count = 1
    {
        shared_ptr<FXXK> fxxk2 = fxxk;          //count = 2
        cout << fxxk.use_count() << endl;	//count = 2
        cout << fxxk2.use_count() << endl;	//count = 2
        fxxk2->shit();                          //FXXK Shit....
        cout << fxxk.use_count() << endl;	//count = 2
        cout << fxxk2.use_count() << endl;	//count = 2
    }
    cout << fxxk.use_count() << endl;	        //count = 1
    //count = 1
    fxxk->shit();				//FXXK Shit....
    cout << fxxk.use_count() << endl;
}   //count = 0 && FXXK is destroyed : Shit
```
but something like that:
```
//an object should be assigned to a smart pointer as soon as it's created. Raw pointer should not be used again.
FXXK* fxxk = new FXXK("shit");
shared_ptr<FXXK> fxxk_sp(fxxk);
shared_ptr<FXXK> fxxk_sp2(fxxk);    //error, there is no object to be released.
```
and we still have the method:
```
FXXK* fxxk = new FXXK("shit");
shared_ptr<FXXK> fxxk_sp = make_shared<FXXK>("shit");
```
make_shared is faster. It includes two operations: creating an object named "shit" and giving this to fxxk_sp. In addtion it is safer, because if memory allocation failure happened, it means "shit" is maked successfully but fxxk_sp is not.If we make shared_ptr object first and then make assignment, memory will be leaked.But When we use **"make_shared"**, these thing will not happen.

**btw:** shared_ptr can be used by raw pointer.
```
(*fxxk_sp).shit();  //FXXK shit....    so it works.
```


---

## Exception in Destructor
```
class FXXK
{
    string shit_;
public:
    FXXK(string shit) : shit_(shit) { cout << "FXXK-shit is created: " << shit << endl; }
    FXXK() { cout << "Smelly FXXK created. " << endl; shit_ = "Smelly"; }
    ~FXXK() { cout << "FXXK is destroyed: " << shit_ << endl; }
    void shit() { cout << "FXXK " << shit_ << "...." << endl; }
};
```
case:
```
try
{
    FXXK fxxk1("shit1");
    FXXK fxxk2("shit2");
    throw 20;
    fxxk1.shit();
    fxxk2.shit();
}
catch (int e)
{
    cout << e << " is caught" << endl;
}

//FXXK-shit is created: shit1
//FXXK-shit is created: shit2
//FXXK shit1....
//FXXK shit2....
//FXXK is destroyed: shit2
//FXXK is destroyed: shit1
//20 is caught
```
the object created first and it will distroyed first. Because the object are stored on stack.
If you put ***throw* 20;** into ***~FXXK()*** like that:
```
~FXXK() { cout << "FXXK is destroyed: " << shit_ << endl; throw 20;}
```
It will abort in just running. This is why we should not throw exception out of a destructor.
So there are some solutions:

```
//first one solution: Destructor swallow the exception.
~FXXK(){
    try{
        //Enclose all the exception prone code here.
    } catch (Exception& e) {
        //catch exceptino
    } catch (...) {
        //others
    }
}
```

```
//Second solution: Move the exception prone code to a different function.
```

---

## Virtual Function in Constructor or Destructor


```
class FXXK
{
public:
    FXXK() { cout << "FXXK created. " << endl; }
    ~FXXK() { cout << "FXXK is destroyed " << endl; }
    void hehe() { cout << "FXXK hehe " << "...." << endl; }
    void findShit() { hehe(); }
};

class Shit : public FXXK
{
public:
    Shit() { cout << "Shit created. " << endl; }
    void hehe() { cout << "Shit hehe " << "...." << endl; }
};
```
case:

```
Shit s;
s.findShit();
//FXXK created.
//Shit created.
//FXXK hehe ....
//FXXK is destroyed
```
case:

```
class FXXK
{
public:
    FXXK() { cout << "FXXK created. " << endl; }
    ~FXXK() { cout << "FXXK is destroyed " << endl; }
    virtual void hehe() { cout << "FXXK hehe " << "...." << endl; }
    void findShit() { hehe(); }
};

class Shit : public FXXK
{
public:
    Shit() { cout << "Shit created. " << endl; }
    virtual void hehe() { cout << "Shit hehe " << "...." << endl; }
};

Shit s;
s.findShit();
//FXXK created.
//Shit created.
//Shit hehe ....
//FXXK is destroye
```
---
## Logic Constness and Bitwise Constness


```
class Fxxk
{
    vector<int> v;
    int shitCounter;
public:
    int getItem(int index) const 
    {
        shitCounter++;  //error, if it work, make shitCounter to be mutable type
        //or const_cast<Fxxk*>(this)->shitCounter++;
        return v[index];
    }
};
```
---
## Assignment to Self in Assignment Operator


```
class Shit
{
    Shit() = delete;
    Shit(Shit* shit) = delete;
};
class Fxxk
{
    Shit* shit;
    Fxxk& operator=(const Fxxk& rhs)
    {
        if (this == &rhs)
            return *this;

        //unsafe:
        //delete shit;
        //shit = new Shit(*rhs.shit);
        Shit* pOrigShit = shit;
        shit = new Shit(*rhs.shit);
        delete pOrigShit;
        return *this;
    }
};
```

---

## auto关键字


```
void func(auto a = 1);  //error:auto不能用于函数参数

struct Foo
{
	auto var1_ = 0;  //error:auto不能用于非静态成员变量
	static const auto var2_ = 0;
};

template <typename T>
struct Bar {};

int main(void)
{
	int arr[10] = {0};
	auto aa = arr;  //OK: aa -> int *
	auto rr[10] = arr;  //error:auto无法定义数组
	Bar<int> bar;
	Bar<auto> bb = bar;  //error:auto无法推导出模板参数

	system("pause");
	return 0;
}
```







***This paper is Copyrighted @2017 by CanftIn(Wancan Wang), you can contact him by*** www.canftin.com ***or*** [weibo](https://weibo.com/u/5632002270)




----