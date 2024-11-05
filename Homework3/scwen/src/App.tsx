import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import FilterBars from './components/FilterBars';
import BarChart from './components/BarChart';
import LineChart from './components/LineChart';
import ParallelCoordinate from './components/ParallelCoordinate';
import './App.css'

const App: React.FC = () => {
  return (
    <div>
      <h1>Car Sales Dashboard</h1>
      <FilterBars dataFilePath="/data/car_prices.csv" />
      <BarChart dataFilePath="/data/car_prices.csv" />
      <LineChart dataFilePath="/data/car_prices.csv" />
      <ParallelCoordinate dataFilePath="/data/car_prices.csv" />
    </div>
  );
};

export default App
