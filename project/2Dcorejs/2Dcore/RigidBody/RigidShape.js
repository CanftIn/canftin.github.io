"use strict";

function RigidShape(center, mass, friction, restitution) {
    this.mCenter = center;
    this.mInertia = 0;
    if (mass !== undefined) {
        this.mInvMass = mass;
    } else {
        this.mInvMass = 1;
    }

    if (friction !== undefined) {
        this.mFriction = friction;
    } else {
        this.mFriction = 0.8;
    }

    if (restitution !== undefined) {
        this.mRestitution = restitution;
    } else {
        this.mRestitution = 0.2;
    }

    this.mVelocity = new Vec2(0, 0);

    if (this.mInvMass !== 0) {
        this.mInvMass = 1 / this.mInvMass;
        this.mAcceleration = gEngine.Core.mGravity;
    } else {
        this.mAcceleration = new Vec2(0, 0);
    }

    //angle
    this.mAngle = 0;

    //negetive-- clockwise
    //postive-- counterclockwise
    this.mAngularVelocity = 0;

    this.mAngularAcceleration = 0;

    this.mBoundRadius = 0;

    gEngine.Core.mAllObjects.push(this);
}

RigidShape.prototype.updateMass = function (delta) {
    var mass;
    if (this.mInvMass !== 0) {
        mass = 1 / this.mInvMass;
    } else {
        mass = 0;
    }

    mass += delta;
    if (mass <= 0)="" {="" this.minvmass="0;" this.mvelocity="new" vec2(0,="" 0);="" this.macceleration="new" this.mangularvelocity="0;" this.mangularacceleration="0;" }="" else="" mass;="" this.updateinertia();="" };="" rigidshape.prototype.updateinertia="function" ()="" subclass="" must="" define="" this.="" anime="" rigidshape.prototype.update="function" if="" (gengine.core.mmovement)="" var="" dt="gEngine.Core.mUpdateIntervalInSeconds;" v="" +="a*t" s="" this.move(this.mvelocity.scale(dt));="" *="" dt;="" this.rotate(this.mangularvelocity="" dt);="" rigidshape.prototype.boundtest="function" (othershape)="" vfrom1to2="otherShape.mCenter.subtract(this.mCenter);" rsum="this.mBoundRadius" othershape.mboundradius;="" dist="vFrom1to2.length();" (dist=""> rSum) {
        //not overlapping
        return false;
    }
    return true;
};</=>