import React from "react";
import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LIGHT, Dot } from "./StockAlerts";

/** One status tile: traffic light, title, one-line summary; click opens the detail. */
export const Tile = ({ light = "green", title, summary, sub, onClick, action = "Details" }) => (
  <Card sx={{ height: "100%", borderLeft: 6, borderLeftColor: LIGHT[light].color }}>
    <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
          <Dot light={light} />
          <Typography fontWeight={700} sx={{ flexGrow: 1 }}>{title}</Typography>
          <Typography variant="caption" sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: LIGHT[light].bg, color: LIGHT[light].color, fontWeight: 700 }}>
            {LIGHT[light].label}
          </Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontSize: 17, lineHeight: 1.3 }}>{summary}</Typography>
        <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{sub || " "}</Typography>
          <Typography variant="body2" color="primary.dark" sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}>
            {action}<ChevronRightIcon fontSize="small" />
          </Typography>
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default Tile;
