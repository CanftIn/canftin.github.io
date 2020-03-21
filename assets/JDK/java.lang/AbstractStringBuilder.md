---
layout: post
title: AbstractStringBuilder
description: JDK source analysis
permalink: /JDK/java.lang/AbstractStringBuilder.html
katex: true
---
# AbstractStringBuilder
> 字符序列的抽象实现，是StringBuilder和StringBuffer的父类

**注：不完全分析**

{:toc}

- 内部变量
```Java
// 以字节形式存储字符序列
byte[] value;
/**
 * The id of the encoding used to encode the bytes in {@code value}.
 */
// 当前字符序列的编码：LATIN1或UTF16，由此可将ASB分为LATIN1-ASB或UTF16-ASB两类
byte coder;
/**
 * The count is the number of characters used.
 */
// 当前ASB内包含的char的数量
int count;
```

## 增加
- 向AbstractStringBuilder末尾添加一个字符序列，实现Appendable接口.
```Java
@Override
public AbstractStringBuilder append(CharSequence s) {
    if (s == null) {
        return appendNull();
    }
    if (s instanceof String) {
        return this.append((String)s);
    }
    if (s instanceof AbstractStringBuilder) {
        return this.append((AbstractStringBuilder)s);
    }
    return this.append(s, 0, s.length());
}
```

- 向AbstractStringBuilder末尾添加一个子序列，该子序列取自字符序列s的[start, end)范围
```Java
@Override
public AbstractStringBuilder append(CharSequence s, int start, int end) {
    if (s == null) {
        s = "null";
    }
    checkRange(start, end, s.length());
    int len = end - start;
    ensureCapacityInternal(count + len);
    if (s instanceof String) {
        appendChars((String)s, start, end);
    } else {
        appendChars(s, start, end);
    }
    return this;
}
```

- 向AbstractStringBuilder末尾添加一个字符串str
```Java
public AbstractStringBuilder append(String str) {
    if (str == null) {
        return appendNull();
    }
    int len = str.length();
    ensureCapacityInternal(count + len);
    putStringAt(count, str);
    count += len;
    return this;
}
```

- 向ASB末尾添加一个子序列，该子序列取自字符数组s的[offset, offset+len)范围
```Java
public AbstractStringBuilder append(char str[], int offset, int len) {
    int end = offset + len;
    checkRange(offset, end, str.length);
    ensureCapacityInternal(count + len);
    appendChars(str, offset, end);
    return this;
}
```

- 向ASB末尾添加一个boolean值的字符串序列
```Java
public AbstractStringBuilder append(boolean b) {
    ensureCapacityInternal(count + (b ? 4 : 5));
    int count = this.count;
    byte[] val = this.value;
    if (isLatin1()) {
        if (b) {
            val[count++] = 't';
            val[count++] = 'r';
            val[count++] = 'u';
            val[count++] = 'e';
        } else {
            val[count++] = 'f';
            val[count++] = 'a';
            val[count++] = 'l';
            val[count++] = 's';
            val[count++] = 'e';
        }
    } else {
        if (b) {
            count = StringUTF16.putCharsAt(val, count, 't', 'r', 'u', 'e');
        } else {
            count = StringUTF16.putCharsAt(val, count, 'f', 'a', 'l', 's', 'e');
        }
    }
    this.count = count;
    return this;
}
```

- 向ASB末尾添加一个子序列，该子序列取自字符数组s的[off, end)范围
```Java
private final void appendChars(char[] s, int off, int end) {
    int count = this.count;
    if (isLatin1()) {
        byte[] val = this.value;
        for (int i = off, j = count; i < end; i++) {
            char c = s[i];
            if (StringLatin1.canEncode(c)) {
                val[j++] = (byte)c;
            } else {
                this.count = count = j;
                inflate();
                StringUTF16.putCharsSB(this.value, j, s, i, end);
                this.count = count + end - i;
                return;
            }
        }
    } else {
        StringUTF16.putCharsSB(this.value, count, s, off, end);
    }
    this.count = count + end - off;
}

private final void appendChars(String s, int off, int end) {
    if (isLatin1()) {
        if (s.isLatin1()) {
            System.arraycopy(s.value(), off, this.value, this.count, end - off);
        } else {
            // We might need to inflate, but do it as late as possible since
            // the range of characters we're copying might all be latin1
            byte[] val = this.value;
            for (int i = off, j = count; i < end; i++) {
                char c = s.charAt(i);
                if (StringLatin1.canEncode(c)) {
                    val[j++] = (byte) c;
                } else {
                    count = j;
                    inflate();
                    System.arraycopy(s.value(), i << UTF16, this.value, j << UTF16, (end - i) << UTF16);
                    count += end - i;
                    return;
                }
            }
        }
    } else if (s.isLatin1()) {
        StringUTF16.putCharsSB(this.value, this.count, s, off, end);
    } else { // both UTF16
        System.arraycopy(s.value(), off << UTF16, this.value, this.count << UTF16, (end - off) << UTF16);
    }
    count += end - off;
}

private final void appendChars(CharSequence s, int off, int end) {
    if (isLatin1()) {
        byte[] val = this.value;
        for (int i = off, j = count; i < end; i++) {
            char c = s.charAt(i);
            if (StringLatin1.canEncode(c)) {
                val[j++] = (byte)c;
            } else {
                count = j;
                inflate();
                StringUTF16.putCharsSB(this.value, j, s, i, end);
                count += end - i;
                return;
            }
        }
    } else {
        StringUTF16.putCharsSB(this.value, count, s, off, end);
    }
    count += end - off;
}
```

