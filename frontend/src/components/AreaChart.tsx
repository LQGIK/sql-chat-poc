import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AreaChartProps {
  data: {
    data?: Array<Record<string, any>>;
    xKey?: string;
    yKey?: string;
    title?: string;
    [key: string]: any;
  };
}

export function AreaChart({ data }: AreaChartProps) {
  const chartData = data.data || [];
  const xKey = data.xKey || Object.keys(chartData[0] || {})[0];
  const yKey = data.yKey || Object.keys(chartData[0] || {})[1];

  if (!chartData.length) {
    return <div className="chart empty">No data to display</div>;
  }

  return (
    <div className="chart area-chart">
      {data.title && <h3>{data.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsAreaChart data={chartData}>
          <defs>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorArea)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
