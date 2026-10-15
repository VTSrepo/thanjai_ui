import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  Grid, IconButton, InputLabel, List, ListItemButton, ListItemText, MenuItem, Select, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { CONFIG } from "../../config-global";
import ResponsiveAppBar from "../../components/ResponsiveAppBar";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import { useToast } from "../../components/ToastProvider";
import { useUser } from "../../utilities/UserContext";
import { getSubDishes, getSubWeek, getSubWeeks, saveSubDish, saveSubWeek } from "../../utilities/service";
import { DIET, niceDate, niceDateTime } from "../../utilities/shopApi";

const WEEK = { D: ["Draft", "default"], P: ["Open for orders", "success"], C: ["Cut off", "warning"], K: ["Sent to kitchen", "primary"] };

/** Online-menu details of one dish (shared by every week). */
export const DishDialog = ({ dish, onClose, onSaved }) => {
  const toast = useToast();
  const [v, setV] = useState(null);
  useEffect(() => setV(dish ? { product_id: dish.product_id, description: dish.description || "", diet: dish.diet || "", allergens: dish.allergens || "", image_url: dish.image_url || "" } : null), [dish]);
  if (!dish || !v) return null;
  const save = async () => { try { const r = await saveSubDish(v); toast.success(r.message); onSaved(); } catch (e) { toast.error(e.message); } };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dish.product_name || dish.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Description on the menu" multiline minRows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} inputProps={{ maxLength: 500 }} />
          <FormControl>
            <InputLabel>Diet</InputLabel>
            <Select label="Diet" value={v.diet} onChange={(e) => setV({ ...v, diet: e.target.value })}>
              <MenuItem value="">Not set</MenuItem>
              {Object.entries(DIET).map(([k, d]) => <MenuItem key={k} value={k}>{d.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Allergens (comma separated)" placeholder="Milk, Nuts, Gluten" value={v.allergens} onChange={(e) => setV({ ...v, allergens: e.target.value })} />
          <TextField label="Photo link (https://…)" value={v.image_url} onChange={(e) => setV({ ...v, image_url: e.target.value })} helperText="Optional. A square or 4:3 photo looks best." />
          {v.image_url && <Box component="img" src={v.image_url} alt="" sx={{ maxHeight: 160, objectFit: "cover", borderRadius: 1 }} />}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
    </Dialog>
  );
};

const OnlineMenu = () => {
  document.title = `Weekly menu | ${CONFIG.title.name}`;
  const toast = useToast();
  const { can } = useUser();
  const canEdit = can("SUB_SETUP", true);
  const [weeks, setWeeks] = useState(null);
  const [nextDates, setNextDates] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [cur, setCur] = useState(null); // { delivery_date, status, cutoff_at, note, items }
  const [editDish, setEditDish] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadWeeks = useCallback(() => getSubWeeks().then((r) => { setWeeks(r.weeks); setNextDates(r.next_dates); }).catch((e) => toast.error(e.message)), [toast]);
  const loadDishes = useCallback(() => getSubDishes().then((r) => setDishes(r.dishes)).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => { loadWeeks(); loadDishes(); }, [loadWeeks, loadDishes]);

  const open = async (date) => {
    try {
      const r = await getSubWeek(date);
      setCur({ ...r.week, items: r.items.map((i) => ({ product_id: i.product_id, chef_pick: i.chef_pick, max_qty: i.max_qty || "" })) });
    } catch (e) { toast.error(e.message); }
  };
  const create = (nd) => setCur({ delivery_date: nd.delivery_date, cutoff_at: nd.cutoff_at, status: "D", note: "", items: [], isNew: true });
  const copyFrom = async (date) => {
    try { const r = await getSubWeek(date); setCur((c) => ({ ...c, items: r.items.map((i) => ({ product_id: i.product_id, chef_pick: i.chef_pick, max_qty: i.max_qty || "" })) })); }
    catch (e) { toast.error(e.message); }
  };
  const save = async (status) => {
    setBusy(true);
    try {
      const r = await saveSubWeek({ delivery_date: cur.delivery_date, cutoff_at: cur.cutoff_at, note: cur.note, status, items: cur.items });
      toast.success(r.message);
      await loadWeeks();
      await open(cur.delivery_date);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!weeks) return <><ResponsiveAppBar /><Loader /></>;
  const dishOf = (id) => dishes.find((d) => d.product_id === id) || { product_id: id, product_name: id };
  const locked = cur && ["C", "K"].includes(cur.status);
  const existing = new Set(weeks.map((w) => w.delivery_date));
  const setItem = (i, patch) => setCur({ ...cur, items: cur.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const move = (i) => { if (!i) return; const it = [...cur.items]; [it[i - 1], it[i]] = [it[i], it[i - 1]]; setCur({ ...cur, items: it }); };

  return (
    <>
      <ResponsiveAppBar />
      <Box sx={{ p: 2, maxWidth: 1300, mx: "auto" }}>
        <PageHeader title="Weekly menu" subtitle="Dishes customers can choose for each delivery" />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ pb: 0 }}><Typography fontWeight={700}>Deliveries</Typography></CardContent>
              <List dense>
                {weeks.map((w) => (
                  <ListItemButton key={w.delivery_date} selected={cur?.delivery_date === w.delivery_date} onClick={() => open(w.delivery_date)}>
                    <ListItemText primary={niceDate(w.delivery_date)} secondary={`${w.dishes} dishes · ${w.paid_orders} paid orders`} />
                    <Chip size="small" color={WEEK[w.status][1]} label={WEEK[w.status][0]} />
                  </ListItemButton>
                ))}
                {!weeks.length && <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>No weeks yet.</Typography>}
              </List>
              {canEdit && (
                <CardContent>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>New week</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {nextDates.filter((n) => !existing.has(n.delivery_date)).map((n) => (
                      <Button key={n.delivery_date} size="small" variant="outlined" onClick={() => create(n)}>{niceDate(n.delivery_date).split(",").slice(0, 2).join(",")}</Button>
                    ))}
                  </Stack>
                </CardContent>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            {!cur ? <Alert severity="info">Choose a delivery on the left, or create a new week.</Alert> : (
              <Card><CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>{niceDate(cur.delivery_date)}</Typography>
                  <Chip color={WEEK[cur.status][1]} label={cur.isNew ? "New" : WEEK[cur.status][0]} />
                </Stack>
                {locked && <Alert severity="info" sx={{ mb: 2 }}>This week is cut off; the menu can no longer change.</Alert>}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField fullWidth size="small" label="Order cutoff" type="datetime-local" InputLabelProps={{ shrink: true }} disabled={locked || !canEdit}
                      value={(cur.cutoff_at || "").replace(" ", "T")} onChange={(e) => setCur({ ...cur, cutoff_at: e.target.value.replace("T", " ") })}
                      helperText={cur.cutoff_at ? niceDateTime(cur.cutoff_at) : ""} />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField fullWidth size="small" label="Note (internal)" value={cur.note || ""} disabled={locked || !canEdit} onChange={(e) => setCur({ ...cur, note: e.target.value })} />
                  </Grid>
                </Grid>
                {canEdit && !locked && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                    <Autocomplete sx={{ flexGrow: 1 }} size="small" options={dishes.filter((d) => d.sub_enabled === "Y" && !cur.items.some((i) => i.product_id === d.product_id))}
                      noOptionsText='No more dishes. Tick "Available on the online weekly menu" in Product Master to add more.'
                      getOptionLabel={(d) => d.product_name} value={null} blurOnSelect
                      onChange={(e, d) => d && setCur({ ...cur, items: [...cur.items, { product_id: d.product_id, chef_pick: "N", max_qty: "" }] })}
                      renderInput={(p) => <TextField {...p} label="Add a dish" helperText={`${dishes.filter((d) => d.sub_enabled === "Y").length} products are marked for the online menu in Product Master`} />} />
                    {!cur.items.length && weeks.length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Copy dishes from</InputLabel>
                        <Select label="Copy dishes from" value="" onChange={(e) => copyFrom(e.target.value)}>
                          {weeks.filter((w) => w.dishes).map((w) => <MenuItem key={w.delivery_date} value={w.delivery_date}>{niceDate(w.delivery_date)}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                )}
                {cur.items.map((it, i) => {
                  const d = dishOf(it.product_id);
                  return (
                    <Stack key={it.product_id} direction="row" alignItems="center" spacing={1} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography fontWeight={600} noWrap>{d.product_name}</Typography>
                          {DIET[d.diet] && <Chip size="small" variant="outlined" color={DIET[d.diet].color} label={DIET[d.diet].label} />}
                        </Stack>
                        <Typography variant="caption" color={d.description && d.diet ? "text.secondary" : "warning.dark"} noWrap display="block">
                          {!d.diet ? "Diet (Veg / Non-veg) not set – " : ""}{d.description || "No description yet – add one so customers know what it is"}
                        </Typography>
                      </Box>
                      <Tooltip title="Used for customers who don't choose"><Stack alignItems="center">
                        <Switch size="small" checked={it.chef_pick === "Y"} disabled={locked || !canEdit} onChange={(e) => setItem(i, { chef_pick: e.target.checked ? "Y" : "N" })} />
                        <Typography variant="caption">Chef's pick</Typography>
                      </Stack></Tooltip>
                      {canEdit && <IconButton size="small" aria-label="Edit dish details" onClick={() => setEditDish(d)}><EditIcon fontSize="small" /></IconButton>}
                      {canEdit && !locked && <IconButton size="small" aria-label="Move up" disabled={!i} onClick={() => move(i)}><ArrowUpwardIcon fontSize="small" /></IconButton>}
                      {canEdit && !locked && <IconButton size="small" aria-label="Remove" onClick={() => setCur({ ...cur, items: cur.items.filter((_, k) => k !== i) })}><DeleteOutlineIcon fontSize="small" /></IconButton>}
                    </Stack>
                  );
                })}
                {!cur.items.length && <Typography color="text.secondary">No dishes yet.</Typography>}
                {canEdit && !locked && (
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                    {cur.status !== "P" && <Button disabled={busy} onClick={() => save("D")}>Save draft</Button>}
                    <Button variant="contained" disabled={busy || !cur.items.length} onClick={() => save("P")}>{cur.status === "P" ? "Save changes" : "Publish menu"}</Button>
                  </Stack>
                )}
              </CardContent></Card>
            )}
          </Grid>
        </Grid>
      </Box>
      <DishDialog dish={editDish} onClose={() => setEditDish(null)} onSaved={() => { setEditDish(null); loadDishes(); }} />
    </>
  );
};

export default OnlineMenu;