## 删除
- 删除[start, end)范围内的char
```Java
public AbstractStringBuilder delete(int start, int end) {
    int count = this.count;
    if (end > count) {
        end = count;
    }
    checkRangeSIOOBE(start, end, count);
    int len = end - start;
    if (len > 0) {
        shift(end, -len);
        this.count = count - len;
    }
    return this;
}
```

- 删除索引为index的char
```Java
public AbstractStringBuilder deleteCharAt(int index) {
    checkIndex(index, count);
    shift(index + 1, -1);
    count--;
    return this;
}
```

## 插入
- 向ASB的dstOffset索引处插入一个子序列s
```Java
public AbstractStringBuilder insert(int dstOffset, CharSequence s) {
    if (s == null) {
        s = "null";
    }
    if (s instanceof String) {
        return this.insert(dstOffset, (String)s);
    }
    return this.insert(dstOffset, s, 0, s.length());
}
```

- 向ASB的dstOffset索引处插入一个子序列，该子序列取自字符序列s的[start, end)范围
```Java
public AbstractStringBuilder insert(int dstOffset, CharSequence s,
                                    int start, int end)
{
    if (s == null) {
        s = "null";
    }
    checkOffset(dstOffset, count);
    checkRange(start, end, s.length());
    int len = end - start;
    ensureCapacityInternal(count + len);
    shift(dstOffset, len);
    count += len;
    putCharsAt(dstOffset, s, start, end);
    return this;
}
```

## 替换
- 向ASB的dstOffset索引处插入一个子序列，该子序列取自字符序列s的[start, end)范围
```Java
public AbstractStringBuilder replace(int start, int end, String str) {
    int count = this.count;
    if (end > count) {
        end = count;
    }
    checkRangeSIOOBE(start, end, count);
    int len = str.length();
    int newCount = count + len - (end - start);
    ensureCapacityInternal(newCount);
    shift(end, newCount - count);
    this.count = newCount;
    putStringAt(start, str);
    return this;
}
```

## 求子串
- 求ASB在[start, ∞)范围内的子串
```Java
public String substring(int start) {
    return substring(start, count);
}
```

- 求ASB在[start, start+end)范围内的子串
```Java
public String substring(int start, int end) {
    checkRangeSIOOBE(start, end, count);
    if (isLatin1()) {
        return StringLatin1.newString(value, start, end - start);
    }
    return StringUTF16.newString(value, start, end - start);
}
```

## 容量
- 返回当前ASB的容量（可以容纳的char的数量）
```Java
public int capacity() {
    return value.length >> coder;
}
```

- 确保ASB内部拥有最小容量minimumCapacity
```Java
public void ensureCapacity(int minimumCapacity) {
    if (minimumCapacity > 0) {
        ensureCapacityInternal(minimumCapacity);
    }
}
```

## 比较
- 返回当前ASB内包含的char的数量

注意：此方法返回的并不是字符的数量，因为对于Unicode增补字符1个代码点对应2个代码单元。可以通过codePointCount方法获取字符数。
```Java
@Override
public int length() {
    return count;
}
```

## 越界检查
```Java
    /*▼ 越界检查 ████████████████████████████████████████████████████████████████████████████████┓ */
    /* IndexOutOfBoundsException, if out of bounds */
    // 保证0<=start<=end<=len
    private static void checkRange(int start, int end, int len) {
        if(start<0 || start>end || end>len) {
            throw new IndexOutOfBoundsException("start " + start + ", end " + end + ", length " + len);
        }
    }
    /* StringIndexOutOfBoundsException, if out of bounds */
    // 保证0<=start<=end<=len
    private static void checkRangeSIOOBE(int start, int end, int len) {
        if(start<0 || start>end || end>len) {
            throw new StringIndexOutOfBoundsException("start " + start + ", end " + end + ", length " + len);
        }
    }
    /*▲ 越界检查 ████████████████████████████████████████████████████████████████████████████████┛ */

```






