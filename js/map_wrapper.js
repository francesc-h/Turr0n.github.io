class MAP {
    constructor({
        parent, data, property,
        colorScale = d3.interpolateOrRd,
        marginBottom = 0
    }) {

        this.parent = parent;
        this.data = data;
        this.property = property;
        this.colorScale = colorScale
        this.marginBottom = marginBottom

        this.w = this.parent.offsetWidth;
        this.h = this.parent.offsetHeight - this.marginBottom;

        if (typeof this.property === "string") {
            this.getValue = (f) => f.properties[this.property]
        } else if (typeof this.property === "function") {
            this.getValue = (f) => this.property(f)
        } else throw new Error("Invalid property expression");


        if (parent.querySelector("svg") !== null) {
            this.svg = d3.select(parent)
                         .select("svg")
        } else {
            this.svg = d3.select(parent)
                .append("svg")
        }

        this.svg.attr("width", this.w)
                .attr("height", this.h)


        this.max = 0
        this.min = Infinity;

        this.data.features.forEach(f => {
            let temp = this.getValue(f)
            if (temp > this.max) this.max = temp;
            if (temp < this.min) this.min = temp;
        });

        this.mappingFunc = d3.scaleLinear()
            .domain([this.min, this.max])
            .range([0, 1]);

        this.projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0])

        this.path = d3.geoPath().projection(this.projection);
        this.bounds = this.path.bounds(this.data);

        this.mapLayer = this.svg.append('g')
                            .classed('map-layer', true);

        this.mapLayer.append("g")
                     .classed("base-layer", true)

        this.resize();
    }

    updateProp(props) {
        for (let key in props) {
            this[key] = props[key];
        }

        if ("property" in props) {
            this.max = 0
            this.min = Infinity;

            this.data.features.forEach(f => {
                let temp = this.getValue(f)
                if (temp > this.max) this.max = temp;
                if (temp < this.min) this.min = temp;
            });

            this.mappingFunc = d3.scaleLinear()
                .domain([this.min, this.max])
                .range([0, 1]);

            if (this.bar) {
                this.svg.select("#colorbar").remove()
            }
        }

        // Redraw
        this.drawBase();

        if (this.bar) {
            this.addBar({ticks: 2, xOffset: 30})
        }
    }

    resize() {
        this.w = this.parent.offsetWidth;
        this.h = this.parent.offsetHeight - this.marginBottom;

        this.svg.attr("width", this.w)
            .attr("height", this.h)

        let s = .95 / Math.max((this.bounds[1][0] - this.bounds[0][0]) / this.w, (this.bounds[1][1] - this.bounds[0][1]) / this.h),
            t = [(this.w - s * (this.bounds[1][0] + this.bounds[0][0])) / 2, (this.h - s * (this.bounds[1][1] + this.bounds[0][1])) / 2];

        this.projection.scale(s).translate(t);

        this.drawBase();
    }
    
    drawBase() {
        // Remove previous paths
        this.mapLayer
            .select(".base-layer")
            .selectAll('path')
            .remove();

        this.mapLayer
            .select(".base-layer")
            .selectAll('path')
            .data(this.data.features)
            .enter().append('path')
            .attr('d', this.path)
            .attr('vector-effect', 'non-scaling-stroke')
            .attr("stroke", "black")
            .attr("stroke-width", (d) => {
                if (d.properties.nombre === "AIORA") {
                    return 1.5
                } else {
                    return 0.5
                }
            })
            .style("fill", (d) => {
                return this.colorScale(
                    this.mappingFunc(
                        this.getValue(d)
                    )
                )
            });
    }
    
    addBar({ticks = 4, color = d3.schemeOrRd,
        xOffset = 0, yOffset = 0, 
        width = 125, height = 20}) {
        
        this.bar = true;
        /*this.bar_params = {
            ticks: ticks,
            xOffset: xOffset,
            yOffset: yOffset,
            color: color,
            width: width,
            height: height
        }

        console.log(this.bar_params)*/

        //A color scale
        var colorScale = d3.scaleLinear()
                           .range(color[color.length - 1]);

        //Append multiple color stops by using D3's data/enter step
        const id = String(Math.random())
        
        const wrapper = this.svg.append("g").attr("id", "colorbar");
        wrapper.append("defs")
            .append("linearGradient").attr("id", id)
            .selectAll("stop")
            .data(colorScale.range())
            .enter().append("stop")
            .attr("offset", (_, i) => i / (colorScale.range().length - 1))
            .attr("stop-color", (d) => d );

        wrapper.append("rect")
            .attr("x", 10 + xOffset)
            .attr("y", this.h - 45 + yOffset)
            .attr("width", width)
            .attr("height", height)
            .style("fill", "url(#" + id +")");

        let xScale = d3.scaleLinear()
                  .domain([this.min, this.max])
                  .range([0, 125]);


        let size = Math.floor((this.max - this.min) / (ticks+1));
        let tickValues = [this.min]

        for (let i = 1; i <= ticks+1; i++) tickValues.push(size*i)

        wrapper.append("g")
            .attr("transform", "translate(" + (10 + xOffset) + "," + (this.h - 25 + yOffset) + ")")
            .call(d3.axisBottom(xScale).tickValues(tickValues))
    }
    
    addPoints({ name = "circles", data, radius = 3, color = "black", stroke = "none", opacity = 1 }) {
        this.mapLayer
            .append("g")
                .classed(name, true)
            .selectAll("circle")
            .data(data.features)
            .enter().append("circle")
            .attr("cx", (d) => this.projection(d.geometry.coordinates)[0])
            .attr("cy", (d) => this.projection(d.geometry.coordinates)[1])
            .attr("r", radius)
            .attr("opacity", opacity)
            .attr("fill", color)
            .attr("stroke", stroke)
    }

    getSVG() { return this.svg }
    getMapLayer() { return this.mapLayer }
}