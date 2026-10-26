import React, { useState, useEffect, useMemo } from "react";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import ProductTable from "../components/ProductTable";
import Loader from "../components/Loader";
import { API_URL, getAllBranches } from "../utilities/service";
import { useUser } from "../utilities/UserContext";
import axios from "axios";

const ProductMaster = () => {
  const navigate = useNavigate();  
  const { user, can } = useUser();
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState([]);
  const [search, setSearch] = useState("");
  const [kitchen, setKitchen] = useState("");
  const [kitchens, setKitchens] = useState([]);
  useEffect(() => {
    getAllBranches("K").then((k) => setKitchens(k || [])).catch(() => {});
  }, []);
  // search by name or code, optional kitchen filter, A-Z
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productList
      .filter((p) => !kitchen || (p.producing_branch_id || p.branch_id) === kitchen)
      .filter((p) => !q || String(p.product_name || "").toLowerCase().includes(q) || String(p.short_code || "").toLowerCase().includes(q)
        || String(p.product_id || "").toLowerCase().includes(q))
      .sort((a, b) => String(a.product_name || "").localeCompare(String(b.product_name || ""), undefined, { sensitivity: "base" }));
  }, [productList, search, kitchen]);

  const handleLogout = () => {
    navigate("/login"); // Use navigate to go to the login page
  };

  const createIndent = () => {
    navigate("/product-create");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
        const response = await axios.get(`${API_URL}/products/${org_id}`);
        const updatedData = response.data.products.map((item, index) => ({
          ...item,
          id: item.id || index + 1, // Appending a unique ID if it doesn't exist
        }));
        setLoading(false);
        // Set loading to false once data is loaded
        setProductList(updatedData); // Set the response data into state
      } catch (err) {
        //setError(err.message);   // Handle any errors
        //setLoading(false);
      }
    };

    fetchData(); // Call the function to fetch data
  }, []);

  if (loading) return <Loader />; // Show loader while data is being fetched

  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />{" "}
      {/* Show AdminAppBar */}
      <Box sx={{ mt: 4, padding: 2 }}>
        {can("M_PRODUCT", true) && (
          <Button variant="contained" color="secondary" onClick={createIndent}>
            Add Product
          </Button>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 2 }}>
          <TextField size="small" placeholder="Search name or code" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 320 } }} autoFocus
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <TextField size="small" select label="Kitchen" value={kitchen} onChange={(e) => setKitchen(e.target.value)} sx={{ width: { xs: "100%", sm: 220 } }}>
            <MenuItem value="">All kitchens</MenuItem>
            {kitchens.map((k) => <MenuItem key={k.branch_id} value={k.branch_id}>{k.branch_name}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary">{shown.length} of {productList.length} products</Typography>
        </Stack>
        <Box sx={{ mt: 1, padding: { xs: 0, sm: 2 } }}>
          <ProductTable list={shown} />
        </Box>
      </Box>
    </>
  );
};

export default ProductMaster;
