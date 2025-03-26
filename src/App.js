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
import IndentRequestForm from "./pages/IndentRequestForm";
import ProductForm from "./pages/ProductForm";
import ProductMaster from "./pages/ProductMaster";
import IndentMaster from "./pages/IndentMaster";
import ProductionMonitor from "./pages/ProductionMonitor";
import ProductionMonitorForm from './pages/ProductionMonitorForm';
import { UserProvider } from "./utilities/UserContext";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if the token exists in localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      // Assuming token-based authentication, extract user info from the token if needed
      setUser({ username: "user", role: "user" }); // Replace with actual token decoding logic for user role
    }
  }, []);

  const ProtectedRoute = ({ element, role }) => {
    return user && user.role === role ? element : <Navigate to="/login" />;
  };

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
            {/* <Route
              path="/indents"
              element={<IndentMaster user={user} setUser={setUser} />}
            /> */}
            <Route
              path="/home"
              element={<Home user={user} setUser={setUser} />}
            />
            <Route
              path="/production-monitor"
              element={<ProductionMonitor user={user} setUser={setUser} />}
            />
            <Route
              path="/job-create"
              element={<ProductionMonitorForm user={user} setUser={setUser} />}
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
            {/* <Route
              path="/product-master"
              element={
                <ProtectedRoute
                  element={<ProductMaster user={user} setUser={setUser} />}
                  role="admin"
                />
              }
            /> */}
            {/* <Route
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
            /> */}

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
