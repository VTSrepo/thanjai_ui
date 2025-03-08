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
            backgroundColor: '#ffa133', // Default background color for all buttons
            color: '#fff', // Default text color for buttons
            '&:hover': {
              backgroundColor: '#1565c0', // Hover state background color
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Router>
        {/* Change the maxWidth to "xl" for a desktop layout */}
        <Container maxWidth={false} sx={{ paddingRight: 0, paddingLeft: 0 }}>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/indents"
              element={<IndentRequestForm user={user} setUser={setUser} />}
            />
            <Route
              path="/home"
              element={<Home user={user} setUser={setUser} />}
            />
            
            {/* <Route
              path="/home"
              element={<ProtectedRoute element={<Home user={user} setUser={setUser} />} role="branch" />}
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
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
