---
title: OSGI知识点
date: 2018-04-11 20:33:30
tags:
---
# 使用OSGI优缺点

使用OSGI构建Java应用优点比较明显，主要体现在以下几个方面：

1、基于OSGI的应用程序可动态更改运行状态和行为。在OSGI框架中，每一个Bundle实际上都是可热插拔的，因此，对一个特定的Bundle进行修改不会影响到容器中的所有应用，运行的大部分应用还是可以照常工作。当你将修改后的Bundle再部署上去的时候，容器从来没有重新启过。这种可动态更改状态的特性在一些及时性很强的系统中比较重要，尤其是在Java Web项目中，无需重启应用服务器就可以做到应用的更新。

2、OSGI是一个微核的系统，所谓微核是指其核心只有为数不多的几个jar包。基于OSGI框架的系统可分可合，其结构的优势性导致具体的Bundle不至于影响到全局，不会因为局部的错误导致全局系统的崩溃。例如Java EE项目中可能会因为某个Bean的定义或注入有问题，而导致整个应用跑不起来，而使用OSGI则不会有这种问题，顶多相关的几个Bundle无法启动。

3、可复用性强，OSGI框架本身可复用性极强，很容易构建真正面向接口的程序架构，每一个Bundle 都是一个独立可复用的单元。

使用OSGI的缺点如下： 
1、每个Bundle都由单独的类加载器加载，与一些Java EE项目中使用比较多的框架整合比较困难。

2、目前OSGI框架提供的管理端不够强大，现在的管理端中仅提供了基本的Bundle状态管理、日志查看等功能，像动态修改系统级别的配置(config.ini)、动态修改Bundle的配置(Manifest.mf)、启动级别等功能都尚未提供，而这些在实际的项目或产品中都是非常有必要的。

3、采用OSGI作为规范的模块开发、部署方式自然给现有开发人员提出了新的要求，需要学习新的基于OSGI的开发方式。


# 三、OSGI具体实现

OSGI是OSGi Alliance组织制定的Java模块化规范，但是该组织并没有给出OSGI容器的实现，具体实现由第三方厂商完成，目前使用较多的OSGI容器有 Apache Felix和Equinox。
[osgi企业应用开发](http://m.blog.csdn.net/Rongbo_J/article/details/53711964)


# 一、OSGi基本概念
### **1.	Bundle**

>    Bundle是OSGi中的模块，其生命周期被OSGi所管理，可以被动态的安装、启动、停止和卸载。通过OSGi框架将多个Bundle组织在一起就形成了系统。每一个Bundle有独立于其他Bundle的ClassLoader，所以每个Bundle的内部实现都是隔离的。

**状态转换关系如下:**

![](C:\Users\CanftIn\Desktop\osgithinking\osgi.png)

在toast项目中，开始先常规建立Gps，Airbag，emergency等类，全部放在Toast项目下Toast包中，再加入Main类作为启动项。

然后将Toast项目划分为各个Bundle，将其模块化为下图：
### bundle依赖
```
graph TD
    A[紧急情况监视器] --> B[安全气囊]
    A[紧急情况监视器] --> C[GPS]
```
将原项目中的类全部映射到各个Bundle中去，在Gps、Airbag中导出所包供emergency使用。

在Bundle中服务的注册是在Activator中的start和stop里使用org.osgi.framework.ServiceRegistration包，调用registerService()和unregister()。

### **2.	Service**
> OSGi服务就是注册到OSGi框架当中的Java对象。在注册时可以设置这个Service的属性。在获取Service是可以根据属性进行过滤。Bundle可以根据Bundle的上下文去注册Service或查询Service。

### 交互过程：

```
graph BT
    A[Bundle Service Consumer] --> |getService|B[OSGi FrameWork] 
    C[Bundle Service Provider] --> |register|B[OSGi FrameWork]
    A[Bundle Service Consumer] --> |invoke|C[Bundle Service Provider]
```

### **3.	SOCM**
### **4.	DS**
> 三种处理服务动态特性的机制：OSGi服务追踪器（Service Tracker），服务激活器工具包（Service Activator Toolkit， SAT）的第三方处理机制，以及OSGi的声明式服务（Declaration Services，DS)即这里说的DS。

