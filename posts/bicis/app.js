const mobile_small = window.innerWidth < 550;
const mobile_wide = !mobile_small && window.innerWidth <= 600;

let data;

function color(d) {
    // Low pop, few bikes
    if (d.pop < 750000 && d.bikes < 2000) return "#C4E7D4";
            
    // Big pop, few bikes
    if (d.pop > 750000 && d.bikes <= 2000) return "#56C4DD";

    // Medium pop, enough bikes
    if (d.pop < 1000000 && d.bikes > 2000) return "#EE8434";

    // Paris
    else return "red"
}

function first() {
    const parent = document.querySelector("#chart1");

    const parent_dimensions = {
        h: parent.offsetHeight,
        w: parent.offsetWidth
    }
    
    let margin, label_size;
    if (mobile_wide || mobile_small) {
        margin = { top: 25, right: 10, bottom: 30, left: 50 }
        label_size = "0.6rem";
    } else {
        margin = { top: 25, right: 20, bottom: 30, left: 70 }
        label_size = "0.75rem";
    }

    let w = parent_dimensions.w - margin.left - margin.right,
        h = parent_dimensions.h - margin.top - margin.bottom;

    const svg = d3.select("#chart1 svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    const scaleY = d3.scaleLinear()
        .domain([0, 23900])
        .range([h, 0]);
    const axisY = d3.axisLeft()
        .scale(scaleY)
        .tickSizeOuter(0);

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", 15)
        .attr("x", 0)
        .attr("transform", "rotate(-90)")
        .text("Bicicletas")
        .style("font-size", label_size)


    svg.append("g").call(axisY);

    const scaleX = d3.scaleLinear()
        .domain([0, 2274560])
        .range([0, w]);
    
    const axisX = d3.axisBottom()
        .scale(scaleX)
        .tickSizeOuter(0)
        .ticks(5);

    if (mobile_small) axisX.ticks(2);

    svg.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(axisX);

    svg.append("text")
        .attr("text-achor", "end")
        .attr("x", w - margin.left + margin.right - 10 )
        .attr("y", h - margin.top + 20)
        .text("Habitantes")
        .style("font-size", label_size);

    svg.append("g")
        .selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr("cx", (d) => { return scaleX(d.pop) })
        .attr("cy", (d) => { return scaleY(d.bikes) })
        .attr("r", 3.5)
        .attr("fill", color)
        .attr("stroke", "black");


    const annotations = [
        {
            note: {
                label: (mobile_small) ? "" :"La ciudad con mayor número de bicicletas de largo",
                title: "Paris"
            },
            dx: -50, dy: 50,
            x: scaleX(2206488), y: scaleY(23900)
        },
        {
            note: {
                label: (mobile_small) ? "" : "La mayor cantidad de habitantes pero una cantidad media de bicicletas",
                title: "Brisbane"
            },
            dx: -50, dy: -20,
            x: scaleX(2274560), y: scaleY(2000)
        },
        {
            note: {
                title: "València"
            },
            dx: 10, dy: -20,
            x: scaleX(789004), y: scaleY(2750)
        },
        {
            note: {
                title: "Lillestrøm",
                label: (mobile_small) ? "" : "Tan solo 14000 habitantes y 50 bicicletas"
            },
            dx: 47, dy: -90,
            x: scaleX(14000), y: scaleY(50)
        }
    ]

    makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations);

    svg.append("g")
        .call(makeAnnotations);
    
    const incisos = [...document.querySelectorAll("[id^=inciso]")];
    
    incisos.forEach(i => {
        i.addEventListener("mouseenter", () => {
            svg.selectAll("circle")
                .attr("opacity", (d) => {
                    if (color(d) === i.dataset.color) return 1
                    else return 0.3
                })
        });
        
        i.addEventListener("mouseleave", () => {
            svg.selectAll("circle").attr("opacity", 1);
        });
    });
}

function second() {
    let avg = 0, max = 0;

    data.forEach(c => {
        c.ratio = Math.round(c.pop / c.bikes);
        avg += c.ratio;

        if (c.ratio > max) max = c.ratio
    });
    
    data.sort((a, b) => b.ratio - a.ratio);
    avg /= data.length;

    const parent = document.querySelector("#chart2");
    const parent_dimensions = { h: parent.offsetHeight, w: parent.offsetWidth}
    const margin = { top: 10, right: 10, bottom: 30, left: 100 },
        w = parent_dimensions.w - margin.left - margin.right,
        h = parent_dimensions.h - margin.top - margin.bottom;

    const svg = d3.select("#chart2" + " svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const scaleY = d3.scaleBand().range([h, 0]).domain(data.map(d => d.city)).padding(0.1);
    const scaleX = d3.scaleLinear().range([0, w]).domain([0, max]);

    const axisY = d3.axisLeft(scaleY).tickSizeOuter(0);
    const axisX = d3.axisBottom(scaleX).tickSizeOuter(0);

    if (mobile_small) axisX.ticks(0)

    svg.append("g")
        .selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("fill", color)
        .attr("width", (d) => scaleX(d.ratio))
        .attr("y", (d) => scaleY(d.city))
        .attr("height", scaleY.bandwidth());

    svg.append("g").call(axisY);
    
    if (!mobile_small) {
        svg.append("g")
            .attr("transform", "translate(0,"+h+")")
            .call(axisX);
    }

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("y", h + ((mobile_small) ? 12 : 30))
        .attr("x", w )
        .text("Ratio")
        .style("font-size", "0.75rem");

    /*
    svg.append("line")
        .attr("x1", scaleX(avg))
        .attr("y1", 2)
        .attr("x2", scaleX(avg))
        .attr("y2", h)
        .style("stroke", "black")
        .style("opacity", 0.5)
    
    svg.append("line")
        .attr("x1", scaleX(d3.median(data.map(e => e.ratio))))
        .attr("y1", 2)
        .attr("x2", scaleX(d3.median(data.map(e => e.ratio))))
        .attr("y2", h)
        .style("stroke", "grey")
        .style("stroke-dasharray", "5,3")

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 0)
        .attr("x", scaleX(avg))
        .text("Media")
        .style("font-size", "0.5rem");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 0)
        .attr("x", scaleX(d3.median(data.map(e => e.ratio))))
        .text("Median")
        .style("font-size", "0.5rem");
    */

    svg.append("g")
        .selectAll("text")
        .data(data).enter()
        .append("text")
        .attr("text-anchor", "start")
        .attr("y", (d) => scaleY(d.city) + scaleY.bandwidth()/2 + 2)
        .attr("x", (d) => {
            if (d.city === "Cordoba") return scaleX(d.ratio) - 20;
            else return scaleX(d.ratio) + 3
        })
        .text((d) => d.ratio)
        .attr("font-size", "8px")
}

let map;
async function third() {
    const parent = document.querySelector("#chart3");

    geo = await fetch("/data/bicis/grid2_pob.geojson").then(res => res.json());
    const stations = await fetch("/data/bicis/stations.geojson").then(res => res.json());
    
    map = new MAP({
        parent: parent,
        data: geo,
        property: (c) => c.properties.pob/(turf.area(c)/1e+6),
        colorScale: d3.interpolateBlues,
        barScale: d3.schemeBlues,
    });

    map.addBar({ticks: 2});

    map.addPoints({
        data: stations,
        radius: 1.5,
        color: "red"
    });

    map.getMapLayer()
       .select(".base-layer")
       .selectAll("path")
       .on("mouseover", (d) => console.log(d))

}
let geo;

async function loadData() {
    data = await fetch("/data/bicis/valen_cities.json").then(res => res.json());

    first();
    second();
    third();
}


loadData();