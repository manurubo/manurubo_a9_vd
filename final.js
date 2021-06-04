var cat_seleccionada;

async function draw_everything(){
  data_circle = await d3.json("https://manurubo.github.io/practicafinal/partidas_equipo.json")
  data_bars = await d3.json("https://manurubo.github.io/practicafinal/campeones_equipo.json")
  data_linea = await d3.json("https://manurubo.github.io/practicafinal/winrate.json")
  data_parallel_set = await d3.json("https://manurubo.github.io/practicafinal/objetivos_gana.json")
  data_parallel_coord = await d3.csv("https://manurubo.github.io/practicafinal/parallel_cords.csv", d3.autoType)



function drawCirclePacking(container, data, datos_barras_iniciales, datos_linea_iniciales, datos_parallel_set_iniciales){

    var circulo = {}

    cat_seleccionada = 'torneos'
    var datos_barras_iniciales = datos_barras_iniciales
    var datos_linea_iniciales = datos_linea_iniciales
    var datos_parallel_set_iniciales = datos_parallel_set_iniciales

    var equipo_seleccionado = 'Ningún equipo ni liga seleccionado'

    d3.select('#equipo_seleccionado').join("text").text(equipo_seleccionado)

    const width = 932;
    const height = 932;

    const format = d3.format(",d");

    const color = d3.scaleLinear().domain([0,2]).range(["#282C34",'#6F7480']);
      // .range(["#282C34",'#6F7480']);

    const pack = data => d3.pack()
        .size([width/3, height/3])
        .padding(3)
      (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));


    //hay que cargar los datos antes
    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3.select(container).append('svg')
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        // .style("margin", "0 -14px")
        .style("background", color(0))
        .style("cursor", "pointer")
        .on("click", (event) => zoom(event, root));

    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        .attr("fill", d => color(d.depth) )
        // .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "15px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .style("fill", 'white')
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name + ":" + d.data.value);

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];

      view = v;
      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
      const focus0 = focus;

      focus = d;

      cat_seleccionada = d.data.name;
      if (cat_seleccionada == 'torneos'){
        equipo_seleccionado = 'Ningún equipo ni liga seleccionado'
      }
      else{
        if (d.depth==2){
          equipo_seleccionado = 'Mostrando datos del equipo: ' + cat_seleccionada + ' en la liga ' + d.parent.data.name;
          cat_seleccionada = cat_seleccionada+'_'+d.parent.data.name;
        }
        else{
          equipo_seleccionado = 'Mostrando datos de la liga: ' + cat_seleccionada
        }


      }
      d3.select('#equipo_seleccionado').join("text").text(equipo_seleccionado)


      const data_2 = datos_barras_iniciales.filter(d=>d.seleccion == cat_seleccionada)[0].personajes_escogidos
      const datos_filtrados = data_2.sort((a, b) => d3.descending(a.veces, b.veces))
      Object.assign(datos_filtrados,  {format: "d", y: "↑ Seleccionados"})

      barras.update(datos_filtrados)


      const data_lineas =  datos_linea_iniciales.filter(d=>d.seleccion == cat_seleccionada)[0].diccionario
      const columns = data_lineas.dates;
      data_lineas.dates = columns.map(d3.utcParse("%Y-%m"))
      linea.update(data_lineas)

      const data_ps_update =  datos_parallel_set_iniciales.filter(d=>d.seleccion == cat_seleccionada)[0].ps
      parallel_set.update(data_ps_update)




      // Esto es para resaltar
      d3.select('#parallel_coord').select("g").selectAll("path")
      .style("opacity", 0.2)
      .attr("stroke-width", 1.5)
      .attr("stroke", "steelblue")
      .filter( function(d){
        console.log(d)
        if (cat_seleccionada == 'torneos'){
          d3.select('#parallel_coord').select("g").selectAll("path")
          .style("opacity", 1)
          return false;
        }
        else {
          if (cat_seleccionada == d.name){
            return true;
          }
          else return false;
        }
      })
      .transition().duration(3000)
      .style("opacity", 1)
      .attr("stroke-width", 4)
      .attr("stroke", "white");

      const transition = svg.transition()
          .duration(event.altKey ? 7500 : 750)
          .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
          });

      label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }
    return circulo
}


