import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface LineChartProps {
  dataFilePath: string; // Path to the CSV file, e.g., "/data/car_prices.csv"
}

const LineChart: React.FC<LineChartProps> = ({ dataFilePath }) => {
  const { selectedMake, selectedBodyType } = useFilterContext();
  const [monthlyData, setMonthlyData] = useState<{ month: string; avgPrice: number; salesCount: number; stdDev: number }[]>([]);

  useEffect(() => {
    // Load and process data based on selected filters
    loadCarData(dataFilePath).then((data) => {
      const filteredData = data.filter((row) =>
        (selectedMake === 'ALL' || row.make === selectedMake) &&
        (selectedBodyType === 'ALL' || row.body === selectedBodyType)
      );

      // Group data by month and calculate statistics
      const monthlyStats = d3.rollups(
        filteredData,
        (v) => {
          const avgPrice = d3.mean(v, (d) => d.sellingprice) ?? 0;
          const salesCount = v.length;
          const stdDev = d3.deviation(v, (d) => d.sellingprice) ?? 0;
          return { avgPrice, salesCount, stdDev };
        },
        (d) => d.saledate.slice(0, 7) // Group by year-month (YYYY-MM)
      );

      // Convert to array and sort by date
      const sortedData = monthlyStats
        .map(([month, { avgPrice, salesCount, stdDev }]) => ({ month, avgPrice, salesCount, stdDev }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Fill in missing months with zero values
      const filledData = fillMissingMonths(sortedData);

      setMonthlyData(filledData);
    });
  }, [dataFilePath, selectedMake, selectedBodyType]);

  // Helper function to fill missing months with zero values
  const fillMissingMonths = (data: { month: string; avgPrice: number; salesCount: number; stdDev: number }[]) => {
    if (data.length === 0) return [];

    const startDate = d3.timeMonth.floor(new Date(data[0].month + '-01'));
    const endDate = d3.timeMonth.floor(new Date(data[data.length - 1].month + '-01'));
    const allMonths = d3.timeMonths(startDate, d3.timeMonth.offset(endDate, 1)).map(d3.timeFormat('%Y-%m'));

    const monthMap = new Map(data.map((d) => [d.month, d]));

    return allMonths.map((month) => {
      if (monthMap.has(month)) {
        return monthMap.get(month)!;
      }
      return { month, avgPrice: 0, salesCount: 0, stdDev: 0 };
    });
  };

  useEffect(() => {
    // Set up SVG dimensions
    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    // Select the SVG element and clear previous content
    const svg = d3.select('#line-chart').attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Set up scales
    const x = d3.scaleBand()
      .domain(monthlyData.map((d) => d.month))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(monthlyData, (d) => d.avgPrice) ?? 0])
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
      .call(d3.axisLeft(y).ticks(6));

    // Add x-axis label
    svg.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .text('Month');

    // Add y-axis label
    svg.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .text('Average Sale Price');

    // Add title
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .style('font-size', '16px')
      .text('Monthly Average Sale Price Trend');

    // Define line generator
    const line = d3.line<{ month: string; avgPrice: number }>()
      .x((d) => x(d.month)! + x.bandwidth() / 2)
      .y((d) => y(d.avgPrice));

    // Add line path with animation
    svg.append('path')
      .datum(monthlyData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('stroke-dasharray', function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);

    // Tooltip
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

    // Circles for each data point with tooltip event listeners
    svg.selectAll('.circle')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'circle')
      .attr('cx', (d) => x(d.month)! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.avgPrice))
      .attr('r', 4)
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`Month: ${d.month}<br>Sales: ${d.salesCount}<br>Avg Price: $${d.avgPrice.toFixed(2)}<br>Price Std Dev: $${d.stdDev.toFixed(2)}`);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 30}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });
  }, [monthlyData]);

  return (
    <div>
      <svg id="line-chart"></svg>
    </div>
  );
};

export default LineChart;
