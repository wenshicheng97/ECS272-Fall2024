import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface BarChartProps {
  dataFilePath: string; // Path to the CSV file, e.g., "/data/car_prices.csv"
}

const BarChart: React.FC<BarChartProps> = ({ dataFilePath }) => {
  const { selectedMake, selectedBodyType } = useFilterContext();
  const [salesData, setSalesData] = useState<{ model: string; make: string; count: number; avgPrice: number }[]>([]);

  useEffect(() => {
    // Load data and filter based on selections
    loadCarData(dataFilePath).then((data) => {
      // Filter data based on selected make and body type
      const filteredData = data.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType)
      );

      // Calculate sales count and average price per model
      const salesDataMap = d3.rollups(
        filteredData,
        (v) => ({
          count: v.length,
          avgPrice: d3.mean(v, (d) => d.sellingprice) ?? 0,
          make: v[0].make,
        }),
        (d) => d.model
      );

      // Convert to an array and sort by sales count in descending order
      const sortedData = salesDataMap
        .map(([model, { count, avgPrice, make }]) => ({
          model,
          make,
          count,
          avgPrice,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Get top 10 models

      setSalesData(sortedData);
    });
  }, [dataFilePath, selectedMake, selectedBodyType]);

  useEffect(() => {
    // Set up SVG dimensions
    const width = 500;
    const height = 350;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };

    // Select the SVG element and clear previous content
    const svg = d3.select('#bar-chart').attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Set up scales
    const x = d3
      .scaleBand()
      .domain(salesData.map((d) => d.model))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(salesData, (d) => d.count) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create x-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Create y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .text('Car Model');

    // Add y-axis label
    svg.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .text('Number of Sales');

    // Add chart title
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .style('font-size', '16px')
      .text('Top 10 Car Models by Sales Count');

    // Create a tooltip div (initially hidden)
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

    // Draw bars with transition and tooltip event listeners
    svg.selectAll('.bar')
      .data(salesData, (d) => d.model)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.model)!)
      .attr('width', x.bandwidth())
      .attr('y', height - margin.bottom)
      .attr('height', 0)
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`Make: ${d.make}<br>Model: ${d.model}<br>Sales: ${d.count}<br>Avg Price: $${d.avgPrice.toFixed(2)}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(800)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => y(0) - y(d.count));
  }, [salesData]);

  return (
    <div>
      <svg id="bar-chart"></svg>
    </div>
  );
};

export default BarChart;
