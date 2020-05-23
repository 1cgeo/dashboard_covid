var dataTime = d3.range(0, 10).map(function (d) {
    return new Date(1995 + d, 10, 3);
});

var sliderRange = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .width(300)
    //.tickFormat(d3.format('.2%'))	
    .tickFormat(d3.timeFormat("%Y-%d-%m"))
    .ticks(5)
    .default([new Date(1998, 10, 3), new Date(1998, 10, 10)])
    .fill('#2196f3')
    .on('onchange', val => {
        //
    });

var gRange = d3
    .select('#slider-range')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gRange.call(sliderRange);
