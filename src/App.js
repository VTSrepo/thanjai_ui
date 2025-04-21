import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container, createTheme, ThemeProvider } from "@mui/material"; // Import necessary components
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

import Reports from "./pages/Reports";

import Employee from "./pages/Employee"

import IndentRequestForm from "./pages/IndentRequestForm";
import ProductForm from "./pages/ProductForm";
import ProductMaster from "./pages/ProductMaster";
import IndentMaster from "./pages/IndentMaster";
import ProductionMonitor from "./pages/ProductionMonitor";
import ProductionMonitorForm from './pages/ProductionMonitorForm';
import TimesheetListing from "./pages/TimesheetListing";
import TimesheetForm from "./pages/TimesheetForm";
import { UserProvider } from "./utilities/UserContext";
// import EmployeeForm from "./pages/EmployeeForm";
import CreateEmployeeForm from "./pages/CreateEmployeeForm";
import ViewEmployee from "./pages/ViewEmployee";
import CreateUserForm from "./pages/CreateUserForm";
import ViewUser from "./pages/ViewUser";
import User from "./pages/User";
import  Category  from "./pages/Category";
import ViewCategory from "./pages/ViewCategory";
import CreateCategoryForm from "./pages/CreateCategoryForm";

function App() {
  const [user, setUser] = useState(null);
  console.log("user",user)

  useEffect(() => {
    // Check if the token exists in localStorage
    const token = localStorage.getItem("authToken");
    console.log("token",token)
    if (token) {
      // Assuming token-based authentication, extract user info from the token if needed
      setUser({ username: "user", role: "user" }); // Replace with actual token decoding logic for user role
    }
  }, []);

  const ProtectedRoute = ({ element, role }) => {
    return user && user.role === role ? element : <Navigate to="/login" />;
  };

  if(!user){
    setUser(JSON.parse(localStorage.getItem("user")));
  }

  // Create a theme for the app
  const theme = createTheme({
    // You can customize the theme here if needed
    typography: {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: "#ffa133", // Default background color for all buttons
            color: "#fff", // Default text color for buttons
            "&:hover": {
              backgroundColor: "#1565c0", // Hover state background color
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {/* Change the maxWidth to "xl" for a desktop layout */}
      <UserProvider>
        <Container maxWidth={false} sx={{ paddingRight: 0, paddingLeft: 0 }}>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/indents"
              element={<IndentMaster user={user} setUser={setUser} />}
            />
            <Route
              path="/home"
              element={<Home user={user} setUser={setUser} />}
            />
            <Route
              path="/production-monitor"
              element={<ProductionMonitor user={user} setUser={setUser} />}
            />
            <Route
              path="/ts"
              element={<TimesheetListing/>}
            />
            <Route
              path="/job-create"
              element={<ProductionMonitorForm user={user} setUser={setUser} />}
            />
            <Route
              path="/ts-create"
              element={<TimesheetForm user={user} setUser={setUser} />}
            />             
              

            <Route
              path="/employee-create"
              element={<CreateEmployeeForm user={user} setUser={setUser} />}
            /> 
            <Route
              path="/view-employee"
              element={<ViewEmployee user={user} setUser={setUser} />}
            />            

            {/* <Route
              path="/product-create"
              element={
                <ProtectedRoute
                  element={<ProductForm user={user} setUser={setUser} />}
                  role="admin"
                />
              }
            /> */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  element={<Admin user={user} setUser={setUser} />}
                  role="admin"
                />
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute
                  element={<Reports user={user} setUser={setUser} />}
                  role="admin"
                />
              }/>
              
              <Route path="/employee"
              element={<Employee user={user} setUser={setUser} />}
            />
            <Route
              path="/user"
              element={<User user={user} setUser={setUser} />}
            />
            <Route
              path="/create-user"
              element={<CreateUserForm user={user} setUser={setUser} />}
            />
             <Route
              path="/view-user"
              element={<ViewUser user={user} setUser={setUser} />}
            />
            <Route
              path="/category"
              element={<Category user={user} setUser={setUser} />}
            />

            <Route
              path="/create-category"
              element={<CreateCategoryForm user={user} setUser={setUser} />}
            />

              <Route
              path="/view-category"
              element={<ViewCategory user={user} setUser={setUser} />}
            />
            {/* <Route
              path="/product-master"
              element={
                <ProtectedRoute
                  element={<ProductMaster user={user} setUser={setUser} />}
                  role="admin"
                />
              }
            /> */}
            <Route
              path="/production-monitor"
              element={
                <ProtectedRoute
                  element={
                    <ProductionMonitor
                      user={user}
                      setUser={setUser}
                      role="admin"
                    />
                  }
                />
              }
            />

            {/* <Route
              path="/indent-create"
              element={
                <ProtectedRoute
                  element={
                    <IndentRequestForm
                      user={user}
                      setUser={setUser}
                      role="admin"
                    />
                  }
                />
              }
            /> */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Container>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
