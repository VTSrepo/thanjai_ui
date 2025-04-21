import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { CONFIG } from "../../src/config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useUser } from "../utilities/UserContext";
import Loader from "../components/Loader";
import { getCategoriesList } from "../utilities/service";
import CategoryTable from "../components/CategoryTable";

const Category = ({ dashboard }) => {
  document.title = `Category Details | ${CONFIG.title.name}`;
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [catList, setCatList] = useState([]);

  console.log("categoryList", catList);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createCategory = () => {
    navigate("/create-category");
  };

  useEffect(() => {
    const getCategoryLists = async () => {
      try {
        setLoading(true);
        const result = await getCategoriesList();
        const updateID = result.categories.map((item, index) => ({
          ...item,
          id: item.id || index + 1, // Appending a unique ID if it doesn't exist
          active:
            item.active === "A"
              ? "Active"
              : item.active === "I"
              ? "Inactive"
              : "",
        }));
        setCatList(updateID);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    getCategoryLists();
  }, []);

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      {!dashboard && <ResponsiveAppBar onLogout={handleLogout} user={user} />}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={createCategory}>
          Add Category
        </Button>
        <Box sx={{ mt: 2, padding: 2 }}>
          {" "}
          <CategoryTable list={catList} />
        </Box>
      </Box>
    </>
  );
};

export default Category;
