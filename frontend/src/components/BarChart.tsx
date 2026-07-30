import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: {
    data?: Array<Record<string, any>>;
    xKey?: string;
    yKey?: string;
    title?: string;
    [key: string]: any;
  };
}

export function BarChart({ data }: BarChartProps) {
  const chartData = data.data || [];
  const xKey = data.xKey || Object.keys(chartData[0] || {})[0];
  const yKey = data.yKey || Object.keys(chartData[0] || {})[1];

  if (!chartData.length) {
    return <div className="chart empty">No data to display</div>;
  }

  return (
    <div className="chart bar-chart">
      {data.title && <h3>{data.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
