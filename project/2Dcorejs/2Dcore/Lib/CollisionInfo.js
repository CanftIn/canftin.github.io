"use strict";function CollisionInfo(){this.mDepth=0,this.mNormal=new Vec2(0,0),this.mStart=new Vec2(0,0),this.mEnd=new Vec2(0,0)}CollisionInfo.prototype.setDepth=function(t){this.mDepth=t},CollisionInfo.prototype.setNormal=function(t){this.mNormal=t},CollisionInfo.prototype.getDepth=function(){return this.mDepth},CollisionInfo.prototype.getNormal=function(){return this.mNormal},CollisionInfo.prototype.setInfo=function(t,o,i){this.mDepth=t,this.mNormal=o,this.mStart=i,this.mEnd=i.add(o.scale(t))},CollisionInfo.prototype.changeDir=function(){this.mNormal=this.mNormal.scale(-1);var t=this.mStart;this.mStart=this.mEnd,this.mEnd=t};