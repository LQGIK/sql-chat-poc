import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: {
    data?: Array<Record<string, any>>;
    xKey?: string;
    yKey?: string;
    title?: string;
    [key: string]: any;
  };
}

export function LineChart({ data }: LineChartProps) {
  const chartData = data.data || [];
  const xKey = data.xKey || Object.keys(chartData[0] || {})[0];
  const yKey = data.yKey || Object.keys(chartData[0] || {})[1];

  if (!chartData.length) {
    return <div className="chart empty">No data to display</div>;
  }

  return (
    <div className="chart line-chart">
      {data.title && <h3>{data.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
