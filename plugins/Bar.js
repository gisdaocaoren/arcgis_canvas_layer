/**
 * Created by Administrator on 2016/4/29.
 */
var Bar = function(list){
    var data = [];
    var svg = null;
    var highLightIdx = null;
    var tickValues = [];
    function type(d) {
        d.num = d.data.length;
        d.timeText = d.time.substr(11,6);
        d.timeText == '0' && (d.timeText = d.timeText.substr(1));
        return d;
    }
    var init = function(){
        data = list.map(type);
        svg= d3.select("body").append("svg");
        for(var i=0;i<data.length;i++){
            i%10 ==0 && tickValues.push(data[i].timeText);
        }
    }
    var renderer = function(width,height){
        svg.html('');
        var margin = {top: 10, right: 20, bottom: 10, left: 20},
            width = width - margin.left - margin.right,
            height = height - margin.top - margin.bottom;
        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickValues(tickValues)
            .orient("bottom")

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10, "%");

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        x.domain(data.map(function(d) { return d.timeText; }));
        y.domain([0, d3.max(data, function(d) { return d.num; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.timeText); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.num); })
            .attr("height", function(d) { return height - y(d.num); })
            .style('fill',function(d,i){return i==highLightIdx?'rgba(27, 245, 29, 0.7)':'rgba(70, 130, 180, 0.35)'});
    };

    var hightLight = function(i){
        highLightIdx = i;
        svg.selectAll(".bar").style('fill',function(d,i){return i==highLightIdx?'rgba(27, 245, 29, 0.7)':'rgba(70, 130, 180, 0.35)'});
    };
    var bar = {
        list:list,
        init:init,
        renderer:renderer,
        hightLight:hightLight
    };
    init();
    return bar;
}
