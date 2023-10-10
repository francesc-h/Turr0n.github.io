const $ = (selector) => document.querySelector(selector);


async function map1() {
    const barris = await fetch("/data/baixos/Barrios.JSON").then(res => res.json());
    const aiora_index = barris.features.map(f => f.properties.coddistbar).indexOf("121")
    
    console.log(barris)
    console.log(barris.features[aiora_index])
    const map = new MAP({
        parent: $("#map1 .mapContainer"),
        data: barris,
        property: "població",
        colorScale: d3.interpolateOrRd,
        marginBottom: 30
    })

    map.addBar({ticks: 1, xOffset: 30});

    const buttons = document.querySelectorAll("#map1 button")
    let activeBtn = buttons[0];

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            activeBtn.classList.remove("active");
            
            activeBtn = btn;
            activeBtn.classList.add("active")
            let prop = activeBtn.dataset.col;

            map.updateProp({
                property: prop
            });

            let values = barris.features.map(f => f.properties[prop]);
            const ref = values[aiora_index];

            values = values.sort((a, b) => a - b).reverse();
            const position = values.indexOf(ref) + 1;
            const text = {
                "població": "més poblat",
                "densitat": "amb més persones per km2",
                "envelliment": "amb major índex d'envelliment",
                "superficie habitatges": "amb superficie mitjana d'habitatge més alta",
                "renda mitjana": "amb la renda mitjana per persona més alta"
            }

            $("#map1 .stat").innerText = `#${position}/${values.length} barri ${text[prop]}`

            console.log(position)
        })
    })
}

async function map2() {
    const buildings = await fetch("/data/baixos/edificis.geojson").then(res => res.json());

    const projection = d3.geoEquirectangular();
    const geoGenerator = d3.geoPath().projection(projection);

    const svg = d3.select('#map2 svg')
    const dimensions = svg.node().getBoundingClientRect()
    
    
    const wrapper = svg.append("g")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    projection.fitExtent([
        [0, 0], [dimensions.width, dimensions.height]
    ], buildings);

    const plot = svg.selectAll('path')
        .data(buildings.features)
        .join('path')
        .attr("d", geoGenerator)
        .style("fill", "#cdcdcd")
        .style("stroke", "black")
        .style("opacity", (feature) => {
            if (feature.properties.any < 1975) {
                return 1
            } else {
                return 0
            }

        })

    const amount = $("#map2 #num");
    const year = $("#map2 span")
    const slider = $("#map2 input")
    slider.addEventListener("input", () => {
        let n = 0;
        year.innerText = slider.value

        plot.data(buildings.features)
            .style("opacity", (feature) => {
                if (feature.properties.any < slider.value) {
                    n++;
                    return 1
                } else {
                    return 0
                }
            });

        amount.innerText = ((n / buildings.features.length)*100).toFixed(1)
    })
}

map1()
map2()