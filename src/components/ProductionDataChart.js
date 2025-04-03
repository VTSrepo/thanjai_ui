import React, { useState, useEffect } from "react";
import { BarChart } from "@mui/x-charts/BarChart";

export default function ProductionDataChart({ summary, filterBy }) {
  const [productNames, setProductNames] = useState([]);
  const [quantities, setQuantites] = useState([]);

  useEffect(() => {
    if (Object.entries(summary).length > 0) {
      setProductNames(summary?.map((item) => filterBy==='product'?item.product_name:item.emp_name));
      const quantities = [
        {
          data: summary?.map((item) => Number(item.total_produced_qty)),
          label: 'Produced Qty',
        },
        {
          data: summary?.map((item) => Number(item.total_damaged_qty)),
          label: 'Damaged Qty',
        },
      ];
      setQuantites(quantities);
    }
  }, [summary]);

  return (
    <BarChart
      series={quantities}
      height={290}
      barLabel="value"
      xAxis={[{ data: productNames, scaleType: "band" }]}
      margin={{ top: 50, bottom: 30, left: 40, right: 10 }}
    />
  );
}
