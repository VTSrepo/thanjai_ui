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

const { ADMIN: A, BRANCH: B, KITCHEN: K, EXTERNAL: X } = ROLE;

// path, component, allowed roles (null = any logged-in user)
const ROUTES = [
  ["/home", Home, [B, X]],
  ["/admin", Admin, [A]],
  ["/indents", IndentMaster, null],
  ["/change-password", ChangePassword, null],
  ["/production-monitor", ProductionMonitor, [A, K]],
  ["/job-create", ProductionMonitorForm, [A, K]],
  ["/ts", TimesheetListing, [A, K]],
  ["/ts-create", TimesheetForm, [A, K]],
  ["/employee", Employee, [A]],
  ["/employee-create", CreateEmployeeForm, [A]],
  ["/product-master", ProductMaster, [A]],
  ["/product-create", ProductForm, [A]],
  ["/user", User, [A]],
  ["/create-user", CreateUserForm, [A]],
  ["/category", Category, [A]],
  ["/create-category", CreateCategoryForm, [A]],
  ["/branch", Branch, [A]],
  ["/branch-form", BranchForm, [A]],
  ["/reports", Reports, [A]],
  ["/indent", IndentReports, [A]],
  ["/invoices", InvoiceReport, [A]],
  ["/payments", Payments, [A]],
  ["/my-invoices", MyInvoices, [B, X]],
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
                {ROUTES.map(([path, Page, roles]) => (
                  <Route key={path} path={path} element={<Guard roles={roles}><Page /></Guard>} />
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
