import React, { useEffect, useState } from 'react';
import { MenuItem, FormControl, Select, InputLabel } from '@mui/material';
import { useFilterContext } from '../stores/FilterContext';
import { loadCarData } from '../stores/dataLoader';

interface FilterBarsProps {
  dataFilePath: string; // Path to the CSV file, e.g., "/data/car_prices.csv"
}

const FilterBars: React.FC<FilterBarsProps> = ({ dataFilePath }) => {
  const { selectedMake, setSelectedMake, selectedBodyType, setSelectedBodyType } = useFilterContext();
  const [allMakes, setAllMakes] = useState<string[]>(['ALL']);
  const [filteredBodyTypes, setFilteredBodyTypes] = useState<string[]>(['ALL']);
  const [allBodyTypes, setAllBodyTypes] = useState<string[]>(['ALL']);

  useEffect(() => {
    // Load data once and initialize all options for make and body type
    loadCarData(dataFilePath).then((data) => {
      const uniqueMakes = Array.from(new Set(data.map((row) => row.make))).sort();
      const uniqueBodyTypes = Array.from(new Set(data.map((row) => row.body))).sort();

      setAllMakes(['ALL', ...uniqueMakes]);
      setAllBodyTypes(['ALL', ...uniqueBodyTypes]);
      setFilteredBodyTypes(['ALL', ...uniqueBodyTypes]); // Start with all body types
    });
  }, [dataFilePath]);

  useEffect(() => {
    // Filter body type options based on the selected make
    loadCarData(dataFilePath).then((data) => {
      if (selectedMake === 'ALL') {
        setFilteredBodyTypes(allBodyTypes);
      } else {
        const bodyTypesForMake = Array.from(
          new Set(data.filter((row) => row.make === selectedMake).map((row) => row.body))
        ).sort();
        setFilteredBodyTypes(['ALL', ...bodyTypesForMake]);
      }
    });
  }, [dataFilePath, selectedMake, allBodyTypes]);

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <FormControl variant="outlined" style={{ minWidth: 120 }}>
        <InputLabel>Make</InputLabel>
        <Select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          label="Make"
        >
          {allMakes.map((make) => (
            <MenuItem key={make} value={make}>{make}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="outlined" style={{ minWidth: 120 }}>
        <InputLabel>Body Type</InputLabel>
        <Select
          value={selectedBodyType}
          onChange={(e) => setSelectedBodyType(e.target.value)}
          label="Body Type"
        >
          {filteredBodyTypes.map((bodyType) => (
            <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default FilterBars;
