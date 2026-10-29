import React, { useEffect, useRef } from "react";
import { Box, Tooltip } from "@mui/material";

// Dining-room floor plan. Tables are placed by % (pos_x / pos_y = centre), so the plan scales with the screen.
// state per table decides the look:
//   free · selected · taken · disabled (not suitable / staff only) · booked · arrived · noshow · blocked
const HATCH = (a, b) => `repeating-linear-gradient(45deg, ${a} 0 4px, ${b} 4px 8px)`;
const GRAD = "linear-gradient(135deg,#FCB12A 0%,#FF8A00 100%)";

const LOOK = {
  dark: {
    floor: "#181818", grid: "rgba(255,255,255,.05)", line: "rgba(255,255,255,.12)", label: "#6a6a6a", chair: "#3a3a3a",
    free: { bg: "rgba(59,178,115,.14)", border: "#3BB273", color: "#fff", chair: "rgba(59,178,115,.55)" },
    selected: { bg: GRAD, border: "transparent", color: "#fff", chair: "#FCB12A", glow: "0 6px 18px rgba(255,138,0,.45)" },
    taken: { bg: HATCH("#2c2c2c", "#242424"), border: "#3d3d3d", color: "#666", chair: "#333" },
    disabled: { bg: "#202020", border: "#4a4a4a", color: "#777", chair: "#2e2e2e", dashed: true, opacity: 0.5 },
  },
  light: {
    floor: "#fbfaf8", grid: "rgba(0,0,0,.05)", line: "rgba(0,0,0,.15)", label: "#9a9a9a", chair: "#d6d6d6",
    free: { bg: "#ecf8f1", border: "#3BB273", color: "#1d5c3a", chair: "#9ad6b4" },
    selected: { bg: GRAD, border: "transparent", color: "#fff", chair: "#FCB12A", glow: "0 6px 18px rgba(255,138,0,.35)" },
    taken: { bg: HATCH("#eeeeee", "#e4e4e4"), border: "#bdbdbd", color: "#888", chair: "#d0d0d0" },
    disabled: { bg: "#f5f5f5", border: "#c8c8c8", color: "#aaa", chair: "#e2e2e2", dashed: true, opacity: 0.6 },
    booked: { bg: "#fff1de", border: "#ff8a00", color: "#8a4a00", chair: "#ffc078" },
    arrived: { bg: "#e3f0fd", border: "#1976d2", color: "#0d3c73", chair: "#90bdf0" },
    noshow: { bg: "#fdeaea", border: "#d32f2f", color: "#8e1c1c", chair: "#f0a5a5" },
    blocked: { bg: HATCH("#efe3f5", "#e6d5ef"), border: "#7b1fa2", color: "#5b1478", chair: "#cfa8e0" },
  },
};

const Chairs = ({ n, side, color }) => {
  const horizontal = side === "top" || side === "bottom";
  const pos = {
    top: { bottom: "100%", left: 0, right: 0, mb: "3px", flexDirection: "row" },
    bottom: { top: "100%", left: 0, right: 0, mt: "3px", flexDirection: "row" },
    left: { right: "100%", top: 0, bottom: 0, mr: "3px", flexDirection: "column" },
    right: { left: "100%", top: 0, bottom: 0, ml: "3px", flexDirection: "column" },
  }[side];
  return (
    <Box sx={{ position: "absolute", display: "flex", justifyContent: "space-evenly", alignItems: "center", ...pos, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => (
        <Box key={i} sx={{ width: horizontal ? 14 : 8, height: horizontal ? 8 : 14, borderRadius: "5px", bgcolor: color }} />
      ))}
    </Box>
  );
};

