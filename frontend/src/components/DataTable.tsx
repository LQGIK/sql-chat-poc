interface DataTableProps {
  data: {
    columns?: string[];
    rows?: Array<Record<string, any>>;
    [key: string]: any;
  };
}

export function DataTable({ data }: DataTableProps) {
  const rows = data.rows || [];
  const columns = data.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  if (!rows.length) {
    return <div className="data-table empty">No data to display</div>;
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={`${idx}-${col}`}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
