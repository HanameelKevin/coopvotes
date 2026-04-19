import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const AdminCharts = ({ statsData, resultsData }) => {
  // Query to get live votes-over-time data
  const { data: timelineData } = useQuery({
    queryKey: ['votesTimeline'],
    queryFn: async () => {
      const response = await api.get('/admin/votes-over-time');
      return response.data.data;
    },
    refetchInterval: 5000 // Poll every 5 seconds
  });

  // Formatting Line Chart Data
  const lineChartData = {
    labels: timelineData?.map(d => d.time.split(' ')[1]) || [],
    datasets: [
      {
        label: 'Votes Cast',
        data: timelineData?.map(d => d.votes) || [],
        borderColor: '#0b6623', // coop-green
        backgroundColor: 'rgba(11, 102, 35, 0.2)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Pie Chart: Distribution by Department (Turnout mapping)
  const pieLabels = statsData?.users?.byDepartment ? Object.keys(statsData.users.byDepartment) : [];
  const pieDataArray = statsData?.users?.byDepartment ? Object.values(statsData.users.byDepartment) : [];
  
  const pieChartData = {
    labels: pieLabels,
    datasets: [{
      label: 'Voters per Department',
      data: pieDataArray,
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'
      ],
      borderWidth: 1,
    }]
  };

  // Bar Chart: President Result mapping
  const candidateNames = resultsData?.results?.President?.global?.map(c => c.name) || [];
  const candidateVotes = resultsData?.results?.President?.global?.map(c => c.totalVotes) || [];

  const barChartData = {
    labels: candidateNames,
    datasets: [{
      label: 'Presidential Votes',
      data: candidateVotes,
      backgroundColor: 'rgba(212, 175, 55, 0.7)', // coop-gold
      borderColor: '#d4af37',
      borderWidth: 1,
    }]
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-4 shadow-sm border border-gray-100">
          <h3 className="text-gray-900 font-semibold mb-3">Live Vote Velocity</h3>
          <div className="h-64">
            <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-panel p-4 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <h3 className="text-gray-900 font-semibold mb-3 w-full text-left">Voter Demographics</h3>
          <div className="h-64 w-full flex justify-center">
             <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      
      <div className="glass-panel p-4 shadow-sm border border-gray-100">
        <h3 className="text-gray-900 font-semibold mb-3">Top Race Dashboard (President)</h3>
        <div className="h-64">
          <Bar 
             data={barChartData} 
             options={{ 
               maintainAspectRatio: false,
               scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
             }} 
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;
