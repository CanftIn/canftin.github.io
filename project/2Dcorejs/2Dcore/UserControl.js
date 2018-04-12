/* global object: gEngine */

"use strict";
var gObjectNum = 0;
function userControl(event) {
    var keycode;
    
    // platform keycode
    if (window.event) { // IE
        keycode = event.keyCode;
    } else if (event.which) { // Netscape/Firefox/Opera 
        keycode = event.which;
    }

    // 0-9
    if (keycode >= 48 && keycode <= 48="" 57)="" {="" if="" (keycode="" -="" <="" gengine.core.mallobjects.length)="" gobjectnum="keycode" 48;="" }="" ↑="" ↓="" 38)="" up="" arrow="" (gobjectnum=""> 0) {
            gObjectNum--;
        }
    }
    if (keycode === 40) { // down arrow
        if (gObjectNum < gEngine.Core.mAllObjects.length - 1) {
            gObjectNum++;
        }
    }

    // move with WASD keys
    if (keycode === 87) { //W
        gEngine.Core.mAllObjects[gObjectNum].move(new Vec2(0, -10));
    }
    if (keycode === 83) { //S
        gEngine.Core.mAllObjects[gObjectNum].move(new Vec2(0, +10));
    }
    if (keycode === 65) { //A
        gEngine.Core.mAllObjects[gObjectNum].move(new Vec2(-10, 0));
    }
    if (keycode === 68) { //D
        gEngine.Core.mAllObjects[gObjectNum].move(new Vec2(10, 0));
    }

    // Rotate with QE keys
    if (keycode === 81) { //Q
        gEngine.Core.mAllObjects[gObjectNum].rotate(-0.1);
    }
    if (keycode === 69) { //E
        gEngine.Core.mAllObjects[gObjectNum].rotate(0.1);
    }

    if (keycode === 73) { //I
        gEngine.Core.mAllObjects[gObjectNum].mVelocity.y -= 1;
    }
    if (keycode === 75) { //k
        gEngine.Core.mAllObjects[gObjectNum].mVelocity.y += 1;
    }
    if (keycode === 74) { //j
        gEngine.Core.mAllObjects[gObjectNum].mVelocity.x -= 1;
    }
    if (keycode === 76) { //l
        gEngine.Core.mAllObjects[gObjectNum].mVelocity.x += 1;
    }
    if (keycode === 85) { //U
        gEngine.Core.mAllObjects[gObjectNum].mAngularVelocity -= 0.1;
    }
    if (keycode === 79) { //O
        gEngine.Core.mAllObjects[gObjectNum].mAngularVelocity += 0.1;
    }
    if (keycode === 90) { //Z
        gEngine.Core.mAllObjects[gObjectNum].updateMass(-1);
    }
    if (keycode === 88) { //X
        gEngine.Core.mAllObjects[gObjectNum].updateMass(1);
    }
    if (keycode === 67) { //C
        gEngine.Core.mAllObjects[gObjectNum].mFriction -= 0.01;
    }
    if (keycode === 86) { //V
        gEngine.Core.mAllObjects[gObjectNum].mFriction += 0.01;
    }
    if (keycode === 66) { //B
        gEngine.Core.mAllObjects[gObjectNum].mRestitution -= 0.01;
    }
    if (keycode === 78) { //N
        gEngine.Core.mAllObjects[gObjectNum].mRestitution += 0.01;
    }
    if (keycode === 188) { //,
        gEngine.Core.mMovement = !gEngine.Core.mMovement;
    }


    // draw rectangle && circle
    if (keycode === 70) {//f
        var r1 = new Rectangle(new Vec2(gEngine.Core.mAllObjects[gObjectNum].mCenter.x,
                gEngine.Core.mAllObjects[gObjectNum].mCenter.y),
                Math.random() * 100 + 10, Math.random() * 100 + 10);
    }
    if (keycode === 71) {//g
        var r1 = new Circle(new Vec2(gEngine.Core.mAllObjects[gObjectNum].mCenter.x,
                gEngine.Core.mAllObjects[gObjectNum].mCenter.y),
                Math.random() * 60 + 20);
    }

    if (keycode === 72) {
        //H
        var i;
        for (i = 0; i < gEngine.Core.mAllObjects.length; i++) {
            if (gEngine.Core.mAllObjects[i].mInvMass !== 0) {
                gEngine.Core.mAllObjects[i].mVelocity = new Vec2(Math.random() * 20 - 10, Math.random() * 20 - 10);
            }
        }
    }
    
    // clear window
    if (keycode === 82) { //R
        gEngine.Core.mAllObjects.splice(5, gEngine.Core.mAllObjects.length);
        gObjectNum = 0;
    }
}</=>