- 服务追踪器（Service Tracker）
>
    private ServiceTrackerCustomizer createAirbagCustomizer() {
		return new ServiceTrackerCustomizer() {

			@Override
			public Object addingService(ServiceReference reference) {
				Object service = context.getService(reference);
				synchronized(Activator.this) {
					if(Activator.this.airbag == null) {
						Activator.this.airbag = (IAirbag)service;
						Activator.this.bind();
					}
				}
				return service;
			}

			@Override
			public void modifiedService(ServiceReference reference, Object service) {
				
			}

			@Override
			public void removedService(ServiceReference reference, Object service) {
				synchronized(Activator.this) {
					if(service != Activator.this.airbag)
						return;
					Activator.this.unbind();
					Activator.this.bind();
				}
			}
		};
	}

	private ServiceTrackerCustomizer createGpsCustomizer() {
		return new ServiceTrackerCustomizer() {
			public Object addingService(ServiceReference reference) {
				Object service = context.getService(reference);
				synchronized(Activator.this) {
					if(Activator.this.gps == null) {
						Activator.this.gps = (IGps)service;
						Activator.this.bind();
					}
				}
				return service;
			}

			@Override
			public void modifiedService(ServiceReference reference, Object service) {
			}

			@Override
			public void removedService(ServiceReference reference, Object service) {
				synchronized(Activator.this) {
					if(service != Activator.this.airbag)
						return;
					Activator.this.unbind();
					Activator.this.bind();
				}				
			}
		};
		
	}

- SAT 
>    略

- DS
>    声明式服务不需要加载Bundle的代码来判断Bundle所需要的条件是否满足。DS以组件的方式进行工作，一个组件以两个部分构成，一个是xml文件(一般component.xml)，一个是类(用于实现组件所提供的服务并接收所引用的服务)。

>在DS中定义了另外一套模型：Service Component模型，每个提供服务的对象被称为一个服务组件（Service Component），所有的组件均受服务组件运行时SCR（Service Component Runtime）的管理。



# 二、OSGi通信方式

**osgi中每个Bundle都有自己独立于其他Bundle的classloader，因此各个Bundle内部的类是隔离的。**

**而一个Bundle用到另外的Bundle的类，Bundle之间交互通信的实现方式有两种：**

**1、通过Package的导入和导出来实现，即提供类的Bundle对外暴露自己的一个或者多个Package，而使用方需要导入这些package**

**2、通过Service的方式。一个Bundle作为Service的提供方，对外提供Service，使用者查询到提供的Service并使用。而Service又有两种方式：**

- **经典做法，通过BundleContext上下文进行提供和获取**
- **另一种是使用Declaration Service**

# 三、OSGi规范
- 执行环境
- 安全层
- 模块层
  模块层主要做的就是导包。
  动态模块化实现的是模块间的引用与隔离和模块的动态启动与停用。
  关键在于类加载架构。
osgi中类加载器分为三类:
 父类加载器:
- 生命周期层
  在生命周期层的停止过程中，osgi会自动调用Activator的stop方法，执行完stop方法后，其他的bundle就不能再使用该bundle的上下文状态，即bundlecontext对象。
  而即使bundle已经停止，它导出的package仍然是可以使用的，其他的bundle仍然可以执行停止的bundle中的代码。
只是开始bundle安装和解析的过程一定要加入所有所需bundle（未确定）
- 服务层
 服务层包括:
1、service
  服务不能孤立存在，每个服务从属并运行于提供服务的bundle上。
  首先要把服务注册到所有bundle共享的服务注册表（service registry）中。其他bundle使用服务只需从注册表里查找所需服务而不与提供服务的bundle进行交互
```
graph TB
  A[bundle1] --> B[服务注册表]
  C[bundle2] --> B[服务注册表]
```
2、service registry
  服务注册表
3、service reference
4、service registration
5、service event
6、service listener

- 框架API