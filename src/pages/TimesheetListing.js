import React, { useState, useEffect } from "react";
import { Box, Button, Grid2 } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import TSTable from "../components/TSTable";
import Loader from "../components/Loader";
import { getTSListing } from "../utilities/service";
import { useUser } from "../utilities/UserContext";

const TimesheetListing = ({  dashboard }) => {
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createTS = () => {
    navigate("/ts-create");
  };

  useEffect(() => {
    const getJobs = async () => {
      try {
        setLoading(true);
        const result = await getTSListing();
        const updatedData = result.timesheets.map((item, index) => ({
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

    getJobs();
  }, []);

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!dashboard && <ResponsiveAppBar onLogout={handleLogout} user={user} />}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createTS}>
          Add Timesheet
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <TSTable list={jobList} user={user}/>
        </Box>
      </Box>
    </>
  );
};

export default TimesheetListing;
