const $ = (selector) => document.querySelector(selector);

const range = d3.range(100);

const waffleH = d3.select(".waffle.hosts")
const e = waffleH.selectAll(".icon")
    .data(range).enter()
    .append("svg")
    .attr("viewBox", "0 0 24 24")
    .attr('class', 'block')
    .style('background-color', d => (d < 20 ? '#8cba51' : '#ff5d6c'))
    .style("border-top", (d, n) => {
        if (n < 10) return "unset";
        else return "1px solid white";
    })
    .style("border-bottom", (d, n) => {
        if (n > 89) return "unset";
        else return "1px solid white";
    })
    .style("border-left", (d, n) => {
        if (n % 10 == 0) return "2px solid white";
        else return "1px solid white";
    })

e.append("path")
    .attr("d", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2")

e.append("circle")
    .attr("cx", 12)
    .attr("cy", 7)
    .attr("r", 4)

const waffleL = d3.select(".waffle.listings")
const o = waffleL.selectAll('.icon')
    .data(range).enter()
    .append('svg')
    .attr("viewBox", "0 0 24 24")
    .attr('class', 'block')
    .style('background-color', d => (d < 50 ? '#8cba51' : '#ff5d6c'))
    .style("border-top", (d, n) => {
        if (n < 10) return "unset";
        else return "1px solid white";
    })
    .style("border-bottom", (d, n) => {
        if (n > 89) return "unset";
        else return "1px solid white";
    })
    .style("border-right", (d, n) => {
        if ((n+1) % 10 == 0) return "2px solid white";
        else return "1px solid white";
    })

o.append("path")
    .attr("d", "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")

o.append("polyline")
    .attr("points", "9 22 9 12 15 12 15 22")




let barrios;
async function initMaps() {
    barrios = await fetch("/data/airbnb/barrios_ext.geojson").then(res => res.json());

    let rawCount = document.querySelector("#map1");
    let denP = document.querySelector("#map2");
    let denS = document.querySelector("#map3");

    (new MAP({
            parent: $("#map1"),
            data: barrios,
            property: "count",
            colorScale: d3.interpolateOrRd,
            marginBottom: 30
        })
    ).addBar({ticks: 2, xOffset: 30});

    (new MAP({
            parent: $("#map2"),
            data: barrios,
            property: (b) => b.properties.count / (b.properties.pob / 1000),
            colorScale: d3.interpolateBuPu,
            marginBottom: 30
        })
    ).addBar({ticks: 2, xOffset: 30, color: d3.schemeBuPu});

    (new MAP({
            parent: $("#map3"),
            data: barrios,
            property: (b) => b.properties.count / b.properties.area,
            colorScale: d3.interpolatePuRd,
            marginBottom: 30
        })
    ).addBar({ticks: 2, xOffset: 30, color: d3.schemePuRd});

}

initMaps();