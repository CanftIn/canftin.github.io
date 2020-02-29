---
layout: post
title: js note
category: PL
tags: javascript
keywords: ljavascript
description: js note
---
## 运算符

- 严格相等（===）和严格不等（!==）要求比较的值必须是相同的类型。
- 普通（或者”宽松“）相等（==）和不等（!=）会先尝试将两个不同类型的值进行转换，再使用严格相等进行比较。

**陷阱：NaN**

特殊数字NaN和本身不相等。

```javascript
> NaN === NaN
false
```

- **x !== y**和**!(x === y)**等价
- **x != y**和**!(x == y)**等价

- 如果两个运算数的类型相同（六种规范类型：Undefined，Null，Boolean，Number，String和Object其中之一），则使用严格相等比较。

- undefined和null被认为是宽松相等的。

  ```javascript
  > undefined == null
  true
  ```

- 一个字符串和一个数字，将字符串转换为一个数字，然后严格相等比较两个运算数。

- 一个布尔值和一个非布尔值，则将布尔值转换为一个数字，然后继续宽松比较。

- 一个对象和一个数字或者一个字符串，则尝试将此对象转化为一个原始值（使用ECMAScript规范中有一个内部函数ToPrimitive()），然后在进行宽松比较。

  ToPrimitive(input, PreferredType?)

  可选参数PreferredType表明转换后的类型：可以是Number或String，具体取决于ToPrimitive希望转换为数字还是字符串。

  如果PreferredType是Number，返回这个值；否则，如果input是对象，调用input.valueOf()，若结果是原始值，则返回结果；否则，调用input.toString()，若结果是原始值，返回结果；否则，抛出一个TypeError。

**陷阱：宽松相等中的对象**

如果比较对象和非对象，它们会被转换为原始值，将导致一些奇怪的结果：

```javascript
> {} == '[object Object]'
true
> ['123'] == 123
true
> [] == 0
true
```

**陷阱：typeof null**

typeof null返回object是一个不能去修正的bug，会破坏现有的代码。因此只能谨慎对待null。

```javascript
function isObject(value) {
    return (value !== null
           && (typeof value === 'object'
               || typeof value === 'function'));
}

> isObject(123)
false
> isObject(null)
false
> isObject({})
true
```

## 数字

- 指数eX，是$$ 10^{x} $$次方的缩写。

- JavaScript有一些特殊的数字值：

  - 两个错误值：NaN和Infinity。
  - 两个零值：+0和-0。

- JavaScript支持的最长的实用整型范围是$$ (-2^{53}, 2^{53}) $$。

- 数组索引范围是$$ [0, 2^{32} -1] $$ 。

- 关于安全整型，ECMAScript6提出以下常量：

  ```javascript
  Number.MAX_SAFE_INTEGER = Math.pow(2, 53)-1;
  Number.MIN_SAFE_INTEGER = -Number.MAX_SAFE_INTEGER;
  ```

  同时提出一个检测整型是否安全的函数：

  ```javascript
  Number.isSafeInteger = function(n) {
      return (typeof n === 'number' &&
             Math.round(n) === n &&
             Number.MIN_SAFE_INTEGER <= n &&
             n <= Number.MAX_SAFE_INTEGER);
  }
  ```

  

## 语句

**最佳实践：不要用for-in来遍历数组**

for-in只会遍历索引而不是数组元素，其次for-in还会遍历所有的（非索引的）属性值。

```javascript
> var arr = ['a', 'b', 'c'];
> for (var key in arr) { console.log(key); }
0
1
2
> var arr1 =  ['a', 'b', 'c']
> arr1.foo = true;
> for (var key in arr) { console.log(key); }
0
1
2
foo
```

## 函数

- 所有函数都是对象、Function构造器的实例。函数从Function.prototype上继承了方法。

- 函数提升表示"将函数的声明放到作用域的开始"。函数声明是做了完全提升的，而变量声明是部分提升。

  ```javascript
  foo();
  function foo(){
      ...
  }
  //实际运行情况
  function foo(){
      ...
  }
  foo();
  ```

  使用var定义进行只对声明有效的代码提升，对赋值过程无效。

  ```javascript
  foo(); // TypeError: undefined is not a function
  var foo = function foo() {
      ...
  };
  ```

  

