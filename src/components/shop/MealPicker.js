import React from "react";
import { Box, Card, CardContent, CardMedia, Chip, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SpaIcon from "@mui/icons-material/Spa";
import StarIcon from "@mui/icons-material/Star";
import { DIET, allowedIn, cad, isFixed, unitPrice } from "../../utilities/shopApi";

export const Premium = () => <Chip size="small" icon={<StarIcon sx={{ fontSize: 14 }} />} label="Premium" sx={{ bgcolor: "#fff3d6", color: "#8a5a00", "& .MuiChip-icon": { color: "#d39a00" } }} />;

export const DishInfo = ({ m }) => (
  <>
    <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: "wrap", rowGap: 0.5 }}>
      {DIET[m.diet] && <Chip size="small" color={DIET[m.diet].color} variant="outlined" label={DIET[m.diet].label} />}
      {m.costly === "Y" && <Premium />}
      {m.chef_pick === "Y" && <Chip size="small" variant="outlined" label="Chef's pick" />}
    </Stack>
    <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>{String(m.name || "").toLowerCase()}</Typography>
    {m.description && <Typography variant="body2" color="text.secondary">{m.description}</Typography>}
    {m.allergens && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Contains: {m.allergens}</Typography>}
  </>
);

export const PriceTag = ({ plan, m, size = "body1" }) => {
  if (isFixed(plan)) return null; // Veg / Non-Veg: one weekly price, any dish
  const p = unitPrice(plan, m);
  if (p === null) return null;
  const off = plan && Number(m.price) > p;
  return (
    <Stack direction="row" spacing={0.75} alignItems="baseline">
      <Typography variant={size} fontWeight={800}>{cad(p)}</Typography>
      {off && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>{cad(m.price)}</Typography>}
    </Stack>
  );
};

export const DishImage = ({ m, height = 150 }) => (m.image_url ? (
  <CardMedia component="img" height={height} image={m.image_url} alt={m.name} sx={{ objectFit: "cover" }} />
) : (
  <Box sx={{ height: Math.round(height * 0.6), background: m.diet === "V" ? "linear-gradient(135deg,#eef7e8,#fff6e5)" : "linear-gradient(135deg,#fdeee6,#fff6e5)", display: "flex", alignItems: "center", justifyContent: "center", color: m.diet === "V" ? "#2e7d32" : "#c25400" }} aria-hidden>
    {m.diet === "V" ? <SpaIcon fontSize="large" /> : <RestaurantIcon fontSize="large" />}
  </Box>
));

/**
 * Weekly menu as cards. With `plan` only the dishes of that plan are shown, priced with its discount.
 * With `counts` + `onChange` it becomes a picker that stops at `meals` and at the plan's premium-dish limit.
 */
const MealPicker = ({ menu, counts, onChange, meals, diet, plan }) => {
  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0;
  const costly = counts ? menu.filter((m) => m.costly === "Y").reduce((n, m) => n + (counts[m.product_id] || 0), 0) : 0;
  const cap = plan && plan.max_costly !== null && plan.max_costly !== undefined ? plan.max_costly : Infinity;
  const list = menu.filter((m) => allowedIn(plan, m) && (!diet || m.diet === diet || (diet === "N" && m.diet === "E")) && (!plan || unitPrice(plan, m) !== null));
  const set = (id, n) => onChange({ ...counts, [id]: Math.max(0, n) });
  if (!list.length) return <Typography color="text.secondary">No dishes for this plan on this week's menu yet.</Typography>;
  return (
    <Grid container spacing={2}>
      {list.map((m) => {
        const n = counts?.[m.product_id] || 0;
        const premiumFull = m.costly === "Y" && costly >= cap;
        const addDisabled = total >= meals || premiumFull;
        return (
          <Grid item xs={12} sm={6} md={4} key={m.product_id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderColor: n ? "primary.main" : undefined, borderWidth: n ? 2 : 1 }}>
              <DishImage m={m} />
              <CardContent sx={{ flexGrow: 1 }}><DishInfo m={m} /></CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pb: 1.5 }}>
                <Box sx={{ flexGrow: 1 }}><PriceTag plan={plan} m={m} /></Box>
                {counts && (
                  <>
                    <IconButton aria-label={`Remove ${m.name}`} onClick={() => set(m.product_id, n - 1)} disabled={!n}><RemoveIcon /></IconButton>
                    <Typography fontWeight={700} sx={{ minWidth: 24, textAlign: "center" }}>{n}</Typography>
                    <Tooltip title={premiumFull && total < meals ? `Up to ${cap} premium dish${cap === 1 ? "" : "es"} in this plan` : ""}>
                      <span><IconButton aria-label={`Add ${m.name}`} color="primary" onClick={() => set(m.product_id, n + 1)} disabled={addDisabled}><AddIcon /></IconButton></span>
                    </Tooltip>
                  </>
                )}
              </Stack>
              {counts && premiumFull && !n && total < meals && (
                <Typography variant="caption" sx={{ px: 2, pb: 1, mt: -1, color: "#8a5a00" }}>Premium limit reached ({cap} per week)</Typography>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default MealPicker;
