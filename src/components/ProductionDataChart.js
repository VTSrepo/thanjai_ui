import React, { useState, useEffect } from "react";
import { BarChart } from "@mui/x-charts/BarChart";

export default function ProductionDataChart({ summary }) {
  const [productNames, setProductNames] = useState([]);
  const [quantities, setQuantites] = useState([]);

  useEffect(() => {
    if (Object.entries(summary).length > 0) {
      setProductNames(summary?.map((item) => item.product_name));
      const quantities = [
        {
          data: summary?.map((item) => Number(item.total_produced_qty)),
        },
        {
          data: summary?.map((item) => Number(item.total_damaged_qty)),
        },
      ];
      setQuantites(quantities);
    }
  }, [summary]);

  return (
    <BarChart
      series={quantities}
      height={290}
      xAxis={[{ data: productNames, scaleType: "band" }]}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
    />
  );
}
