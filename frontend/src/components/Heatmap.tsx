interface HeatmapProps {
  data: {
    data?: Array<Record<string, any>>;
    xKey?: string;
    yKey?: string;
    valueKey?: string;
    title?: string;
    [key: string]: any;
  };
}

function getColor(value: number, min: number, max: number): string {
  const ratio = (value - min) / (max - min);
  // Blue to Red gradient
  const hue = (1 - ratio) * 240; // 240 = blue, 0 = red
  return `hsl(${hue}, 100%, 50%)`;
}

export function Heatmap({ data }: HeatmapProps) {
  const chartData = data.data || [];
  const xKey = data.xKey || Object.keys(chartData[0] || {})[0];
  const yKey = data.yKey || Object.keys(chartData[0] || {})[1];
  const valueKey = data.valueKey || Object.keys(chartData[0] || {})[2];

  if (!chartData.length) {
    return <div className="heatmap empty">No data to display</div>;
  }

  // Extract unique X and Y values
  const xValues = Array.from(new Set(chartData.map(d => d[xKey])));
  const yValues = Array.from(new Set(chartData.map(d => d[yKey])));

  // Find min and max values for color scaling
  const values = chartData.map(d => d[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  chartData.forEach(d => {
    dataMap.set(`${d[xKey]}-${d[yKey]}`, d[valueKey]);
  });

  return (
    <div className="heatmap">
      {data.title && <h3>{data.title}</h3>}
      <div className="heatmap-grid">
        <div className="heatmap-row header">
          <div className="heatmap-cell corner" />
          {xValues.map(x => (
            <div key={x} className="heatmap-cell header-cell">
              {x}
            </div>
          ))}
        </div>
        {yValues.map(y => (
          <div key={y} className="heatmap-row">
            <div className="heatmap-cell header-cell">{y}</div>
            {xValues.map(x => {
              const value = dataMap.get(`${x}-${y}`);
              const bgColor = value !== undefined ? getColor(value, min, max) : '#f0f0f0';
              return (
                <div
                  key={`${x}-${y}`}
                  className="heatmap-cell"
                  style={{
                    backgroundColor: bgColor,
                    color: value !== undefined ? 'white' : '#999',
                  }}
                  title={value !== undefined ? `${value}` : 'No data'}
                >
                  {value !== undefined ? value : '—'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'hsl(240, 100%, 50%)' }} />
          <span>Low ({min})</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'hsl(0, 100%, 50%)' }} />
          <span>High ({max})</span>
        </div>
      </div>
    </div>
  );
}
