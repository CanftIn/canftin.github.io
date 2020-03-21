---
layout: post
title: Object
description: JDK source analysis
permalink: /JDK/java.lang/Object.html
katex: true
---
# Object
> Java类的共同祖先

- 返回当前对象所属的类的类对象
```Java
@HotSpotIntrinsicCandidate
public final native Class<?> getClass();
```
HotSpotIntrinsicCandidate 在HotSpot虚拟机上特定使用。

- 返回当前对象的哈希码，往往作为当前对象的唯一标识
```Java
@HotSpotIntrinsicCandidate
public native int hashCode();
```

- 判等，默认的实现只是简单地比较两个对象的引用。更多判等操作可参考Arrays.equals方法
```Java
public boolean equals(Object obj) {
    return (this == obj);
}
```
- 字符串化，往往需要重写
```Java
public String toString() {
    return getClass().getName() + "@" + Integer.toHexString(hashCode());
}
```

- 浅拷贝，使用时往往需要重写为public形式。

*注：要求被克隆的对象所属的类实现Cloneable接口*
```Java
@HotSpotIntrinsicCandidate
protected native Object clone() throws CloneNotSupportedException;
```

- 对象在被GC回收后执行的清理操作。可能会引发OOM，建议使用java.lang.ref.Cleaner替代，Java9被弃用
```Java
@Deprecated(since="9")
protected void finalize() throws Throwable { }
```

// TODO: need to be reviewed.
```java
// https://github.com/kangjianwei/LearningJDK/blob/master/src/java/lang/Object.java
/*▼ 线程 ████████████████████████████████████████████████████████████████████████████████┓ */
/*
 * wait使得调用wait方法的线程放弃锁的持有权，并进入WAITING或TIMED_WAITING状态
 *
 * wait方法应当配合synchronized一起使用：
 *
 * 示例一：
 * synchronized void fun(){
 *   try {
 *      wait(1000);
 *   } catch(InterruptedException e) {
 *      e.printStackTrace();
 *   }
 * }
 *
 * 示例二：
 * synchronized(object) {
 *   try {
 *     object.wait(1000);
 *   } catch(InterruptedException e) {
 *     e.printStackTrace();
 *   }
 * }
 *
 * wait让当前线程陷入等待的同时，释放其持有的锁，以便让其他线程争夺锁的控制权
 * 作为对比，Thread.sleep方法即使陷入等待，也不会释放其持有的锁
 *
 * wait线程醒来的条件：
 * 1. 超时
 * 2. 被notify()或notifyAll()唤醒
 * 3. 在其他线程中调用该线程的interrupt()方法
 *
 * 注：
 * wait方法持有的锁是当前wait所处的上下文的对象（某个栈帧中的对象）
 * 如果wait持有的锁与当前上下文中的锁不一致，或者wait和notify用的锁不一致，会触发InterruptedException

 */
// 永不超时，需要靠上述条件2或条件3唤醒（释放锁）
public final void wait() throws InterruptedException {
    wait(0L);
}
// 等待timeoutMillis毫秒之后自动醒来，或者靠上述条件2或条件3唤醒（释放锁）
public final native void wait(long timeoutMillis) throws InterruptedException;

/*
 * 至少等待timeoutMillis毫秒，nanos是一个纳秒级的附加时间，用来微调timeoutMillis参数（释放锁）
 * 内部实现可参考Thread中的void sleep(long millis, int nanos)方法
 */
public final void wait(long timeoutMillis, int nanos) throws InterruptedException {
    if (timeoutMillis < 0) {
        throw new IllegalArgumentException("timeoutMillis value is negative");
    }

    if (nanos < 0 || nanos > 999999) {
        throw new IllegalArgumentException(
                            "nanosecond timeout value out of range");
    }

    if (nanos > 0 && timeoutMillis < Long.MAX_VALUE) {
        timeoutMillis++;
    }

    wait(timeoutMillis);
}
// 随机唤醒某个具有相同锁的对象从wait状态进入争锁状态
@HotSpotIntrinsicCandidate
public final native void notify();
// 唤醒所有具有相同锁的对象从wait状态进入争锁状态
@HotSpotIntrinsicCandidate
public final native void notifyAll();
```

注：native关键字说明其修饰的方法是一个原生态方法，方法对应的实现不是在当前文件，而是在用其他语言（如C和C++）实现的文件中。Java语言本身不能对操作系统底层进行访问和操作，但是可以通过JNI接口调用其他语言来实现对底层的访问。