function drawBar(container, data){

  var barras = {}

  var slicer = 10

  const data_2 = data.filter(d=>d.seleccion == 'torneos')[0].personajes_escogidos
  const data_3 = data_2.sort((a, b) => d3.descending(a.veces, b.veces)).slice(0,10)
  Object.assign(data_3,  {format: "d", y: "+ Jugados"})
  const color = d3.scaleLinear()
              .domain([0, 25, 40, 60, 75, 100])
              .range(['#000000','#551407', '#F60002', '#00EB62', '#00A22F', '#F1D54F'])
              .interpolate(d3.interpolateRgb);

  const height = 750
  const width = 1400

  const margin = ({top: 30, right: 0, bottom: 30, left: 40})

  const x = d3.scaleBand()
    .domain(d3.range(data_3.length))
    .range([margin.left, width - margin.right])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data_3, d => d.veces)]).nice()
    .range([height - margin.bottom, margin.top])

  const xAxis = g => g
      .classed("ejex", true)
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(i => data_3[i].campeon).tickSizeOuter(0))

  const yAxis = g => g
        .classed("ejey", true)
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, data_3.format).tickSize(10))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "white")
            .attr("text-anchor", "start")
            .text(data_3.y))

  const svg = d3.select(container).append("svg")
      .attr("viewBox", [0, 0, width, height]);


  svg.append("g")
    .selectAll("rect")
    .data(data_3)
    .join("rect")
      .attr("fill", d => color(d.ganadas))
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d.veces))
      .attr("height", d => y(0) - y(d.veces))
      .attr("width", x.bandwidth());

  const texto_porcentaje = svg.append("g")
    .selectAll("rect")
    .data(data_3)
    .join("text")
      .attr("fill", 'white')
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d.veces))
      .attr("height", d => y(0) - y(d.veces))
      .attr("width", x.bandwidth())
      .text(function(d){
        return d.ganadas+"%"
      });



  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

      barras.update = function(datos){
        var datos = datos.slice(0,slicer)
        x.domain(d3.range(datos.length)).range([margin.left, width - margin.right]).padding(0.1)
        // console.log(x.domain)
        y.domain([0, d3.max(datos, d => d.veces)]).nice()
        const xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(i => datos[i].campeon).tickSizeOuter(0))



        var barritas = svg.select('g').selectAll("rect").data(datos)

        barritas.join("rect").transition().duration(1500)
          .attr("fill", d => color(d.ganadas))
          .attr("x", (d, i) => x(i))
          .attr("y", d => y(d.veces))
          .attr("width", x.bandwidth())
          .attr("height", d => y(0) - y(d.veces));

        var textos = svg.select('g:nth-child(2)').selectAll("text").data(datos)
        textos.join("text").transition().duration(1500)
          .attr("fill", 'white')
          .attr("x", (d, i) => x(i))
          .attr("y", d => y(d.veces))
          .attr("width", x.bandwidth())
          .attr("height", d => y(0) - y(d.veces))
          .text(function(d){
            return d.ganadas+"%"
          });


          svg.select('.ejex').call(xAxis);
          svg.select('.ejey').call(yAxis);
      }
    d3.select("#slider").on("input", function() {
      slicer = this.value;
      const data_2 = data.filter(d=>d.seleccion == cat_seleccionada)[0].personajes_escogidos
      const data_3 = data_2.sort((a, b) => d3.descending(a.veces, b.veces))
      Object.assign(data_3,  {format: "d", y: "↑ Seleccionados"})
      barras.update(data_3)
  })

      return barras
}

function drawLinea(container, data_global){
  var linea = {}

  const data_2 =  data_global.filter(d=>d.seleccion == 'torneos')[0].diccionario
  const columns = data_2.dates;
  data_2.dates = columns.map(d3.utcParse("%Y-%m"))



  const height = 600
  const width = 1000
  const margin = ({top: 20, right: 20, bottom: 30, left: 30})


  const x = d3.scaleUtc()
    .domain(d3.extent(data_2.dates))
    .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
      .domain([0, 100]).nice()
      .range([height - margin.bottom, margin.top])

  const color = d3.scaleLinear().domain([0,1]).range(["#4181ED",'#DC001A']);

  const xAxis = g => g
    .classed("ejex", true)
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));


  const yAxis = g => g
      .classed("ejey", true)
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data_2.y))

   line = d3.line()
        .defined(function(d){
          return (d!==-1)
        })
        .x(function(d,i){
          return x(data_2.dates[i])
        })
        .y(d => y(d))



  const svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("overflow", "visible");

  svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
    .selectAll("path")
      .data(data_2.series)
    .join("path")
      .attr("d", d => line(d.values))
      .attr("stroke", (d,i)=>color(i));

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);




  linea.update = function(datos){

    data_2.dates = columns.map(d3.utcParse("%Y-%m"))
    var lineas = svg.select('g').selectAll("path").data(datos.series)
    lineas.join("path").transition().duration(1500)
      .attr("d", d => line(d.values))
      .attr("stroke", (d,i)=>color(i));

  }

  return linea
}

