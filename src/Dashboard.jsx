import "./Dashboard.css";
import Numbercard from "./Numbercard";
import Linechart from "./Linechart";
import { useState, useEffect } from "react";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, trendsRes] = await Promise.all([
          fetch("/api/dashboard/summary"),
          fetch(`/api/dashboard/trends?months=${months}`),
        ]);

        const summaryJson = await summaryRes.json();
        const trendsJson = await trendsRes.json();

        if (!summaryRes.ok) throw new Error(summaryJson?.error || "Failed to fetch summary");
        if (!trendsRes.ok) throw new Error(trendsJson?.error || "Failed to fetch trends");

        setSummary(summaryJson);
        setTrends(trendsJson);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [months]);

  const salesLabels = trends?.sales_by_month?.map((item) => item.month) || [];
  const salesValues = trends?.sales_by_month?.map((item) => Number(item.sales_total)) || [];

  const purchaseLabels = trends?.purchases_by_month?.map((item) => item.month) || [];
  const purchaseValues = trends?.purchases_by_month?.map((item) => Number(item.ordered_qty)) || [];

  const stockCategoryLabels = trends?.stock_by_category?.map((item) => item.category) || [];
  const stockCategoryValues = trends?.stock_by_category?.map((item) => Number(item.total_stock)) || [];

  const todayLabel = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard col-9 d-flex flex-column container-fluid g-0 p-5">
      <div className="d-flex flex-row">
        <h1 className="display-5 me-auto fw-normal">Welcome back, User</h1>
        <h1 className="text-end display-6">{todayLabel}</h1>
      </div>
      <hr />
      <div className="d-flex flex-row justify-content-end dash-date">
        <button className={`btn ${months === 3 ? "btn-primary" : "btn-white"}`} onClick={() => setMonths(3)}>
          3m
        </button>
        <button className={`btn ${months === 6 ? "btn-primary" : "btn-white"}`} onClick={() => setMonths(6)}>
          6m
        </button>
        <button className={`btn ${months === 12 ? "btn-primary" : "btn-white"}`} onClick={() => setMonths(12)}>
          12m
        </button>
        <button className={`btn ${months === 24 ? "btn-primary" : "btn-white"}`} onClick={() => setMonths(24)}>
          24m
        </button>
      </div>
      <div className="d-flex flex-row numbercards my-3">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <>
            <Numbercard title="Total Products" value={summary?.total_products} />
            <Numbercard title="Low Stock" value={summary?.low_stock_products} />
            <Numbercard title="Total Units" value={summary?.total_units_in_stock} />
          </>
        )}
      </div>
      <div className="graph px-4 py-3 my-3">
        <h1 className="lead fw-medium">Sales Value by Month</h1>
        <hr />
        <Linechart
          labels={salesLabels}
          values={salesValues}
          xLabel="Month"
          yLabel="Sales Value"
          lineColor="rgb(13, 110, 253)"
        />
      </div>
      <div className="d-flex my-3 dual-graph">
        <div className="w-50 graph px-4 py-3">
          <h1 className="lead fw-medium">Purchase Quantity by Month</h1>
          <hr />
          <Linechart
            labels={purchaseLabels}
            values={purchaseValues}
            xLabel="Month"
            yLabel="Ordered Units"
            lineColor="rgb(25, 135, 84)"
          />
        </div>
        <div className="w-50 graph px-4 py-3">
          <h1 className="lead fw-medium">Stock by Category</h1>
          <hr />
          <Linechart
            labels={stockCategoryLabels}
            values={stockCategoryValues}
            xLabel="Category"
            yLabel="Units"
            lineColor="rgb(255, 193, 7)"
          />
        </div>
      </div>
      <div className="graph px-4 py-3 my-3">
        <h1 className="lead fw-medium">Inventory Value</h1>
        <hr />
        <Linechart
          labels={summary ? ["Current"] : []}
          values={summary ? [Number(summary.total_inventory_value || 0)] : []}
          xLabel="Snapshot"
          yLabel="Value"
          lineColor="rgb(220, 53, 69)"
        />
      </div>
    </div>
  );
}

export default Dashboard;


