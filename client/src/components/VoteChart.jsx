import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const VoteBarChart = ({ data, title = 'Vote Distribution' }) => {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Total Votes',
        data: data.map(d => d.totalVotes),
        backgroundColor: 'rgba(0, 107, 63, 0.8)',
        borderColor: 'rgba(0, 107, 63, 1)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const VotePieChart = ({ data, title = 'Vote Distribution' }) => {
  const colors = [
    'rgba(0, 107, 63, 0.8)',
    'rgba(244, 196, 48, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 116, 144, 0.8)',
    'rgba(245, 158, 11, 0.8)'
  ];

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.totalVotes),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default VoteBarChart;
