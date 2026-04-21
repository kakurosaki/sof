import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const defaultLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const defaultValues = [0, 0, 0, 0, 0, 0];

function Linechart({
  labels = defaultLabels,
  values = defaultValues,
  lineColor = "rgb(75, 192, 192)",
  xLabel = "Period",
  yLabel = "Value",
}) {
  const data = {
    labels,
    datasets: [
      {
        label: "",
        data: values,
        fill: false,
        borderColor: lineColor,
        tension: 0.25,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel,
        },
      },
      y: {
        title: {
          display: true,
          text: yLabel,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default Linechart;