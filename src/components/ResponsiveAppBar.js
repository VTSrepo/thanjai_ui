import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Menu as MenuIcon ,KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";
import { Link } from "react-router-dom"; // Using Link for routing

const ResponsiveAppBar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null); // State for the menu anchor element
  const [employeeAnchorEl, setEmployeeAnchorEl] = useState(null);
  const [mobileEmployeeAnchorEl, setMobileEmployeeAnchorEl] = useState(null);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm")); // Check if the screen is mobile-sized

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget); // Open the menu
  };

  const handleMenuClose = () => {
    setAnchorEl(null); // Close the menu
  };

  const handleMobileEmployeeOpen = (event) => {
    setMobileEmployeeAnchorEl(event.currentTarget);
  };

  const handleMobileEmployeeClose = () => {
    setMobileEmployeeAnchorEl(null);
  };

  const handleMasterMenuOpen = (event) => {
    setEmployeeAnchorEl(event.currentTarget);
  };

  const handleMasterMenuClose = () => {
    setEmployeeAnchorEl(null);
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#ffa133" }}>
      <Toolbar>
        {/* <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {user && user.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
        </Typography> */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Thanjai Caterers
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
              {user && user?.user_type === "B" && (
                <MenuItem component={Link} to="/home" onClick={handleMenuClose}>
                  Home
                </MenuItem>
              )}
              <MenuItem
                component={Link}
                to="/production-monitor"
                onClick={handleMenuClose}
              >
                Production Monitor
              </MenuItem>
               <MenuItem
                component={Link}
                to="/indents"
                onClick={handleMenuClose}
              >
                Indents
              </MenuItem>
              <MenuItem
                component={Link}
                to="/ts"
                onClick={handleMenuClose}
              >
                Timesheet
              </MenuItem>
             {/* {user && user?.user_type === "A" && (
               <MenuItem
                component={Link}
                to="/employee"
                onClick={handleMenuClose}
              >
                Employee
              </MenuItem> 

              {/* <MenuItem onClick={handleMobileEmployeeOpen}>
                Employee <ArrowDownIcon fontSize="small" />
              </MenuItem>
              <Menu
                anchorEl={mobileEmployeeAnchorEl}
                open={Boolean(mobileEmployeeAnchorEl)}
                onClose={handleMobileEmployeeClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
              >
                <MenuItem component={Link} to="/employee" onClick={handleMenuClose}>
                  Employee Master
                </MenuItem>
              </Menu> */}

              <Accordion sx={{ boxShadow: "none", background: "transparent" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ pl: 2 }}>
                  <Typography>Master</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List>
                  <Divider/>
                    <ListItem button component={Link} to="/employee" onClick={handleMenuClose}>
                      <ListItemText primary="Employee" />
                    </ListItem>
                    <Divider/>
                    <ListItem button component={Link} to="/user" onClick={handleMenuClose}>
                      <ListItemText primary="User" />
                    </ListItem>
                    <Divider/>
                    <Divider/>
                    <ListItem button component={Link} to="/category" onClick={handleMenuClose}>
                      <ListItemText primary="Category" />
                    </ListItem>
                    <Divider/>
                    {/* Add more sub-links here if needed */}
                  </List>
                </AccordionDetails>
              </Accordion>

              {user && user.role === "admin" && (
                <MenuItem
                  component={Link}
                  to="/admin"
                  onClick={handleMenuClose}
                >
                  Admin Home
                </MenuItem>
              )}

              {user && user?.user_type === "A" && (
                <MenuItem
                  component={Link}
                  to="/reports"
                  onClick={handleMenuClose}
                >
                  Reports
                </MenuItem>
              )}
              {/* {user && user.role === "admin" && (
                <MenuItem
                  component={Link}
                  to="/product-master"
                  onClick={handleMenuClose}
                >
                  Product Master
                </MenuItem>
              )} */}

              <MenuItem
                onClick={() => {
                  onLogout();
                  handleMenuClose();
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          // For larger screens, show the regular navigation bar
          <>
            {user && user.role === "branch" && (
              <Button color="inherit" component={Link} to="/home">
                Home
              </Button>
            )}

            {user && user?.user_type === "A" && (
              <Button color="inherit" component={Link} to="/admin">
                Admin Home
              </Button>
            )}
            {user && user?.user_type === "A" && (
              <Button color="inherit" component={Link} to="/reports">
                Reports
              </Button>
            )}
            <Button color="inherit" component={Link} to="/indents">
              Indents
            </Button>
            <Button component={Link} to="/production-monitor" color="inherit">
              Production Monitor
            </Button>
            <Button component={Link} to="/ts" color="inherit">
              Timesheet
            </Button>
            {/* <Button component={Link} to="/employee" color="inherit">
              Employee
            </Button> */}

            <Button
              color="inherit"
              onClick={handleMasterMenuOpen}
              endIcon={<ArrowDownIcon />}
            >
              Master
            </Button>
            <Menu
              anchorEl={employeeAnchorEl}
              open={Boolean(employeeAnchorEl)}
              onClose={handleMasterMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              <MenuItem
                component={Link}
                to="/employee"
                onClick={handleMasterMenuClose}
              >
                Employee
              </MenuItem>
              <MenuItem
                component={Link}
                to="/user"
                onClick={handleMasterMenuClose}
              >
                User
              </MenuItem>
              <MenuItem
                component={Link}
                to="/category"
                onClick={handleMasterMenuClose}
              >
                Category
              </MenuItem>
            </Menu>

            {/* <Button
              id="demo-customized-button"
              onClick={handleClick}
              endIcon={<KeyboardArrowDownIcon />}
            >
              Master
            </Button>
            <Menu
              // id="demo-customized-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose} >
                Employee
              </MenuItem>
            </Menu> */}

            {/* {user && user.role === "admin" && (
              <Button color="inherit" component={Link} to="/product-master">
                Product Master
              </Button>
            )} */}

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
