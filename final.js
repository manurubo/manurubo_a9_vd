var cat_seleccionada;

async function draw_everything(){
  data_circle = await d3.json("https://manurubo.github.io/practicafinal/flare-2.json")
  data_bars = await d3.csv("https://manurubo.github.io/practicafinal/alphabet.csv")



function drawCirclePacking(container, data, datos_barras_iniciales){

    var circulo = {}

    var datos_barras_iniciales = datos_barras_iniciales

    const width = 932;
    const height = width;

    const format = d3.format(",d");

    const color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl);

    const pack = data => d3.pack()
        .size([width, height])
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
        .style("margin", "0 -14px")
        .style("background", color(0))
        .style("cursor", "pointer")
        .on("click", (event) => zoom(event, root));

    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name);

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

      if (cat_seleccionada == 'flare'){
        const data_2 = datos_barras_iniciales.map(({letter: name, frequency:value})=>({name, value}));
        const data_3 = data_2.sort((a, b) => d3.descending(a.value, b.value))
        Object.assign(data_3,  {format: "%", y: "↑ Frequency"})
        barras.update(data_3)
      }
      else {
        // filtrado
        datos_barras = d3.select('#barras').selectAll("rect").data()
        datos_filtrados = datos_barras.filter(d => d.name == cat_seleccionada)

        barras.update(datos_filtrados)
      }




      // Esto es para resaltar
      // d3.select('#barras').selectAll("rect")
      // .style("opacity", 0.2)
      // .filter( function(d){
      //   if (cat_seleccionada == 'flare'){
      //     return true;
      //   }
      //   else {
      //     if (cat_seleccionada == d.name){
      //       return true;
      //     }
      //     else return false;
      //   }
      // })
      // .style("opacity", 1);

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

  const data_2 = data.map(({letter: name, frequency:value})=>({name, value}));
  const data_3 = data_2.sort((a, b) => d3.descending(a.value, b.value))
  Object.assign(data_3,  {format: "%", y: "↑ Frequency"})
  const color = "steelblue"

  const height = 500
  const width = 1000

  const margin = ({top: 30, right: 0, bottom: 30, left: 40})

  const x = d3.scaleBand()
    .domain(d3.range(data_3.length))
    .range([margin.left, width - margin.right])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data_3, d => d.value)]).nice()
    .range([height - margin.bottom, margin.top])

  const xAxis = g => g
      .classed("ejex", true)
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(i => data_3[i].name).tickSizeOuter(0))

  const yAxis = g => g
        .classed("ejey", true)
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, data_3.format))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data_3.y))

  const svg = d3.select(container).append("svg")
      .attr("viewBox", [0, 0, width, height]);


  svg.append("g")
      .attr("fill", color)
    .selectAll("rect")
    .data(data_3)
    .join("rect")
      .attr("x", (d, i) => x(i))
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .attr("width", x.bandwidth());

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

      barras.update = function(datos){
        x.domain(d3.range(datos.length)).range([margin.left, width - margin.right]).padding(0.1)
        // console.log(x.domain)

        const xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(i => datos[i].name).tickSizeOuter(0))



        var barritas = svg.selectAll("rect").data(datos)
        barritas.join("rect").transition().duration(500)
          .attr("fill", color)
          .attr("x", (d, i) => x(i))
          .attr("y", d => y(d.value))
          .attr("width", x.bandwidth())
          .attr("height", d => y(0) - y(d.value));

          // console.log(datos_filtrados)
          // d3.select('#barras').select('.ejex').call(xAxis)
          // d3.select('#barras').select('.ejey').call(yAxis)

          svg.select('.ejex').call(xAxis);
          svg.select('.ejey').call(yAxis);
      }

      return barras
}
var circulo = drawCirclePacking('#circulo', data_circle, data_bars)
var barras = drawBar('#barras',data_bars)
}
