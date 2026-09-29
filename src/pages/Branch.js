import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../config-global";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { useUser } from "../utilities/UserContext";
import { getAllBranches } from "../utilities/service";

const typeLabel = (t) => (t === "K" ? "Kitchen" : "Branch");

const Branch = () => {
  document.title = `Branch Master | ${CONFIG.title.name}`;
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setBranches(await getAllBranches());
      } catch (e) {
        setError("Could not load branches");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      [b.branch_id, b.branch_name, b.branch_city, b.province_code, b.legal_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [branches, search]);

  const open = (b) => navigate("/branch-form", { state: { branchId: b?.branch_id } });

  return (
    <>
      <ResponsiveAppBar onLogout={() => navigate("/login")} user={user} />
      <Box sx={{ p: 2, maxWidth: 1100, mx: "auto" }}>
        <PageHeader
          title="Branch Master"
          subtitle={`${branches.length} branches & kitchens`}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => open(null)}>
              Add
            </Button>
          }
        />
        <TextField
          fullWidth
          placeholder="Search name, ID, city, province"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, bgcolor: "background.paper" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Loader />
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
            }}
          >
            {filtered.map((b) => {
              const missingTax = b.branch_type !== "K" && !b.gst_hst_reg_no;
              return (
                <Card key={b.branch_id}>
                  <CardActionArea onClick={() => open(b)}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        {b.branch_type === "K" ? (
                          <SoupKitchenIcon color="primary" />
                        ) : (
                          <StorefrontIcon color="primary" />
                        )}
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography fontWeight={700} noWrap>
                            {b.branch_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {[b.branch_id, [b.branch_city, b.province_code].filter(Boolean).join(", ")]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                          <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.75 }}>
                            <Chip size="small" label={typeLabel(b.branch_type)} />
                            {b.ownership_type === "F" && <Chip size="small" color="primary" label="Franchise" />}
                            {b.branch_status === "I" && <Chip size="small" label="Inactive" />}
                            {missingTax && <Chip size="small" color="warning" variant="outlined" label="Tax details missing" />}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
            {!filtered.length && (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No branches match your search.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};

export default Branch;
