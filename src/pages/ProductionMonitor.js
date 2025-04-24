import React, { useState, useEffect } from "react";
import { Box, Button, Grid2 } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import ProductionMonitorTable from "../components/ProductionMonitorTable";
import Loader from "../components/Loader";
import { getJobListing } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import { dateFromString } from "../utilities/helpers";

const ProductionMonitor = ({  dashboard }) => {
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);

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
          production_date: dateFromString(item.production_date) 
        }));
        setJobList(updatedData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    getJobs();
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
    </>
  );
};

export default ProductionMonitor;
