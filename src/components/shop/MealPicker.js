import React from "react";
import { Box, Card, CardContent, CardMedia, Chip, Grid, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SpaIcon from "@mui/icons-material/Spa";
import { DIET } from "../../utilities/shopApi";

export const DishInfo = ({ m }) => (
  <>
    <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: "wrap", rowGap: 0.5 }}>
      {DIET[m.diet] && <Chip size="small" color={DIET[m.diet].color} variant="outlined" label={DIET[m.diet].label} />}
      {m.chef_pick === "Y" && <Chip size="small" variant="outlined" label="Chef's pick" />}
    </Stack>
    <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>{String(m.name || "").toLowerCase()}</Typography>
    {m.description && <Typography variant="body2" color="text.secondary">{m.description}</Typography>}
    {m.allergens && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Contains: {m.allergens}</Typography>}
  </>
);

/** Weekly menu as cards. With `counts` + `onChange` it becomes a picker that stops at `meals`. */
const MealPicker = ({ menu, counts, onChange, meals, diet }) => {
  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0;
  const list = diet ? menu.filter((m) => !diet || m.diet === diet) : menu;
  const set = (id, n) => onChange({ ...counts, [id]: Math.max(0, n) });
  return (
    <Grid container spacing={2}>
      {list.map((m) => {
        const n = counts?.[m.product_id] || 0;
        return (
          <Grid item xs={12} sm={6} md={4} key={m.product_id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderColor: n ? "primary.main" : undefined, borderWidth: n ? 2 : 1 }}>
              {m.image_url ? (
                <CardMedia component="img" height="150" image={m.image_url} alt={m.name} sx={{ objectFit: "cover" }} />
              ) : (
                <Box sx={{ height: 90, bgcolor: "#fff1df", display: "flex", alignItems: "center", justifyContent: "center", color: "primary.dark" }} aria-hidden>
                  {m.diet === "V" ? <SpaIcon fontSize="large" /> : <RestaurantIcon fontSize="large" />}
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}><DishInfo m={m} /></CardContent>
              {counts && (
                <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ px: 2, pb: 1.5 }}>
                  <IconButton aria-label={`Remove ${m.name}`} onClick={() => set(m.product_id, n - 1)} disabled={!n}><RemoveIcon /></IconButton>
                  <Typography fontWeight={700} sx={{ minWidth: 24, textAlign: "center" }}>{n}</Typography>
                  <IconButton aria-label={`Add ${m.name}`} color="primary" onClick={() => set(m.product_id, n + 1)} disabled={total >= meals}><AddIcon /></IconButton>
                </Stack>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default MealPicker;
