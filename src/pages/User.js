import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import Loader from "../components/Loader";
import { getUserLists } from "../utilities/service";
import UserTable from "../components/UserTable";
import { useUser } from "../utilities/UserContext";

const User = ({ dashboard }) => {
  document.title = `User Details | ${CONFIG.title.name}`;
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  console.log("userList", userList);
  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createUser = () => {
    navigate("/create-user");
  };

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        const result = await getUserLists();
        const updateID = result.users.map((item, index) => ({
          ...item,
          id: item.id || index + 1, // Appending a unique ID if it doesn't exist
          user_type:
            item.user_type === "A"
              ? "Admin"
              : item.user_type === "K"
              ? "Kitchen"
              : item.user_type === "B"
              ? "Branch"
              : "",
          user_status:
            item.user_status === "A"
              ? "Active"
              : item.user_status === "I"
              ? "Inactive"
              : "",
          // dob: item.dob ? item.dob.split("T")[0] : null,
          // doj: item.doj ? item.doj.split("T")[0] : null,
        }));
        setUserList(updateID);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!dashboard && <ResponsiveAppBar onLogout={handleLogout} user={user} />}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createUser}>
          Add User
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <UserTable list={userList} />
        </Box>
      </Box>
    </>
  );
};

export default User;
