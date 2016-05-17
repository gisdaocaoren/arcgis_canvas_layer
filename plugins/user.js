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

    var PARTICLE_LINE_WIDTH = 0.8;
    var fadeFillStyle = "rgba(255, 0, 0, 0.01)";
    var TRANSPARENT_BLACK = [255, 0, 0, 0.5];
    var τ = 2 * Math.PI;
    var H = Math.pow(10, -5.2);
    function rand( min, max ) {
        return Math.random() * ( max - min ) + min;
    }
    function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
    function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
    function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
    function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
    var curIndex = 0;  
    var map = null;
    var colorStyles = [
        "rgba(77,186,248,0.05)",
        "rgba(255,174,76,0.05)",
        "rgba(225,210,76,0.05)",
        "rgba(221,99,234,0.05)",
        // "rgba(77,186,248,0.3)",
        "rgba(96,96,96,0.05)"
    ];
    var borderStyles = [
        "rgba(88,183,76,0.7)",
        "rgba(64,85,161,0.7)",
        "rgba(194,74,205,0.7)",
        "rgba(216,40,40,0.7)",
        // "rgba(86,214,214,0.7)",
        "rgba(254,254,254,0.7)"
    ]

    var RL = declare("User",null, {
        bounds:null,
        width:0,
        height:0,
        constructor: function(params) {
            this.params = params;
            map = params.map;
        },
        start:function(bounds, width, height, extent){
            console.log('开始');
            this.bounds = bounds;
            this.width = width;
            this.height = height;
            var self = this; 
            (function draw(){
                this.timer = setTimeout(function(){
                    var data = self.params.data[curIndex];
                    self.draw(self,data.data);
                    curIndex++; 
                    draw();
                },1000);
            })();
        },

 
        buildBounds:function( bounds, width, height ) {
            var upperLeft = bounds[0];
            var lowerRight = bounds[1];
            var x = Math.round(upperLeft[0]);  
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

        _drawCircle:function(context,center,radius,color,borderColor){
            var innerPlayTimes = 10;
            var innerPlayIdx = 1;
            var radius = rand( 15, 20 );
            var baseAlpha = 0.5;
            (function innerDrawCircle(){
                var radiusX = radius/(innerPlayTimes/2)*(innerPlayIdx>(innerPlayTimes/2)?(innerPlayTimes/2):innerPlayIdx);
                var alphaX = baseAlpha;
                if(innerPlayIdx<=(innerPlayTimes/2)){
                    alphaX = baseAlpha/(innerPlayTimes/2)*innerPlayIdx;
                }else{
                    alphaX = baseAlpha/(innerPlayTimes/2)*(innerPlayTimes-innerPlayIdx);
                }
                context.beginPath(); 

                context.arc( center.x, center.y , radiusX, 0, Math.PI*2 );
                context.fillStyle = color;
                context.fill();
                if(innerPlayIdx==parseInt(innerPlayTimes/2)){
                    context.beginPath();
                    context.arc( center.x, center.y , radiusX, 0, Math.PI*2 );
                    context.strokeStyle = borderColor;
                    context.stroke();
                }
                if(innerPlayIdx<(innerPlayTimes/2)){
                    (innerPlayIdx++,setTimeout(innerDrawCircle,100)); 
                }else if(innerPlayIdx<innerPlayTimes){
                    (innerPlayIdx++,setTimeout(innerDrawCircle,100));  
                }

            })();
        },
        draw:function(scope, datas){
            var bounds = scope.bounds;
            var width = scope.width;
            var height = scope.height;

            var bound = this.buildBounds(bounds,width, height);
            var g = this.params.canvas.getContext("2d");
            g.clearRect(bound.x, bound.y, bound.width, bound.height);
            g.lineWidth = PARTICLE_LINE_WIDTH;
            g.fillStyle = fadeFillStyle;

            var prev = g.globalCompositeOperation;
            // g.globalCompositeOperation = "destination-in";
            g.fillRect(bound.x, bound.y, bound.width, bound.height);
            // g.globalCompositeOperation = prev;

            datas.forEach(function(data,i){
                // g.beginPath();
                var idx = data.myrole == 'bill'?3:data.myrole == 'car'?2:data.myrole == 'forwarders'?1:data.myrole == 'driver'?0:4;
                var point = new Point({x:data.lat,y:data.lng,spatialReference:{wkid:4326}});
                var color = colorStyles[idx];
                var borderColor = borderStyles[idx];
                this._drawCircle(g,map.toScreen(point),10,color,borderColor);
            },this);

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
