var createDateRangeSlider = function (options) {
    var dataTime = d3.range(0, 1000).map(function (d) {
        return new Date(1995 + d, 10, 3);
    });

    var sliderId = "slider"
    var playBtnContainer = $("<div></div>")
        .attr("class", "mdl-cell mdl-cell--1-col mdl-cell--1-col-desktop mdl-cell--8-col-table mdl-cell--1-col-phone")
    var button = $("<button></button>")
        .attr('class', 'mdl-button mdl-js-button mdl-button--fab')
    var icon = $("<i></i>").attr('class', 'material-icons').text('play_arrow')
    playBtnContainer
        .append($("<div></div>")
            .append(button.append(icon)))
    var sliderContainer = $("<div></div>")
        .attr("id", sliderId)
        .attr("class", "mdl-cell mdl-cell--1-col mdl-cell--1-col-desktop mdl-cell--8-col-table mdl-cell--1-col-phone")
    $(`#${options.elementId}`)
        .append(playBtnContainer, sliderContainer)
    var parent = document.getElementById(options.parentId)
    var factor = 210
    var sliderRange = d3
        .sliderBottom()
        .min(d3.min(dataTime))
        .max(d3.max(dataTime))
        .width(parent.offsetWidth - factor)
        .tickFormat(d3.timeFormat("%Y-%d-%m"))
        .ticks(5)
        .default([d3.min(dataTime), d3.max(dataTime)])
        .fill('#2196f3')
        .on('onchange', val => {
            //
        });

    var gRange = d3
        .select(`#${sliderId}`)
        .append('svg')
        .attr('width', parent.offsetWidth)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gRange.call(sliderRange);

    function draw() {
        sliderRange.width(parent.offsetWidth - 200)
        gRange.call(sliderRange);
    }

    window.addEventListener("resize", draw);
    return {
        button: button,
        sliderRange: sliderRange
    }
}