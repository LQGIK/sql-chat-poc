import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#a4de6c', '#ffa500'];

interface PieChartProps {
  data: {
    data?: Array<Record<string, any>>;
    nameKey?: string;
    valueKey?: string;
    title?: string;
    [key: string]: any;
  };
}

export function PieChart({ data }: PieChartProps) {
  const chartData = data.data || [];
  const nameKey = data.nameKey || Object.keys(chartData[0] || {})[0];
  const valueKey = data.valueKey || Object.keys(chartData[0] || {})[1];

  if (!chartData.length) {
    return <div className="chart empty">No data to display</div>;
  }

  return (
    <div className="chart pie-chart">
      {data.title && <h3>{data.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
