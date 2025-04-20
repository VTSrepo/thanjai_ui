import React, { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { CONFIG } from "../../src/config-global"
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import { getJobListing,getEmployeesList } from "../utilities/service";
import EmployeeTable from "../components/EmployeeTable";

const Employee = ({ user,dashboard }) => {
  console.log("dashboard",dashboard)
  document.title =`Employee Details | ${CONFIG.title.name}`
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [empList, setEmpList] = useState([]);
  console.log("empList",empList)

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createEmployee = () => {
    navigate("/employee-create");
  };

  useEffect(() => {    
    const getEmployeesLists = async () => {
          try {
            setLoading(true);
            const result = await getEmployeesList();
            const updateID = result.employees.map((item, index) => ({
              ...item,
              id: item.id || index + 1, // Appending a unique ID if it doesn't exist
              active: item.active === "A" ? "Active" :  item.active === "I" ? "Inactive" : ""
            }));
            setEmpList(updateID);
          } catch (err) {
            console.log(err);
          }
          finally{
            setLoading(false);
          }
        };
        getEmployeesLists();
  }, []);


  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {(!dashboard)&&(<ResponsiveAppBar onLogout={handleLogout} user={user} />)}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createEmployee}>
          Add Employee
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <EmployeeTable list={empList} />
        </Box>
      </Box>      
    </>
  );
};

export default Employee;
