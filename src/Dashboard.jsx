import "./Dashboard.css";
import Numbercard from "./Numbercard";
import Linechart from "./Linechart";
import { useState, useEffect } from "react";

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="dashboard col-9 d-flex flex-column container-fluid g-0 p-5">
      <div className="d-flex flex-row">
        <h1 className="display-5 me-auto fw-normal">Welcome back, User</h1>
        <h1 className="text-end display-6">January 1, 2026</h1>
      </div>
      <hr />
      <div className="d-flex flex-row justify-content-end dash-date">
        <button className="btn btn-white">1m</button>
        <button className="btn btn-white">1m</button>
        <button className="btn btn-white">1m</button>
        <button className="btn btn-white">1m</button>
      </div>
      <div className="d-flex flex-row numbercards my-3">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <>
            <Numbercard title="Total Products" value={data?.total_products} />
            <Numbercard title="Low Stock" value={data?.low_stock_products} />
            <Numbercard title="Total Units" value={data?.total_units_in_stock} />
          </>
        )}
      </div>
      <div className="graph px-4 py-3 my-3">
        <h1 className="lead fw-medium">Sales</h1>
        <hr />
        <Linechart></Linechart>
      </div>
      <div className="d-flex my-3 dual-graph">
        <div className="w-50 graph px-4 py-3">
          <h1 className="lead fw-medium">Glow stock</h1>
          <hr />
          <Linechart></Linechart>
        </div>
        <div className="w-50 graph px-4 py-3">
          <h1 className="lead fw-medium">Graph 1</h1>
          <hr />
          <Linechart></Linechart>
        </div>
      </div>
      <div className="graph px-4 py-3 my-3">
        <h1 className="lead fw-medium">Graph 1</h1>
        <hr />
        <Linechart></Linechart>
      </div>
    </div>
  );
}

export default Dashboard;


