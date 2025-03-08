import React, { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Button, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Link } from "react-router-dom"; // Using Link for routing

const ResponsiveAppBar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null); // State for the menu anchor element
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget); // Open the menu
  };

  const handleMenuClose = () => {
    setAnchorEl(null); // Close the menu
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>          
          {user && user.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
        </Typography>

        {/* For mobile view, show the hamburger icon */}
        {isMobile ? (
          <>
            <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {/* Menu Items */}
              <MenuItem component={Link} to="/home" onClick={handleMenuClose}>
                Home
              </MenuItem>
              <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                Profile
              </MenuItem>
              {user && user.role === "admin" && (
                <MenuItem component={Link} to="/admin" onClick={handleMenuClose}>
                  Admin Home
                </MenuItem>
              )}
              <MenuItem onClick={() => { onLogout(); handleMenuClose(); }}>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          // For larger screens, show the regular navigation bar
          <>
            <Button color="inherit" component={Link} to="/home">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/profile">
              Indents
            </Button>
            {user && user.role === "admin" && (
              <Button color="inherit" component={Link} to="/admin">
                Admin Home
              </Button>
            )}
            <Button color="inherit" onClick={onLogout}>
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default ResponsiveAppBar;
