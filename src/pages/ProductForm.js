import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Grid2,
  Typography,
  Box,
  Container,
  Alert,
} from "@mui/material";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import {API_URL} from '../utilities/service'
import { useUser } from "../utilities/UserContext";
import { getBu, referenceRecord, getCategoryList, getAllBranches, getProductSettings, saveProductSettings } from "../utilities/service";

function ProductForm() {
  const location = useLocation(); // Access the location object
   const { user, can } = useUser();
  const canEdit = can("M_PRODUCT", true);
  const { selectedRow } = location.state || {}; // Extract the selected row from location state
  const [, setLoading] = useState(false);
  const navigate = useNavigate();
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
  const [bu, setBu] = useState([]);
  const [uom, setUOM] = useState([]);
  const [categoryList, setcategoryList] = useState([]);
  const [formData, setFormData] = useState({
    product_id: null,
    product_name: null,
    uom: null,
    bu_id: null,
    category_code:null,
    stock_in_hand: null,
    min_stock: null,
    max_stock: null,
    reorder_level: null,
    billing_flag: null,
    product_price: null,
    gst_value: null,
    prod_name_invoice: null,
    account_code: null,
    org_id: org_id,
    branch_id: branch_id,
  });
  // Batch & stock settings (saved separately after the product)
  const [batch, setBatch] = useState({ short_code: "", producing_branch_id: "", shelf_life_days: "", default_taxable: "Y" });
  const [kitchens, setKitchens] = useState([]);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    getAllBranches().then((b) => setKitchens(b.filter((x) => x.branch_type === "K"))).catch(() => {});
    if (selectedRow?.product_id) {
      getProductSettings().then((r) => {
        const p = (r.products || []).find((x) => x.product_id === selectedRow.product_id);
        if (p) setBatch({ short_code: p.short_code || "", producing_branch_id: p.producing_branch_id || "",
          shelf_life_days: p.shelf_life_days ?? "", default_taxable: p.default_taxable || "Y" });
      }).catch(() => {});
    }
  }, [selectedRow]);
  const [errors, setErrors] = useState({ min_stock: "", max_stock: "",product_price: "",gst_value: "",stock_in_hand: "",reorder_level: "" });

  

  useEffect(() => {
    const getBuData = async () => {
      try {
        const result = await getBu();
        setBu(result.businesses);
      } catch (err) {
        console.log(err);
      }
    };

    const getUOM  =  async() =>{
      try {
        const result = await referenceRecord('UOM');
        setUOM(result.refences);
      } catch (err) {
        console.log(err);
      }
    }

    const getCategory  =  async() =>{
      try {
        const result = await getCategoryList('UOM');
        setcategoryList(result.categories);
      } catch (err) {
        console.log(err);
      }
    }

    getBuData();
    getUOM();
    getCategory();
  }, []);

  useEffect(() => {   
    if (selectedRow) {
      setFormData({
        product_id: selectedRow.product_id,
        product_name: selectedRow.product_name,
        uom: selectedRow.uom,
        bu_id: selectedRow.bu_id,
        category_code:selectedRow.category_code,
        stock_in_hand: selectedRow.stock_in_hand,
        min_stock: selectedRow.min_stock,
        max_stock: selectedRow.max_stock,
        reorder_level: selectedRow.reorder_level,
        billing_flag: selectedRow.billing_flag,
        product_price: selectedRow.product_price,
        gst_value: selectedRow.gst_value,
        prod_name_invoice: selectedRow.prod_name_invoice,
        account_code: selectedRow.account_code,
        org_id: org_id,
        branch_id: selectedRow.branch_id || branch_id,
      });
    }    
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intended to run once on open
  }, [selectedRow]);

  const handleLogout = () => {
    navigate("/login");
  }; 
  

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numberValue = Number(value);

    if (numberValue < 0) {
      setErrors((prev) => ({ ...prev, [name]: "Value must be at least 1" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };  

  const handleSave = async () => {
    const fieldsToCheck = [
      "gst_value",
      "max_stock",
      "min_stock",
      "product_price",
      "reorder_level",
      "stock_in_hand",
    ];
    
    const updatedFormData = { ...formData };
    
    fieldsToCheck.forEach((key) => {
      if (
        updatedFormData[key] === null ||
        updatedFormData[key] === "" ||
        updatedFormData[key] === undefined
      ) {
        updatedFormData[key] = 0;
      }
    });
    setLoading(true);
    setSaveError("");
    // a new product belongs to its producing kitchen
    if (!updatedFormData.product_id && batch.producing_branch_id) updatedFormData.branch_id = batch.producing_branch_id;
    try {
      const response = await axios.post(`${API_URL}/product`, { product: updatedFormData });
      const pid = updatedFormData.product_id || response.data?.product?.product_id;
      if (pid) {
        await saveProductSettings({ product_id: pid, ...batch, reorder_level: updatedFormData.reorder_level });
      }
      setLoading(false);
      navigate("/product-master");
    } catch (e) {
      setLoading(false);
      const d = e.response?.data;
      setSaveError(e.response?.status === 403 ? "Your role can view products but not change them. Ask an admin to give your role \"Product master – Edit\" in Master → Role." : d?.message || e.message || "Could not save the product");
    }
  };

  const handleCancel = () => {
    navigate("/product-master");
  };
  return (
    <>
      <ResponsiveAppBar onLogout={handleLogout} user={user} />
      <Container maxWidth="sm">
        <Box mt={4}>
          {!canEdit && (
            <Alert severity="info" sx={{ mb: 2 }}>
              View only – your role can see products but not change them. An admin can give your role "Product master – Edit" in Master → Role.
            </Alert>
          )}
          <Typography variant="h5" gutterBottom>
            {!canEdit ? "Product" : selectedRow ? "Edit product" : "New product"}
          </Typography>
          <form className="example-form" noValidate>
            <Grid2 container spacing={2}>
              <Grid2 item size={12}>
                <TextField
                  label="Product Name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid2>
              {uom && <Grid2 item size={12}>
              <FormControl fullWidth required>
                  <InputLabel>UOM</InputLabel>
                  <Select
                    label="UOM"
                    name="uom"
                    value={formData.uom  || ''}
                    onChange={handleChange}
                  >
                    {uom?.map((mode) => (
                      <MenuItem key={mode.ref_code} value={mode.ref_code}>
                        {mode.ref_desc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>}

              {categoryList && <Grid2 item size={12}>
              <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category Code"
                    name="category_code"
                    value={formData.category_code || ''}
                    onChange={handleChange}
                  >
                    {categoryList?.map((mode) => (
                      <MenuItem key={mode.category_code} value={mode.category_code}>
                        {mode.category_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>}
              <Grid2 item size={12}>
                <FormControl fullWidth required>
                  <InputLabel>BU</InputLabel>
                  <Select
                    label="BU"
                    name="bu_id"
                    value={formData.bu_id || ''}
                    onChange={handleChange}                    
                  >
                    {bu?.map((mode) => (
                      <MenuItem key={mode.bu_id} value={mode.bu_id}>
                        {mode.bu_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              <Grid2 item size={12}>
                <TextField
                  label="Stock In Hand"
                  name="stock_in_hand"
                  value={formData.stock_in_hand}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.stock_in_hand}
                  helperText={errors.stock_in_hand}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Min"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.min_stock}
                  helperText={errors.min_stock}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Max"
                  name="max_stock"
                  value={formData.max_stock}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.max_stock}
                  helperText={errors.max_stock}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Reorder Level"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.reorder_level}
                  helperText={errors.reorder_level}
                />
              </Grid2>              

              <Grid2 item size={12}>
                <TextField
                  label="Product Price"
                  name="product_price"
                  value={formData.product_price}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.product_price}
                  helperText={errors.product_price}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="GST"
                  name="gst_value"
                  value={formData.gst_value}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  error={!!errors.gst_value}
                  helperText={errors.gst_value}
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Name for Invoice"
                  name="prod_name_invoice"
                  value={formData.prod_name_invoice}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid2>
              <Grid2 item size={12}>
                <TextField
                  label="Account Code"
                  name="account_code"
                  value={formData.account_code}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid2>
              <Grid2 item size={12}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>Batch & stock</Typography>
                <Typography variant="body2" color="text.secondary">
                  Products with a short code are batch-tracked: batches are entered for them and dispatch picks from those batches.
                </Typography>
              </Grid2>
              <Grid2 item size={{ xs: 12, sm: 4 }}>
                <TextField label="Short code" value={batch.short_code} fullWidth helperText="2-3 characters, e.g. VD"
                  onChange={(e) => setBatch({ ...batch, short_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) })} />
              </Grid2>
              <Grid2 item size={{ xs: 12, sm: 8 }}>
                <TextField select label="Producing branch" value={batch.producing_branch_id} fullWidth
                  onChange={(e) => setBatch({ ...batch, producing_branch_id: e.target.value })}
                  helperText="Kitchen that makes it; its short code starts the batch number">
                  <MenuItem value="">Not set</MenuItem>
                  {kitchens.map((k) => <MenuItem key={k.branch_id} value={k.branch_id}>{k.branch_name}{k.short_code ? ` (${k.short_code})` : ""}</MenuItem>)}
                </TextField>
              </Grid2>
              <Grid2 item size={{ xs: 12, sm: 6 }}>
                <TextField label="Shelf life (days)" value={batch.shelf_life_days} fullWidth helperText="Best-before = made date + days"
                  onChange={(e) => setBatch({ ...batch, shelf_life_days: e.target.value.replace(/\D/g, "").slice(0, 4) })} inputProps={{ inputMode: "numeric" }} />
              </Grid2>
              <Grid2 item size={{ xs: 12, sm: 6 }}>
                <TextField select label="Default tax on invoices" value={batch.default_taxable} fullWidth
                  onChange={(e) => setBatch({ ...batch, default_taxable: e.target.value })} helperText="Admin can still change it per invoice">
                  <MenuItem value="Y">Taxable (GST/QST)</MenuItem>
                  <MenuItem value="N">Non-taxable</MenuItem>
                </TextField>
              </Grid2>
              {saveError && <Grid2 item size={12}><Alert severity="error">{saveError}</Alert></Grid2>}
            </Grid2>
            <div style={{ marginTop: 20 }}>
              <Button
                variant="contained"
                color="success"
                disabled={!canEdit || !formData.product_name || !formData.category_code || !formData.uom|| !formData.bu_id || Number(formData.min_stock) < 0 ||
                  Number(formData.max_stock) < 0 || Number(formData.gst_value) < 0 || Number(formData.product_price) < 0 || Number(formData.stock_in_hand) < 0 || Number(formData.reorder_level) < 0 }
                onClick={handleSave}
              >
                Save
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={handleCancel}
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Box>
      </Container>
    </>
  );
}

export default ProductForm;
