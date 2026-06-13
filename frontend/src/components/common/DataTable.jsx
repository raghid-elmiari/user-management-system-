export const DataTable = ({ columns, rows }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>{columns.map((column) => <th key={column.accessor}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.accessor}>{row[column.accessor]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
