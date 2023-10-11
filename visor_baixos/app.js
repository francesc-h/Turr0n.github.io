const mobile = document.documentElement.clientWidth  < 1100;

let shown_apart;
let scaling_factor = (mobile) ? 350 : 200;

const map = L.map('map').setView([39.466, -0.344052314758300849], 16);
const map_element = map.getContainer();


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    zoomControl: false,
    zoomSnap: 0,
    zoomDelta: 0.25
}).addTo(map);

map.zoomControl.setPosition("bottomright")

const overlay = {
    is_hidden: true,
    element: document.querySelector(".overlay"),
    apart_id: document.querySelector(".overlay #apart_id span"),
    apart_dir: document.querySelector(".overlay #apart_dir span"),
    apart_llic: document.querySelector(".overlay #apart_llic span"),
    apart_num: document.querySelector(".overlay #apart_num span"),
    locs_num: document.querySelector(".overlay #locs_num span"),
    apart_comm: document.querySelector(".overlay #apart_comm span")
}


let old_carrousel, carrousel_dom;
const stats = document.querySelector(".legend");
function toggle_overlay() {
    if (old_carrousel) {
        old_carrousel.destroy()
        old_carrousel = undefined;
        
        carrousel_dom.innerHTML = "";
        
        shown_apart = undefined;

        apart_layer.setStyle({
            //radius: marker_size.regular,
            fillOpacity: 0.8,
            //fillColor: "#3388ff"
        });
    }

    if (mobile) {
        map_element.classList.toggle("blur");
        stats.classList.toggle("blur")
    }


    overlay.element.classList.toggle("hidden")
    overlay.is_hidden = !overlay.is_hidden;
}


function show_apart(e) {
    apart_layer.setStyle({
        fillOpacity: 0.4,
    });
    
    const marker = e.target
    const feature = marker.feature;
    
    marker.setStyle({
        fillOpacity: 1,
        //fillColor: "#c3e3ff"
    });

    shown_apart = feature.properties.ID;

    overlay.apart_id.innerText = feature.properties.ID
    overlay.apart_dir.innerText = feature.properties["Dirección"]
    overlay.apart_num.innerText = feature.properties["Num aparts"]
    overlay.locs_num.innerText = feature.properties["Locals"]
    
    if (feature.properties.VT === "") {
        overlay.apart_llic.innerText = "-"
    } else {
        overlay.apart_llic.innerText = feature.properties.VT
    }
    
    if (feature.properties.Comentaris === "") {
        overlay.apart_comm.innerText = "-"
    } else {
        overlay.apart_comm.innerText = feature.properties.Comentaris
    }

    if (overlay.is_hidden) {
        toggle_overlay()
    }

    init_carrousel(feature);
}

function init_carrousel(feature) {
    if (old_carrousel) {
        old_carrousel.destroy()
    }

    carrousel_dom = document.querySelector(".splide__list")
    carrousel_dom.innerHTML = "";

    const photos = feature.properties["streemap_photos"] || [];
    photos.forEach((photo) => {
        if (photo.length == 0) {
            return;
        }

        const year = photo.split("_")[1];
        
        
        const img = document.createElement("img");
        img.setAttribute("src", `/visor_baixos/img/${photo}`);
        
        const span = document.createElement("span");
        span.innerHTML = year
        
        const div = document.createElement("div")
        div.classList.add("splide__slide")
        div.append(span, img)
        
        carrousel_dom.appendChild(div);
    })

    const splide = new Splide( '.splide' );
    splide.mount();

    old_carrousel = splide;
}

let apart_layer;
async function load_aparts() {
    function point_color(feature) {
        if (feature.properties.VT.length == 0) {
            return "red"
        } if (feature.properties.VT === "c") {
            return "orange"
        } else {
            return "#3388ff"
        }
    }

    const data = await fetch("./ubicacions_2.geojson").then(res => res.json());
    const barri = await fetch("./aiora.geojson").then(res => res.json());
    L.geoJSON(barri, {
        fillOpacity: 0.1,
        weight: (mobile) ? 2 : 6
    }).addTo(map)


    data.features = data.features.sort((f1, f2) => Number(f2.properties["Num aparts"]) - Number(f1.properties["Num aparts"]));
    
    let meanLat = 0, uniqueNumAparts = [];
    data.features.forEach((f) => {
        meanLat += f.geometry.coordinates[1];

        if (!uniqueNumAparts.includes(f.properties["Num aparts"])) {
            uniqueNumAparts.push(f.properties["Num aparts"])
        }
    })

    meanLat = meanLat / data.features.length;
    console.log(meanLat, uniqueNumAparts);


    function metersPerPixel(latitude, zoomLevel) {
        var earthCircumference = 40075017;
        var latitudeRadians = latitude * (Math.PI/180);
        return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoomLevel + 8);
    };

    const apartNumToRadius = {}
    uniqueNumAparts.forEach(num => {
        const radius = Math.sqrt((scaling_factor*num) / Math.PI);
        let tmp = radius / metersPerPixel(meanLat, map.getZoom())

        apartNumToRadius[num] = tmp;
    })

    console.log(apartNumToRadius)
    console.log(data.features)

    

    apart_layer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
            
            const r = apartNumToRadius[feature.properties["Num aparts"]] * (mobile) ? 1.5 : 1
            return new L.CircleMarker(latlng, {
                radius: r, 
                fillOpacity: 0.8,
                fillColor: point_color(feature),
                color: "black",
                weight: 1
            })
        },
        onEachFeature: (f, layer) => {
            layer.on({
                click: show_apart,
                mouseover: (e) => {
                    if (e.target.feature.properties.ID == shown_apart) {
                        return
                    }

                    e.target.setStyle({
                        fillOpacity: (shown_apart) ? 0.8 : 0.6
                    })
                },
                mouseout: function(e) {
                    if (e.target.feature.properties.ID == shown_apart) {
                        return
                    }

                    e.target.setStyle({
                        fillOpacity: (shown_apart) ? 0.6 : 0.8
                    })
                }
            })
        }
    }).addTo(map)

    map.on("zoomend", () => {
        console.log(apart_layer)
        
        uniqueNumAparts.forEach(num => {
            const radius = Math.sqrt((scaling_factor*num) / Math.PI);
            let tmp = radius / metersPerPixel(meanLat, map.getZoom())
    
            apartNumToRadius[num] = tmp;
        })
        
        apart_layer.eachLayer(marker => {
            const f = marker.feature;

            marker.setRadius( apartNumToRadius[ f.properties["Num aparts"] ] )
        })
    })
    
    map.fitBounds(
        apart_layer.getBounds()
    )

    let legal = 0, ilegal = 0, constr = 0, baixos = 0;
    const total_aparts = document.querySelector(".legend #a");
    total_aparts.innerText = data.features.map(f => {
        let v = f.properties["Num aparts"]

        if (f.properties.VT.length === 0) {
            ilegal += Number(v)
        } else if (f.properties.VT === "c") {
            constr += Number(v)
        } else {
            legal += Number(v)
        }

        baixos += Number(f.properties["Locals"]);

        return (v.includes("?")) ? Number(v.slice(0, -1)) : Number(v)
    }).reduce((acc, curr_v) => acc + curr_v, 0)

    const total_baix = document.querySelector(".legend #b");
    total_baix.innerText = baixos;

    document.querySelector("#legal").innerText = `: ${legal}`
    document.querySelector("#ilegal").innerText = `: ${ilegal}`
    document.querySelector("#constr").innerText = `: ${constr}`
}

load_aparts()