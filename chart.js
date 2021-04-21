

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
    let margin = {top: 20, right: 30, bottom: 50, left: 30},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

        
        
    let svg = d3.select("#my_dataviz")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);


                var data = [
                   { id: 2, name: 'arrow', path: 'M 0,0 m -5,-5 L 5,0 L -5,5 Z', viewbox: '-5 -5 10 10' }
                  ]
                
                
                  var defs = svg.append('svg:defs')
                
                  var paths = svg.append('svg:g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                

                    

    // A linear scale to position the nodes on the X axis
    let x = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(Object.keys(y_counts), d=> parseFloat(d)))

    // A linear scale to position the nodes on the Y axis
    let y = d3.scaleLinear()
    .range([0, height])
    .domain([-1,max_nodes+1])

    let r = d3.scaleLinear()
        .range([15,30])
        .domain(d3.extent(full_data.nodes, d=> parseFloat(d["WD end"])-parseFloat(d['WD Start'])))

    paths
        .append("g")
        .attr("transform", "translate(0,"+height+")")      // This controls the vertical position of the Axis
        .call(d3.axisBottom(x))  


    var marker = defs.selectAll('marker')
                    .data(data)
                    .enter()
                    .append('svg:marker')
                      .attr('id', function(d){ return 'marker_' + d.name})
                      .attr('markerHeight', 5)
                      .attr('markerWidth', 5)
                      .attr('markerUnits', 'strokeWidth')
                      .attr('orient', 'auto')
                      .attr('refX', 0)
                      .attr('refY', 0)
                      .attr('viewBox', function(d){ return d.viewbox })
                      .append('svg:path')
                        .attr('d', function(d){ return d.path })
                        .attr('fill', "#999");


                        
    let nodes = paths.selectAll("mynodes")
    .data(full_data.nodes)
    .enter()
    .append("circle")
    .attr("cx", function(d){ return x(d['WD Start']) })
    .attr("cy",  function(d){        
        return y(y_counts[d['WD Start']].indexOf(d.Activity) )
    })
    .attr("r",d=> r(parseFloat(d["WD end"])-parseFloat(d["WD Start"])))
    .attr("width",20)
    .attr("height",20)
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


// Draw every datum a line connecting to its parent.
    var link = paths.selectAll(".mylinks")
                    .data(full_data.edges)
                    .enter().append("path")
                    .attr("class",d=> {
                            let class_name = "from_"+d["From"].replace(/\./g, '_').replace(/\s/g, '_')+"_to_"+d["To"].replace(/\./g, '_').replace(/\s/g, '_')
                            return class_name+" mylinks"
                    }) 
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
                    .attr('stroke-width', 2)
                    .attr('stroke-linecap', 'round')
                    .attr('marker-end', "url(#marker_arrow) ")

    


}
