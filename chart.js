

function chart(full_data) {


    let obj={};
    let y_counts= {};
    let max_nodes=0;

    full_data.nodes.forEach( (d,i)=> {
    
        obj[d.Activity] = d;
        
        let start_date = d['WD Start'];

        if(y_counts.hasOwnProperty(start_date)){

            y_counts[start_date] =[...y_counts[start_date],d.Activity]

            max_nodes = d3.max([max_nodes, y_counts[start_date].length])
        
        }else {

            y_counts[start_date] =[d.Activity];
            
            max_nodes = d3.max([max_nodes, y_counts[start_date].length])
        }
    });


    // set the dimensions and margins of the graph
    let margin = {top: 20, right: 30, bottom: 20, left: 30},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;
    let arrow_marker = `
    <defs>
      <marker
        id="arrow"
        markerUnits="strokeWidth"
        markerWidth="12"
        markerHeight="12"
        viewBox="0 0 12 12"
        refX="6"
        refY="6"
        orient="auto">
      </marker>
        <path d="M2,2 L10,6 L2,10 L6,6 L2,2" style="fill: #f00;"></path>
    </defs>`
        
    let svg = d3.select("#my_dataviz")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.html(arrow_marker)

        svg = svg.append("g")
                .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");



    // A linear scale to position the nodes on the X axis
    let x = d3.scaleLinear()
              .range([0, width])
              .domain(d3.extent(Object.keys(y_counts), d=> parseFloat(d)))

    // A linear scale to position the nodes on the Y axis
    let y = d3.scaleLinear()
            .range([0, height])
            .domain([-1,max_nodes+1])

    let r = d3.scaleLinear()
                .range([5,20])
                .domain(d3.extent(full_data.nodes, d=> parseFloat(d["WD end"])-parseFloat(d['WD Start'])))


var line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

    // Draw every datum a line connecting to its parent.
    var link = svg.selectAll(".mylinks")
            .data(full_data.edges)
            .enter().append("path")
            .attr("class", "mylinks")
            .attr("d", function(d) {

                
                let from_start_date = obj[d["From"]]["WD Start"];
                let to_start_date = obj[d["To"]]["WD Start"];

                let x1 = x(obj[d["From"]]["WD Start"]),
                    y1 = y(y_counts[from_start_date].indexOf(d["From"])),
                    x2 = x(obj[d["To"]]["WD Start"]) ,
                    y2 = y(y_counts[to_start_date].indexOf(d["To"]));

                let x_mid = (x1+x2)*1;
                    y_mid = (y1+y2)*1;

                let x_dif = x2-x1;
                    x_dif = x_dif<0 ? x_dif*-1/x1 : x_dif/x2
                    
                   return ['M', x1, y1,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
                    'A',                            // This means we're gonna build an elliptical arc
                    x_mid, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                    y_mid, 0, 0, ',',
                    1, x2, ',', y2] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
                    .join(' ')
            })
            .attr("fill","none")
            .attr("stroke","#999")
            .attr("class",d=> {
               let class_name = "from_"+d["From"].replace(/\./g, '_').replace(/\s/g, '_')+"_to_"+d["To"].replace(/\./g, '_').replace(/\s/g, '_')
               return class_name+" mylinks"
            }) 
            .attr("marker-end","url(#arrow)"); 

                
    let nodes = svg.selectAll("mynodes")
                    .data(full_data.nodes)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d){ return(x(d['WD Start']))})
                    .attr("cy",  function(d){        
                        return y(y_counts[d['WD Start']].indexOf(d.Activity) )
                    })
                    .attr("r",d=> r(parseFloat(d["WD end"])-parseFloat(d["WD Start"])))
                    .style("fill", "#69b3a2")
                    .attr("class", d=>d.Activity.replace(/\./g, '_').replace(/\s/g, '_') + " mynodes")
                    .on("mouseover",(d,e)=> {
                        d3.select("#tooltip_div")
                        .style("display","block")
                        
                        let duration = (parseFloat(d["WD end"])-parseFloat(d["WD Start"]) );

                        
                        d3.selectAll(".mylinks")
                         .classed("hide",true)

                        let li = "<ul>" +
                                    "<li > Activity: <strong> " + d.Activity + "</strong> </li>"+
                                    "<li > Start Date: <strong> " + parseFloat(d["WD Start"])+ "</strong></li>"+
                                    "<li > End Date: <strong> " + parseFloat(d["WD end"]) + "</strong></li>"+
                                    "<li > Duration: <strong> " + duration + "</strong></li>"+
                                 "</ul>";

                        d3.select("#tooltip_div")
                            .style("left",(x(d['WD Start'])+40)+"px")
                            .style("top",(y(y_counts[d['WD Start']].indexOf(d.Activity))+40)+"px")
                            .html(li)

                        let cur_activity = d.Activity;
                        let to_nodes = full_data.edges.filter( d=> d["From"] == cur_activity)

                        to_nodes.forEach( (d,i) => {

                            let class_name = "from_"+d["From"].replace(/\./g, '_').replace(/\s/g, '_')+"_to_"+d["To"].replace(/\./g, '_').replace(/\s/g, '_')

                            d3.selectAll("."+class_name)
                                .style("stroke","#ff0000")
                                .classed("hide",false)
                        })
                    })
                    .on("mousemove",(d)=> {
                    

                    })
                    .on("mouseout",d=> {

                        d3.select("#tooltip_div")
                        .style("display","none")

                        d3.selectAll(".mylinks")
                         .style("stroke","#999")
                          .classed("hide",false)
                    })

    let label = svg.selectAll("label")
                    .data(full_data.nodes)
                    .enter()
                    .append("text")
                    .attr('x', function(d) {
                         return(x(d['WD Start']));
                    })
                    .attr('y', function(d) {
                         return   y(y_counts[d['WD Start']].indexOf(d.Activity) ) + r(parseFloat(d["WD end"])-parseFloat(d["WD Start"]));
                    })
                    .text(function(d) {
                        return d.Activity;
                    })
                    .attr("class",d=> "hide "+d.Activity.replace(/\./g, '_').replace(/\s/g, '_')); 

}
