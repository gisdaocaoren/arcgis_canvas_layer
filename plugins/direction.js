define([
    "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/array",
    "dojo/dom-construct", "dojo/dom-style", "dojo/number",
    "esri/lang", "esri/domUtils",
    "esri/SpatialReference", "esri/geometry/Point", "esri/layers/layer"
], function(
    declare, connect, arrayUtils,
    domConstruct, domStyle, number,
    esriLang, domUtils,
    SpatialReference, Point, Layer
) {
    // shim layer with setTimeout fallback
    window.requestAnimationFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( callback ){
                window.setTimeout(callback, 1000);
            };
    })();
    function rand( min, max ) {
        return Math.random() * ( max - min ) + min;
    }
     
    function segment(x,y,endX,endY,vx,vy){
        this.x = x;
        this.y=y;
        this.startX = x;
        this.startY =y;
        this.endX=endX;
        this.endY=endY;
        var secs =parseInt(rand(60,120)) ;
        this.vx= (this.endX - this.startX)/secs;
        this.vy= (this.endY - this.startY)/secs;
        this.path = 5;  
        this.finish = false;  
        this.finishLast = false; 
        // console.log( this.startX+',' +this.startY +"," +this.endX+',' +this.endY);
        // drawCircle('red',this.startX,this.startY,5);
        // drawCircle('blue',this.endX,this.endY,5);
    };

    Date.prototype.format = function(fmt) {
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };
    var PARTICLE_LINE_WIDTH = 1.8;
    var fadeFillStyle = "rgba(255, 0, 0, 0.97)";
    var TRANSPARENT_BLACK = [255, 0, 0, 0.5];
    var τ = 2 * Math.PI;
    var H = Math.pow(10, -5.2);

    function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
    function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
    function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
    function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

    var curIndex = 0; //当前的数据索引（按照时间顺序）
    var map = null;
 
    var colorStyles = [[
        "rgba(" + hexToR('#ffeda0') + ", " + hexToG('#ffeda0') + ", " + hexToB('#ffeda0') + ", " + 0.5 + ")",
        "rgba(" + hexToR('#fed976') + ", " + hexToG('#fed976') + ", " + hexToB('#fed976') + ", " + 0.6 + ")",
        "rgba(" + hexToR('#feb24c') + ", " + hexToG('#feb24c') + ", " + hexToB('#feb24c') + ", " + 0.7 + ")",
        "rgba(" + hexToR('#fd8d3c') + ", " + hexToG('#fd8d3c') + ", " + hexToB('#fd8d3c') + ", " + 0.8+ ")",
        "rgba(" + hexToR('#fc4e2a') + ", " + hexToG('#fc4e2a') + ", " + hexToB('#fc4e2a') + ", " + 0.9 + ")",
        "rgba(" + hexToR('#e31a1c') + ", " + hexToG('#e31a1c') + ", " + hexToB('#e31a1c') + ", " + 1.0 + ")"
    ],[
        "rgba(" + hexToR('#fff7bc') + ", " + hexToG('#fff7bc') + ", " + hexToB('#fff7bc') + ", " + 0.5 + ")",
        "rgba(" + hexToR('#fee391') + ", " + hexToG('#fee391') + ", " + hexToB('#fee391') + ", " + 0.6 + ")",
        "rgba(" + hexToR('#fec44f') + ", " + hexToG('#fec44f') + ", " + hexToB('#fec44f') + ", " + 0.7 + ")",
        "rgba(" + hexToR('#fe9929') + ", " + hexToG('#fe9929') + ", " + hexToB('#fe9929') + ", " + 0.8 + ")",
        "rgba(" + hexToR('#ec7014') + ", " + hexToG('#ec7014') + ", " + hexToB('#ec7014') + ", " + 0.9 + ")",
        "rgba(" + hexToR('#cc4c02') + ", " + hexToG('#cc4c02') + ", " + hexToB('#cc4c02') + ", " + 1.0 + ")"
    ],[
        "rgba(" + hexToR('#c7e9b4') + ", " + hexToG('#c7e9b4') + ", " + hexToB('#c7e9b4') + ", " + 0.5 + ")",
        "rgba(" + hexToR('#7fcdbb') + ", " + hexToG('#7fcdbb') + ", " + hexToB('#7fcdbb') + ", " + 0.6 + ")",
        "rgba(" + hexToR('#41b6c4') + ", " + hexToG('#41b6c4') + ", " + hexToB('#41b6c4') + ", " + 0.7 + ")",
        "rgba(" + hexToR('#1d91c0') + ", " + hexToG('#1d91c0') + ", " + hexToB('#1d91c0') + ", " + 0.8 + ")",
        "rgba(" + hexToR('#225ea8') + ", " + hexToG('#225ea8') + ", " + hexToB('#225ea8') + ", " + 0.9 + ")",
        "rgba(" + hexToR('#0c2c84') + ", " + hexToG('#0c2c84') + ", " + hexToB('#0c2c84') + ", " + 1.0+ ")"
    ],[
        "rgba(" + hexToR('#d9f0a3') + ", " + hexToG('#d9f0a3') + ", " + hexToB('#d9f0a3') + ", " + 0.5 + ")",
        "rgba(" + hexToR('#addd8e') + ", " + hexToG('#addd8e') + ", " + hexToB('#addd8e') + ", " + 0.6 + ")",
        "rgba(" + hexToR('#78c679') + ", " + hexToG('#78c679') + ", " + hexToB('#78c679') + ", " + 0.7 + ")",
        "rgba(" + hexToR('#41ab5d') + ", " + hexToG('#41ab5d') + ", " + hexToB('#41ab5d') + ", " + 0.8 + ")",
        "rgba(" + hexToR('#238443') + ", " + hexToG('#238443') + ", " + hexToB('#238443') + ", " + 0.9 + ")",
        "rgba(" + hexToR('#005a32') + ", " + hexToG('#005a32') + ", " + hexToB('#005a32') + ", " + 1.0 + ")"
    ],[
        "rgba(" + hexToR('#d4b9da') + ", " + hexToG('#d4b9da') + ", " + hexToB('#d4b9da') + ", " + 0.5 + ")",
        "rgba(" + hexToR('#c994c7') + ", " + hexToG('#c994c7') + ", " + hexToB('#c994c7') + ", " + 0.6 + ")",
        "rgba(" + hexToR('#df65b0') + ", " + hexToG('#df65b0') + ", " + hexToB('#df65b0') + ", " + 0.7 + ")",
        "rgba(" + hexToR('#e7298a') + ", " + hexToG('#e7298a') + ", " + hexToB('#e7298a') + ", " + 0.8 + ")",
        "rgba(" + hexToR('#ce1256') + ", " + hexToG('#ce1256') + ", " + hexToB('#ce1256') + ", " + 0.9 + ")",
        "rgba(" + hexToR('#91003f') + ", " + hexToG('#91003f') + ", " + hexToB('#91003f') + ", " + 1.0 + ")"
    ]];
    var RL = declare("Direction",null, {
        bounds:null,
        width:0,
        height:0,
        segments:[],  
        constructor: function(params) {
            this.params = params;
            map = params.map;
        },
        start:function(bounds, width, height, extent){
            console.log('开始');
            this.bounds = bounds;
            this.width = width;
            this.height = height;
            this.isDrawTail = true;  
            var self = this;
            var animateTimes = 0;
            
            (function draw(){
                this.timer = setTimeout(function(){
                    var data = self.params.data[curIndex];
                    if(animateTimes%10 == 0){
                        data.data.forEach(function(d){
                            self.segments.push(self.generateSegment(d));
                        },self);
                        curIndex < (self.params.data.length-1)?curIndex++:curIndex = 0;
                        document.getElementById('time').innerHTML = data.time;
                        bar.hightLight(curIndex);
                    }else{
                        document.getElementById('time').innerHTML = new Date(new Date(data.time).getTime()+60*1000*(animateTimes%10)).format("yyyy-MM-dd hh:mm");
                    }
                    self.draw(self);
                    draw();
                    animateTimes++;
                },100);
            })();
            
            // this.draw(bounds,width, height);
        },
        generateSegment:function(data){
            var startP = new Point({x:data.startlng,y:data.startlat,spatialReference:{wkid:4326}});
            var endP = new Point({x:data.endlng,y:data.endlat,spatialReference:{wkid:4326}});
            return new segment(startP.x,startP.y,endP.x,endP.y,0,0)
        },


    

        // 构建范围对象
        buildBounds:function() {
            var bounds = this.bounds;
            var width = this.width;
            var height = this.height;

            var upperLeft = bounds[0];
            var lowerRight = bounds[1];
            var x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);
            var y = Math.max(Math.floor(upperLeft[1], 0), 0);
            var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
            var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
            return {x: x, y: y, xMax: width, yMax: yMax, width: width, height: height};
        },

        stop:function(){
            if (this.field) this.field.release();
            if (this.timer) clearTimeout(this.timer)
        },

        _getScreamCoordinate:function(startP,endP){
            var s = map.toScreen(startP);
            var e = map.toScreen(endP);
            return {x:s.x,y:s.y,xt:e.x,yt:e.y};

        },
        _drawPath:function(particle,color){
                segments.push(new segment(minX,minY,maxX,maxY,0,0));
        },

         
        drawTail:function(ctx,color,segment){
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            var startP = new Point({x:segment.startX,y:segment.startY,spatialReference:{wkid:4326}});
            var endP = new Point({x:segment.x,y:segment.y,spatialReference:{wkid:4326}});
            var particle = this._getScreamCoordinate(startP,endP);
            ctx.moveTo(particle.x,~~particle.y);
            ctx.lineTo(particle.xt, ~~particle.yt);
            ctx.stroke();
        },

        drawSegment:function(ctx,segment,idx) {
            if(segment.finishLast){
                return;
            }
            if(segment.finish){
                segment.finishLast =true;
            }
            var colors = colorStyles[idx%5];
            // var colors = ['#f0ffdd','#a0ffd9','#00ffb5','#0cffd1','#00f0cc','#04e2f0','#0006f0','#00e0f0','#0dd0f0'];
            //        ctx.strokeStyle = 'hsla(' + this.colorAngle + ',100%,50%,1)'; 
            this.isDrawTail && this.drawTail(ctx,colors[0],segment);
            for(var i=0;i<segment.path;i++){
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = 0.6+i*0.3;
                ctx.beginPath();
                var startP = new Point({x:segment.x,y:segment.y,spatialReference:{wkid:4326}});
                var endP = new Point({x:(parseFloat(segment.x)+parseFloat(segment.vx)),y:(parseFloat(segment.y)+parseFloat(segment.vy)),spatialReference:{wkid:4326}});
                var particle = this._getScreamCoordinate(startP,endP);
                ctx.moveTo(particle.x,~~particle.y);
                ctx.lineTo(particle.xt, ~~particle.yt); 
                ctx.stroke();
                if((segment.endX - segment.startX >0)&&(segment.x>segment.endX) || (segment.endX - segment.startX <0)&&(segment.x<segment.endX)){ 
                    segment.finish = true;
                }else{
                    segment.x =  parseFloat(segment.x) +parseFloat(segment.vx);
                }
                if((segment.endY - segment.startY >0)&&(segment.y>segment.endY) || (segment.endY - segment.startY <0)&&(segment.y<segment.endY)){ 
                    segment.finish = true;
                }else{
                    segment.y = parseFloat(segment.y)+ parseFloat(segment.vy);
                }
            }
        },

        draw:function(scope){
            var bounds = scope.bounds;
            var width = scope.width;
            var height = scope.height;

            var bound = scope.buildBounds(bounds,width, height);
            var g = scope.params.canvas.getContext("2d");
            g.clearRect(bound.x, bound.y, bound.width, bound.height);
            g.lineWidth = PARTICLE_LINE_WIDTH;
            g.fillStyle = fadeFillStyle;

            var prev = g.globalCompositeOperation;
            g.globalCompositeOperation = "destination-in";
            g.fillRect(bound.x, bound.y, bound.width, bound.height);
            g.globalCompositeOperation = prev;

            scope.segments.forEach(function(segment,i){
                // g.beginPath();
                // var idx = i%10;
                // g.strokeStyle = colorStyles[idx];
                // var startP = new Point({x:data.startlng,y:data.startlat,spatialReference:{wkid:4326}});
                // var endP = new Point({x:data.endlng,y:data.endlat,spatialReference:{wkid:4326}});
                // var particle = this._getScreamCoordinate(startP,endP);
                // g.moveTo(particle.x, particle.y);
                // g.lineTo(particle.xt, particle.yt);
                // g.stroke();
                scope.drawSegment(g,segment,i);
            },scope);

            // buckets.forEach(function(bucket, i) {
            //     if (bucket.length > 0) {
            //         g.beginPath();
            //         g.strokeStyle = colorStyles[i];
            //         bucket.forEach(function(particle) {
            //             g.moveTo(particle.x, particle.y);
            //             g.lineTo(particle.xt, particle.yt);
            //             particle.x = particle.xt;
            //             particle.y = particle.yt;
            //         });
            //         g.stroke();
            //     }
            // });
        }
    });

    return RL;
});