const FloorMap = ({ tables, decor = [], stateOf, onTableClick, tipOf, captionOf, dark = false, minWidth = { xs: 560, sm: 680 } }) => {
  const L = dark ? LOOK.dark : LOOK.light;
  const scroller = useRef(null);
  const selectedKey = tables.filter((t) => stateOf(t) === "selected").map((t) => t.table_id).join(",");
  // phones: the plan scrolls sideways - bring the chosen tables into view
  useEffect(() => {
    const el = scroller.current;
    if (!el || !selectedKey || el.scrollWidth <= el.clientWidth) return;
    const first = el.querySelector('[aria-pressed="true"]');
    if (!first) return;
    const box = el.getBoundingClientRect();
    const r = first.getBoundingClientRect();
    if (r.left < box.left || r.right > box.right) el.scrollTo({ left: el.scrollLeft + r.left - box.left - box.width / 2 + r.width / 2, behavior: "smooth" });
  }, [selectedKey]);
  return (
    <Box ref={scroller} sx={{ overflowX: "auto", borderRadius: 3, border: 1, borderColor: dark ? "rgba(255,255,255,.08)" : "divider", WebkitOverflowScrolling: "touch" }}>
      <Box sx={{
        position: "relative", minWidth, width: "100%", aspectRatio: "1280 / 875",
        background: `radial-gradient(circle at 1px 1px, ${L.grid} 1px, transparent 0) 0 0 / 22px 22px, ${L.floor}`,
      }}>
        {decor.map((d) => (
          <Box key={d.label} sx={{
            position: "absolute", left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%`,
            border: d.kind === "entrance" ? `2px dashed ${L.line}` : "none",
            background: d.kind === "block" ? HATCH(dark ? "#222" : "#efefef", dark ? "#1d1d1d" : "#e8e8e8") : "transparent",
            borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center",
            color: d.kind === "entrance" ? "#FF8A00" : L.label, fontSize: 10, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase",
          }}>{d.label}</Box>
        ))}
        {tables.map((t) => {
          const st = stateOf(t) || "disabled";
          const s = L[st] || L.disabled;
          const clickable = !!onTableClick && !["taken", "disabled"].includes(st);
          const perSide = Math.ceil(t.seats / 2);
          const sides = t.orient === "V" ? ["left", "right"] : ["top", "bottom"];
          const caption = captionOf ? captionOf(t) : null;
          const box = (
            <Box
              component={onTableClick ? "button" : "div"}
              type={onTableClick ? "button" : undefined}
              aria-disabled={onTableClick && !clickable ? true : undefined}
              tabIndex={onTableClick && !clickable ? -1 : undefined}
              onClick={clickable ? () => onTableClick(t) : undefined}
              aria-label={`Table ${t.table_id}, ${t.seats} chairs, ${st}`}
              aria-pressed={st === "selected" ? true : undefined}
              sx={{
                position: "absolute", left: `${t.pos_x}%`, top: `${t.pos_y}%`, width: `${t.width}%`, height: `${t.height}%`,
                transform: "translate(-50%, -50%)", p: 0, m: 0, font: "inherit",
                background: s.bg, border: `1.5px ${s.dashed ? "dashed" : "solid"} ${s.border}`, color: s.color,
                borderRadius: t.seats <= 2 ? "999px" : "10px", boxShadow: s.glow || "none", opacity: s.opacity || 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1,
                cursor: clickable ? "pointer" : onTableClick ? "not-allowed" : "default", transition: "transform .15s, box-shadow .2s",
                "&:hover": clickable ? { transform: "translate(-50%, -50%) scale(1.06)" } : {},
                "&:focus-visible": { outline: "2px solid #FCB12A", outlineOffset: 3 },
              }}
            >
              <Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>{t.table_id}</Box>
              <Box component="span" sx={{ fontSize: 9, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", px: 0.25, textOverflow: "ellipsis" }}>
                {caption || (t.width < 6 ? `${t.seats}` : `${t.seats} seats`)}
              </Box>
              <Chairs n={perSide} side={sides[0]} color={s.chair} />
              <Chairs n={t.seats - perSide} side={sides[1]} color={s.chair} />
            </Box>
          );
          const tip = tipOf ? tipOf(t, st) : null;
          return tip ? <Tooltip key={t.table_id} title={tip} arrow placement="top">{box}</Tooltip> : <React.Fragment key={t.table_id}>{box}</React.Fragment>;
        })}
      </Box>
    </Box>
  );
};

export default FloorMap;
