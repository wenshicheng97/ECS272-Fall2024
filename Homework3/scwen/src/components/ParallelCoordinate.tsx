import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface ParallelCoordinateProps {
  dataFilePath: string; // Path to the CSV file, e.g., "/data/car_prices.csv"
}

const ParallelCoordinate: React.FC<ParallelCoordinateProps> = ({ dataFilePath }) => {
  const { selectedMake, selectedBodyType } = useFilterContext();

  useEffect(() => {
    // Load and filter data based on selection
    loadCarData(dataFilePath).then((data) => {
      const filteredData = data.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType)
      );

      // Set up SVG dimensions
      const width = 700;
      const height = 400;
      const margin = { top: 30, right: 30, bottom: 30, left: 50 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      // Select SVG element and clear previous content
      const svg = d3.select('#parallel-coordinates').attr('width', width).attr('height', height);
      svg.selectAll('*').remove();

      // Define the dimensions we are working with
      const dimensions = ['year', 'odometer', 'mmr', 'sellingprice'];

      // Create scales for each dimension
      const yScales = {
        year: d3.scaleLinear().domain(d3.extent(filteredData, (d) => +d.year) as [number, number]).range([chartHeight, 0]),
        odometer: d3.scaleLinear().domain(d3.extent(filteredData, (d) => +d.odometer) as [number, number]).range([chartHeight, 0]),
        mmr: d3.scaleLinear().domain(d3.extent(filteredData, (d) => +d.mmr) as [number, number]).range([chartHeight, 0]),
        sellingprice: d3.scaleLinear().domain(d3.extent(filteredData, (d) => +d.sellingprice) as [number, number]).range([chartHeight, 0]),
      };

      // X scale for spacing out the dimensions
      const x = d3.scalePoint().domain(dimensions).range([margin.left, chartWidth + margin.left]);

      // Line generator for each data entry
      const lineGenerator = d3.line()
        .defined((d: [number, number]) => !isNaN(d[1]))
        .y((d) => yScales[d[0]](d[1]))
        .x((d) => x(d[0])!);

      // Tooltip for parallel coordinates
      const tooltip = d3.select('#tooltip');
      if (tooltip.empty()) {
        d3.select('body').append('div')
          .attr('id', 'tooltip')
          .style('position', 'absolute')
          .style('padding', '8px')
          .style('background', '#333')
          .style('color', '#fff')
          .style('border-radius', '4px')
          .style('pointer-events', 'none')
          .style('opacity', 0);
      }

      // Draw each line
      svg.selectAll('path')
        .data(filteredData)
        .enter()
        .append('path')
        .attr('d', (d) => lineGenerator(dimensions.map(dim => [dim, +d[dim as keyof typeof yScales]] as [string, number]))!)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('opacity', (d) => d.condition / 5) // Assuming condition is a scale of 1-5
        .on('mouseover', (event, d) => {
          tooltip
            .style('opacity', 1)
            .html(`Condition: ${d.condition}<br>Year: ${d.year}<br>Odometer: ${d.odometer}<br>MMR: ${d.mmr}<br>Sale Price: ${d.sellingprice}`);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 30}px`);
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });

      // Draw axis for each dimension
      svg.selectAll('.dimension')
        .data(dimensions)
        .enter()
        .append('g')
        .attr('class', 'dimension')
        .attr('transform', (d) => `translate(${x(d)})`)
        .each(function(d) {
          d3.select(this).call(d3.axisLeft(yScales[d as keyof typeof yScales]));
        })
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .style('fill', 'black')
        .text((d) => d.charAt(0).toUpperCase() + d.slice(1));

    });
  }, [dataFilePath, selectedMake, selectedBodyType]);

  return (
    <div>
      <svg id="parallel-coordinates"></svg>
    </div>
  );
};

export default ParallelCoordinate;
