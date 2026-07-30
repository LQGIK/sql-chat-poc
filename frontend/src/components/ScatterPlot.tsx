import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ScatterPlotProps {
  data: {
    data?: Array<Record<string, any>>;
    xKey?: string;
    yKey?: string;
    title?: string;
    [key: string]: any;
  };
}

export function ScatterPlot({ data }: ScatterPlotProps) {
  const chartData = data.data || [];
  const xKey = data.xKey || Object.keys(chartData[0] || {})[0];
  const yKey = data.yKey || Object.keys(chartData[0] || {})[1];

  if (!chartData.length) {
    return <div className="chart empty">No data to display</div>;
  }

  return (
    <div className="chart scatter-plot">
      {data.title && <h3>{data.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          data={chartData}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey={xKey} />
          <YAxis type="number" dataKey={yKey} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name={yKey} data={chartData} fill="#8884d8" />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