function drawParallel_set(container, data_parallel_sets){

  var parallel_set = {}
  const data_ps =  data_parallel_sets.filter(d=>d.seleccion == 'torneos')[0].ps
  const width = 975
  const height = 720

  const sankey = d3.sankey()
    .nodeSort(null)
    .linkSort(null)
    .nodeWidth(4)
    .nodePadding(20)
    .extent([[0, 5], [width, height - 5]])

  const keys =  ['gana', 'nashors', 'torre', 'sangre']
  const color = d3.scaleOrdinal(["GanaPartida"], ['#00EB62']).unknown('#F60002')

  const graph_f = function(data_ps,keys){
    let index = -1;
    var nodes = [];
    const nodeByKey = new Map;
    const indexByKey = new Map;
    var links = [];

    for (const k of keys) {
      for (const d of data_ps) {
        const key = JSON.stringify([k, d[k]]);
        if (nodeByKey.has(key)) continue;
        const node = {name: d[k]};
        nodes.push(node);
        nodeByKey.set(key, node);
        indexByKey.set(key, ++index);
      }
    }

    for (let i = 1; i < keys.length; ++i) {
      const a = keys[i - 1];
      const b = keys[i];
      const prefix = keys.slice(0, i + 1);
      const linkByKey = new Map;
      for (const d of data_ps) {
        const names = prefix.map(k => d[k]);
        const key = JSON.stringify(names);
        const value = d.value || 1;
        let link = linkByKey.get(key);
        if (link) { link.value += value; continue; }
        link = {
          source: indexByKey.get(JSON.stringify([a, d[a]])),
          target: indexByKey.get(JSON.stringify([b, d[b]])),
          names,
          value
        };
        links.push(link);
        linkByKey.set(key, link);
      }
    }
    return{nodes,links}
  }
  const graph = graph_f(data_ps,keys)

  const svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);

  var {nodes, links} = sankey({
    nodes: graph.nodes.map(d => Object.assign({}, d)),
    links: graph.links.map(d => Object.assign({}, d))
  });

  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", "white")
    .append("title")
      .text(d => `${d.name}\n${d.value.toLocaleString()}`);

  svg.append("g")
      .attr("fill", "none")
    .selectAll("g")
    .data(links)
    .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => color(d.names[0]))
      .attr("stroke-width", d => d.width)
      .style("mix-blend-mode", "normal")
      .attr("opacity", 0.85)
    .append("title")
      .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

  svg.append("g")
      .style("font", "15px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
      .attr("fill", "white")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name+` ${d.value.toLocaleString()}`)


    parallel_set.update = function(datos){
      var graph_update = graph_f(datos,keys)
      console.log(graph_update)
      var {nodes, links} = sankey({
        nodes: graph_update.nodes.map(d => Object.assign({}, d)),
        links: graph_update.links.map(d => Object.assign({}, d))
      });
      console.log(nodes)

      var cuadrados = svg.select('g').selectAll("rect").data(nodes)
      cuadrados.join("rect").transition().duration(1500)
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", "white")

      cuadrados.selectAll("title").remove()

      cuadrados.append("title")
          .text(d => `${d.name}\n${d.value.toLocaleString()}`);

      var enlaces = svg.select("g:nth-child(2)").selectAll("path").data(links)
      enlaces.join("path").transition().duration(1500)
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => color(d.names[0]))
        .attr("stroke-width", d => d.width)
        .style("mix-blend-mode", "normal")
        .attr("opacity", 0.85)

      enlaces.selectAll("title").remove()
      enlaces.append("title")
          .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

      var textos = svg.select("g:nth-child(3)").selectAll("text").data(nodes)

      textos
      .join("text").transition().duration(1500)
        .attr("fill", "white")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => d.name+ ` ${d.value.toLocaleString()}`)


    }

    return parallel_set

}

function drawParallel_coord(container, data){
  const keys = data.columns.slice(1)
  console.log(keys)
  const margin = ({top: 20, right: 40, bottom: 20, left: 40})

  const height = 500

  const width = 1400
  const x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.left, height - margin.right])]))
  const y = d3.scalePoint(keys, [margin.top, width - margin.bottom])

  const line = d3.line()
    .defined(([, value]) => value != null)
    .y(([key, value]) => x.get(key)(value))
    .x(([key]) => y(key))

  console.log(data)

  const svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.9)
    .selectAll("path")
    .data(data.slice())
    .join("path")
      .attr("stroke","steelblue")
      .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])))
    .append("title")
      .text(d => d.name);

  svg.append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
      .attr("transform", d => `translate(${y(d)},0)`)
      .each(function(d) { d3.select(this).call(d3.axisLeft(x.get(d))); })
      .call(g => g.append("text")
        .attr("y", margin.left-10)
        .attr("x", -2)
        .attr("text-anchor", "start")
        .text(d => d))
      .call(g => g.selectAll("text")
        .attr("fill", "white"));

}

var circulo = drawCirclePacking('#circulo', data_circle, data_bars, data_linea, data_parallel_set)
var barras = drawBar('#barras',data_bars)
var linea = drawLinea('#linea',data_linea)
var parallel_set = drawParallel_set('#parallel_set',data_parallel_set)
var parallel_coord = drawParallel_coord("#parallel_coord", data_parallel_coord)
}
