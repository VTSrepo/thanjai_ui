import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Tab, Tabs } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CreateIndent from "../pages/CreateIndent";
import IndentListing from "../pages/IndentListing";
import { useLocation } from "react-router-dom";
import { useUser } from "../utilities/UserContext";
import { fetchIndents, getAllBranches } from "../utilities/service";

/*
 * Tabs by role (BRD "Indent Management"):
 *   Branch  (B): New indent · In progress (C + A, view only) · To receive (D)
 *   Kitchen (K): To accept (C) · To dispatch (A)
 *   Admin   (A): all queues, view only
 *   External customer (X): same as branch, limited to their own orders
 */
const TABS = {
  create: { label: "New indent", icon: <AddShoppingCartIcon /> },
  progress: { label: "In progress", icon: <HourglassTopIcon />, statuses: ["C", "A"], empty: "No open requests." },
  accept: { label: "To accept", icon: <ChecklistRtlIcon />, statuses: ["C"], empty: "No new requests to accept." },
  dispatch: { label: "To dispatch", icon: <LocalShippingIcon />, statuses: ["A"], empty: "Nothing waiting for dispatch." },
  receive: { label: "To receive", icon: <CallReceivedIcon />, statuses: ["D"], empty: "Nothing on the way." },
  done: { label: "Received", icon: <TaskAltIcon />, statuses: ["R"], empty: "No completed indents yet.", noBadge: true },
};

const ROLE_TABS = {
  B: ["receive", "create", "progress", "done"],
  K: ["accept", "dispatch", "done"],
  A: ["accept", "dispatch", "receive", "done"],
  X: ["receive", "create", "progress", "done"],
};

export default function NavTab() {
  const { user } = useUser();
  const role = user?.user_type || "B";
  const keys = ROLE_TABS[role] || ROLE_TABS.B;
  const requested = useLocation().state?.tab;
  const [tab, setTab] = useState(keys.includes(requested) ? requested : keys[0]);
  const [counts, setCounts] = useState({});
  const [scope, setScope] = useState(null);

  // Branch users see their own branch; kitchen users see indents sent to their kitchen.
  useEffect(() => {
    (async () => {
      if (role === "B" || role === "X") return setScope({ branch_id: user.branch_id });
      if (role === "K") {
        try {
          const branches = await getAllBranches();
          const own = branches.find((b) => b.branch_id === user.branch_id);
          return setScope(own?.branch_type === "K" ? { kitchen_id: user.branch_id } : {});
        } catch (e) {
          return setScope({});
        }
      }
      return setScope({});
    })();
  }, [role, user?.branch_id]);

  const refreshCounts = useCallback(async () => {
    if (!scope) return;
    const next = {};
    await Promise.all(
      keys
        .filter((k) => TABS[k].statuses && !TABS[k].noBadge)
        .map(async (k) => {
          try {
            next[k] = (await fetchIndents(TABS[k].statuses, scope)).length;
          } catch (e) {
            next[k] = 0;
          }
        })
    );
    setCounts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, role]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const current = useMemo(() => TABS[tab], [tab]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ position: "sticky", top: { xs: 56, sm: 64 }, zIndex: 5, bgcolor: "background.default", mx: -2, px: 1 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ "& .MuiTab-root": { minHeight: 64, fontSize: { xs: 12, sm: 14 }, px: 0.5 } }}
        >
          {keys.map((k) => (
            <Tab
              key={k}
              value={k}
              label={k === "create" && role === "X" ? "New order" : TABS[k].label}
              icon={
                <Badge color="error" badgeContent={counts[k] || 0} max={99}>
                  {TABS[k].icon}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ pt: 2 }}>
        {!scope ? null : tab === "create" ? (
          <CreateIndent
            onCreated={() => {
              refreshCounts();
              setTab("progress");
            }}
          />
        ) : (
          <IndentListing
            key={tab}
            title={current.label}
            statuses={current.statuses}
            scope={scope}
            emptyText={current.empty}
            onChanged={refreshCounts}
          />
        )}
      </Box>
    </Box>
  );
}
