import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, CssBaseline, ThemeProvider } from "@mui/material";
import appTheme from "./utilities/theme";
import { UserProvider, useUser, ROLE } from "./utilities/UserContext";
import { Guard, landingFor } from "./utilities/routes";
import ToastProvider from "./components/ToastProvider";
import Loader from "./components/Loader";
import Login from "./pages/Login";

// Each screen loads only when first opened (keeps the first download small on phones)
const Home = lazy(() => import("./pages/Home"));
const Admin = lazy(() => import("./pages/Admin"));
const Reports = lazy(() => import("./pages/Reports"));
const Employee = lazy(() => import("./pages/Employee"));
const ProductForm = lazy(() => import("./pages/ProductForm"));
const ProductMaster = lazy(() => import("./pages/ProductMaster"));
const IndentMaster = lazy(() => import("./pages/IndentMaster"));
const ProductionMonitor = lazy(() => import("./pages/ProductionMonitor"));
const ProductionMonitorForm = lazy(() => import("./pages/ProductionMonitorForm"));
const TimesheetListing = lazy(() => import("./pages/TimesheetListing"));
const TimesheetForm = lazy(() => import("./pages/TimesheetForm"));
const CreateEmployeeForm = lazy(() => import("./pages/CreateEmployeeForm"));
const CreateUserForm = lazy(() => import("./pages/CreateUserForm"));
const User = lazy(() => import("./pages/User"));
const Category = lazy(() => import("./pages/Category"));
const CreateCategoryForm = lazy(() => import("./pages/CreateCategoryForm"));
const IndentReports = lazy(() => import("./pages/IndentReports"));
const Branch = lazy(() => import("./pages/Branch"));
const BranchForm = lazy(() => import("./pages/BranchForm"));
const InvoiceReport = lazy(() => import("./pages/InvoiceReport"));
const Payments = lazy(() => import("./pages/Payments"));
const MyInvoices = lazy(() => import("./pages/MyInvoices"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const RoleMaster = lazy(() => import("./pages/RoleMaster"));
const Batches = lazy(() => import("./pages/Batches"));
const Inventory = lazy(() => import("./pages/Inventory"));
const StockImport = lazy(() => import("./pages/StockImport"));
const ProductImport = lazy(() => import("./pages/ProductImport"));
const BatchReports = lazy(() => import("./pages/BatchReports"));
const OnlineOrders = lazy(() => import("./pages/online/OnlineOrders"));
const OnlineMenu = lazy(() => import("./pages/online/OnlineMenu"));
const OnlineSetup = lazy(() => import("./pages/online/OnlineSetup"));
const OnlineCustomers = lazy(() => import("./pages/online/OnlineCustomers"));
// public online shop (weekly meals) - its own login, no staff guard
const ShopHome = lazy(() => import("./pages/shop/ShopHome"));
const ShopOrder = lazy(() => import("./pages/shop/ShopOrder"));
const ShopDone = lazy(() => import("./pages/shop/ShopDone"));
const ShopLogin = lazy(() => import("./pages/shop/ShopLogin"));
const ShopAccount = lazy(() => import("./pages/shop/ShopAccount"));

const { BRANCH: B, KITCHEN: K, EXTERNAL: X } = ROLE;

// path, component, user types allowed, screens allowed (Role Master). Both empty = any logged-in user.
const ROUTES = [
  ["/home", Home, [B, X], ["HOME"]],
  ["/admin", Admin, [], ["DASHBOARD"]],
  ["/indents", IndentMaster, null, null],
  ["/change-password", ChangePassword, null, null],
  ["/production-monitor", ProductionMonitor, [K], []],
  ["/job-create", ProductionMonitorForm, [K], []],
  ["/ts", TimesheetListing, [K], ["TIMESHEET"]],
  ["/ts-create", TimesheetForm, [K], ["TIMESHEET"]],
  ["/employee", Employee, [], ["M_EMPLOYEE"]],
  ["/employee-create", CreateEmployeeForm, [], ["M_EMPLOYEE"]],
  ["/product-master", ProductMaster, [], ["M_PRODUCT"]],
  ["/product-create", ProductForm, [], ["M_PRODUCT"]],
  ["/user", User, [], ["M_USER"]],
  ["/create-user", CreateUserForm, [], ["M_USER"]],
  ["/category", Category, [], ["M_CATEGORY"]],
  ["/create-category", CreateCategoryForm, [], ["M_CATEGORY"]],
  ["/branch", Branch, [], ["M_BRANCH"]],
  ["/branch-form", BranchForm, [], ["M_BRANCH"]],
  ["/roles", RoleMaster, [], ["M_ROLE"]],
  ["/reports", Reports, [], ["R_PRODUCTION"]],
  ["/indent", IndentReports, [], ["R_INDENT"]],
  ["/invoices", InvoiceReport, [], ["R_INVOICES"]],
  ["/payments", Payments, [], ["PAYMENTS"]],
  ["/my-invoices", MyInvoices, [B, X], ["MY_INVOICES"]],
  ["/batches", Batches, [], ["BATCHES"]],
  ["/inventory", Inventory, [K], ["INVENTORY"]],
  ["/stock-import", StockImport, [], ["STOCK_IMPORT"]],
  ["/product-import", ProductImport, [], ["M_PRODUCT"]],
  ["/batch-reports", BatchReports, [], ["R_BATCH"]],
  ["/online/orders", OnlineOrders, [], ["SUB_ORDERS"]],
  ["/online/menu", OnlineMenu, [], ["SUB_SETUP"]],
  ["/online/setup", OnlineSetup, [], ["SUB_SETUP"]],
  ["/online/customers", OnlineCustomers, [], ["SUB_CUSTOMERS"]],
];

const SHOP_ROUTES = [
  ["/meals", ShopHome], ["/meals/order", ShopOrder], ["/meals/done", ShopDone], ["/meals/login", ShopLogin], ["/meals/account", ShopAccount],
];

const Start = () => {
  const { user } = useUser();
  return <Navigate to={user ? landingFor(user) : "/login"} replace />;
};

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ToastProvider>
        <UserProvider>
          <Container maxWidth={false} disableGutters>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                {SHOP_ROUTES.map(([path, Page]) => <Route key={path} path={path} element={<Page />} />)}
                {ROUTES.map(([path, Page, roles, screens]) => (
                  <Route key={path} path={path} element={<Guard roles={roles} screens={screens}><Page /></Guard>} />
                ))}
                <Route path="*" element={<Start />} />
              </Routes>
            </Suspense>
          </Container>
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
