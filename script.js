// script.js
const width = 800;
const height = 600;

// Load the CSV data
d3.csv("data/data_scopus.csv").then(data => {
    // Step 1: Data Preparation
    let nodes = [];
    let links = [];
    let countryCounts = {};

    // Process data to extract nodes and links
    data.forEach(d => {
        const author = d.Author;
        const affiliation = d.Affiliation;
        const country = d.Country;

        if (author && affiliation && country) {
            // Count each country’s occurrences
            countryCounts[country] = (countryCounts[country] || 0) + 1;

            // Add node if it doesn’t already exist
            if (!nodes.some(node => node.id === author)) {
                nodes.push({ id: author, country: country, affiliation: affiliation });
            }

            // Add a link (simple approach: links authors to their affiliation for illustration)
            links.push({ source: author, target: affiliation });
        }
    });

    // Top 10 countries by count
    const topCountries = Object.keys(countryCounts)
        .sort((a, b) => countryCounts[b] - countryCounts[a])
        .slice(0, 10);

    // Color scale for the top countries, default gray for others
    const color = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10)
        .unknown("#A9A9A9");

    // Step 4: Force Layout Visualization
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).strength(0.1))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.count || 1) * 5));

    // Tooltip setup
    const tooltip = d3.select(".tooltip");

    // Add links to SVG
    const link = svg.append("g")
        .attr("stroke", "#aaa")
        .selectAll("line")
        .data(links)
        .enter().append("line");

    // Add nodes to SVG
    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => Math.sqrt(d.count || 1) * 5)
        .attr("fill", d => color(d.country))
        .on("mouseover", (event, d) => {
            // Show tooltip
            tooltip.style("opacity", 1)
                .html(`Author: ${d.id}<br>Affiliation: ${d.affiliation}`);
            // Dim nodes not in the same affiliation
            node.style("opacity", n => n.affiliation === d.affiliation ? 1 : 0.2);
            link.style("opacity", l => l.source.affiliation === d.affiliation && l.target.affiliation === d.affiliation ? 1 : 0.2);
        })
        .on("mouseleave", () => {
            tooltip.style("opacity", 0);
            node.style("opacity", 1);
            link.style("opacity", 1);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 5) + "px")
                   .style("top", (event.pageY - 5) + "px");
        })
        .on("click", (event, d) => {
            tooltip.style("opacity", 1)
                   .html(`Author: ${d.id}<br>Affiliation: ${d.affiliation}<br>Country: ${d.country}`);
        });

    // Update positions during the simulation
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });
});
