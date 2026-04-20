import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the necessary components from Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Linechart = () => {
  // 1. Define the chart data
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: "",
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1, // Gives the line a slight curve; set to 0 for straight lines
      },
    ],
  };

  // 2. Define the chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: '', // Positions the legend at the top of the chart
      },
      title: {
        display: true,
        text: '', // Adds a title to the chart
      },
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Month'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Value'
            }
        }
    }
  };

  // 3. Render the Line component with data and options
  return <Line data={data} options={options}/>;
};

export default Linechart;