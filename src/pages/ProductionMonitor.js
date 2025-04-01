import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import ProductionMonitorTable from "../components/ProductionMonitorTable";
import Loader from "../components/Loader";
import { getJobListing, getProductSummary} from "../utilities/service";
import ProductionDataChart from "../components/ProductionDataChart";


const ProductionMonitor = ({ user, dashboard }) => { 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [productSummary, setProductSummary] = useState({});

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createJob = () => {
    navigate("/job-create");
  };

  useEffect(() => {
    const getJobs = async () => {
      try {
        setLoading(true);
        const result = await getJobListing();
        const updatedData = result.productions.map((item, index) => ({
          ...item,
          id: item.id || index + 1, // Appending a unique ID if it doesn't exist
        }));
        setJobList(updatedData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };


    const getProductSummaryListing = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        console.log(today);
        const result = await getProductSummary({date:'2025-03-28'});
        
        setProductSummary(result.businesses);
      } catch (err) {
        alert('No data for today')
      } finally {
        setLoading(false);
      }
    };

    getJobs();
    getProductSummaryListing()
  }, []);


  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!dashboard && <ResponsiveAppBar onLogout={handleLogout} user={user} />}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createJob}>
          Add Job
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <ProductionMonitorTable list={jobList} />
        </Box>
      </Box>
      {user?.username === 'kumar@gmail.com' && (<div>
        <h3>Production Qty vs Damaged Qty</h3>
        <ProductionDataChart summary={productSummary}/>
        
      </div>)}
    </>
  );
};

export default ProductionMonitor;
