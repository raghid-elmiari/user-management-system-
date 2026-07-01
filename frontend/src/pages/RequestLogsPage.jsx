import { useEffect, useState } from 'react';
import { requestLogsApi } from '../api/requestLogsApi';

export const RequestLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = async () => {
    const res = await requestLogsApi.getAll({ page, size: 20 });
    setLogs(res.data.content || []);
    setTotalPages(res.data.totalPages || 0);
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Request <span className="page-title-accent">Logs</span>
        </h1>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.method}</td>
                <td>{log.endpoint}</td>
                <td>{log.status}</td>
                <td>{log.username || 'Guest'}</td>
                <td>{log.ipAddress}</td>
                <td>{log.durationMs} ms</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span>Page {page + 1} of {totalPages || 1}</span>

          <button
            className="btn btn-ghost"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};