import axios from "axios";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export const API_URL = process.env.REACT_APP_MODE  === "development" ?process.env.REACT_APP_API_URL_DEV:process.env.REACT_APP_API_URL_PROD;

export const getBranchLists = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/branches/TR`
    );
    return response.data; 
  } catch (error) {
    throw error; 
  }
};

const currentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch (e) {
    return {};
  }
};

// Branch Master (all branches & kitchens of the org, optional branch_type filter: B | K)
export const getAllBranches = async (branchType) => {
  const org_id = currentUser().org_id || "TR";
  const qs = branchType ? `?branch_type=${encodeURIComponent(branchType)}` : "";
  const response = await axios.get(`${API_URL}/branches/${encodeURIComponent(org_id)}${qs}`);
  return response.data?.branches || [];
};

export const getBranch = async (branchId) => {
  const org_id = currentUser().org_id || "TR";
  const response = await axios.get(
    `${API_URL}/branch/${encodeURIComponent(org_id)}/${encodeURIComponent(branchId)}`
  );
  return response.data?.branch;
};

// Creates when branch.branch_id is empty, otherwise updates. Throws with server message on failure.
export const saveBranch = async (branch) => {
  const u = currentUser();
  try {
    const response = await axios.post(`${API_URL}/branch`, {
      user_id: u.user_id,
      branch: { ...branch, org_id: u.org_id || "TR" },
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Could not save branch");
  }
};

// ---- Invoicing ----
const apiError = (err, fallback) => new Error(err.response?.data?.message || fallback);

// Indents in a date range (+ optional ordering branch) with invoice or estimated amounts
export const getInvoiceReport = async ({ from_date, to_date, branch_id }) => {
  const org_id = currentUser().org_id || "TR";
  const qs = new URLSearchParams({ from_date, to_date, ...(branch_id ? { branch_id } : {}) }).toString();
  try {
    const res = await axios.get(`${API_URL}/invoices/${encodeURIComponent(org_id)}?${qs}`);
    return res.data?.indents || [];
  } catch (err) {
    throw apiError(err, "Could not load indents");
  }
};

// Creates (or returns the existing) invoice for a received indent
export const generateInvoice = async (indent_number) => {
  const u = currentUser();
  try {
    const res = await axios.post(`${API_URL}/invoice/generate`, {
      org_id: u.org_id || "TR",
      indent_number,
      user_id: u.user_id,
    });
    return res.data.invoice;
  } catch (err) {
    throw apiError(err, "Could not generate the invoice");
  }
};

export const getInvoice = async (invoice_number) => {
  const org_id = currentUser().org_id || "TR";
  try {
    const res = await axios.get(`${API_URL}/invoice/${encodeURIComponent(org_id)}/${encodeURIComponent(invoice_number)}`);
    return res.data.invoice;
  } catch (err) {
    throw apiError(err, "Could not load the invoice");
  }
};

// ---- Passwords ----
export const changePassword = async (current_pwd, new_pwd) => {
  try {
    return (await axios.post(`${API_URL}/change-password`, { current_pwd, new_pwd })).data;
  } catch (err) {
    throw apiError(err, "Could not change the password");
  }
};

export const resetUserPassword = async (user_id, temp_pwd) => {
  try {
    return (await axios.post(`${API_URL}/users/reset-password`, { user_id, temp_pwd })).data;
  } catch (err) {
    throw apiError(err, "Could not reset the password");
  }
};

// ---- Payments & receivables ----
const orgId = () => encodeURIComponent(currentUser().org_id || "TR");

// status: open | overdue | paid | all
export const getReceivables = async ({ branch_id, status = "open", from_date, to_date } = {}) => {
  const qs = new URLSearchParams({ status, ...(branch_id ? { branch_id } : {}),
    ...(from_date ? { from_date } : {}), ...(to_date ? { to_date } : {}) }).toString();
  try {
    return (await axios.get(`${API_URL}/receivables/${orgId()}?${qs}`)).data?.invoices || [];
  } catch (err) {
    throw apiError(err, "Could not load invoices");
  }
};

export const getReceivablesSummary = async (branch_id) => {
  const qs = branch_id ? `?branch_id=${encodeURIComponent(branch_id)}` : "";
  try {
    return (await axios.get(`${API_URL}/receivables-summary/${orgId()}${qs}`)).data;
  } catch (err) {
    throw apiError(err, "Could not load the summary");
  }
};

export const getInvoicePayments = async (invoice_number) => {
  try {
    return (await axios.get(`${API_URL}/invoice-payments/${orgId()}/${encodeURIComponent(invoice_number)}`)).data;
  } catch (err) {
    throw apiError(err, "Could not load payments");
  }
};

export const recordPayment = async (payload) => {
  try {
    return (await axios.post(`${API_URL}/payment`, payload)).data;
  } catch (err) {
    throw apiError(err, "Could not record the payment");
  }
};

export const voidPayment = async (payment_id, reason) => {
  try {
    return (await axios.post(`${API_URL}/payment/void`, { payment_id, reason })).data;
  } catch (err) {
    throw apiError(err, "Could not void the payment");
  }
};

export const changeInvoiceTerms = async (invoice_number, credit_term) => {
  try {
    return (await axios.post(`${API_URL}/invoice/terms`, { invoice_number, credit_term })).data;
  } catch (err) {
    throw apiError(err, "Could not change the terms");
  }
};

// ---- Invoice setup (admin, between kitchen accept and dispatch) ----
export const getInvoiceSetup = async (indent_number) => {
  const org_id = currentUser().org_id || "TR";
  try {
    const res = await axios.get(`${API_URL}/invoice-setup/${encodeURIComponent(org_id)}/${encodeURIComponent(indent_number)}`);
    return res.data.setup;
  } catch (err) {
    throw apiError(err, "Could not load the invoice settings");
  }
};

export const saveInvoiceSetup = async (payload) => {
  try {
    return (await axios.post(`${API_URL}/invoice-setup`, payload)).data;
  } catch (err) {
    throw apiError(err, "Could not save the invoice settings");
  }
};

// ---- Roles ----
const get = async (path, fallback) => {
  try {
    return (await axios.get(`${API_URL}${path}`)).data;
  } catch (err) {
    throw apiError(err, fallback);
  }
};
const post = async (path, body, fallback) => {
  try {
    return (await axios.post(`${API_URL}${path}`, body)).data;
  } catch (err) {
    const e = apiError(err, fallback);
    e.data = err.response?.data;
    throw e;
  }
};
export const getRoles = () => get(`/roles/${orgId()}`, "Could not load roles");
export const saveRole = (role) => post("/role", role, "Could not save the role");
export const deleteRole = (role_id) => post("/role/delete", { role_id }, "Could not delete the role");

// ---- Batches & inventory ----
const qs = (o) => new URLSearchParams(Object.entries(o || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();
export const getBatches = (f) => get(`/batches/${orgId()}?${qs(f)}`, "Could not load batches");
export const getBatchTrace = (batch_no) => get(`/batch-trace/${orgId()}/${encodeURIComponent(batch_no)}`, "Could not load the batch");
export const createBatch = (b) => post("/batch", b, "Could not create the batch");
export const updateBatch = (b) => post("/batch/update", b, "Could not update the batch");
export const closeBatch = (b) => post("/batch/close", b, "Could not close the batch");
export const importOpeningStock = (rows) => post("/stock-import", { rows }, "Could not load the file");
export const getProductSettings = () => get(`/product-settings/${orgId()}`, "Could not load products");
export const saveProductSettings = (p) => post("/product-settings", p, "Could not save the product settings");
export const getBatchSuggest = (indent_number, qty) =>
  get(`/batch-suggest/${orgId()}/${encodeURIComponent(indent_number)}?${qs({ qty: Object.entries(qty || {}).map(([k, v]) => `${k}:${v}`).join(",") })}`,
    "Could not load batches");
export const getIndentBatches = (indent_number) => get(`/indent-batches/${orgId()}/${encodeURIComponent(indent_number)}`, "Could not load batches");
export const getStock = (f) => get(`/stock/${orgId()}?${qs(f)}`, "Could not load stock");
export const getStockDaily = (f) => get(`/stock-daily/${orgId()}?${qs(f)}`, "Could not load inventory");
export const getStockAlerts = () => get(`/stock-alerts/${orgId()}`, "Could not load stock alerts");
export const getWastage = (f) => get(`/wastage/${orgId()}?${qs(f)}`, "Could not load wastage");

export const getCategoriesList = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  } catch (error) {
    throw error; 
  }
};

export const createNewCategory = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/category`,payload);
    return response.data; 
  } catch (error) {
    throw error; 
  }
};

export const getUserLists = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/users/TR`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; 
  }
};

export const createNewUser = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/createuser`,payload);
    return response.data; 
  } catch (error) {
    throw error; 
  }
};

export const updateUser = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/updateuser`,payload);
    return response.data; 
  } catch (error) {
    console.log("update user error",error)
    throw error; 
  }
};



export const createNewEmployee = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/employee`,payload);
    return response.data; 
  } catch (error) {
    throw error; 
  }
};

// Function to handle GET request
export const getBu = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const response = await axios.get(`${API_URL}/business/${org_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getEmployees = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const response = await axios.get(
      `${API_URL}/employees/${org_id}?branch_id=${branch_id}`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getEmployeesList = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/employees/TR`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getCategoryList = async () => {
  try {
    const response = await axios.get(`${API_URL}/category`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const referenceRecord = async (refType) => {
  try {
    const response = await axios.get(`${API_URL}/references/${refType}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getSellingPriceRecord = async (prod_id) => {
  try {
    const response = await axios.get(`${API_URL}/prodsellingprice/${prod_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const setSellingPrice = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/sellingprice `, {
      sellingprice: payload,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const response = await axios.get(`${API_URL}/products/${org_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const createNewIndent = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/indent`, {
      indent: payload,
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getListing = (params) => {
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  return axios.get(`${API_URL}/indents/${org_id}?status=${params.status}`);
};

// Indents for one or more statuses, optionally scoped to { branch_id } or { kitchen_id }.
// The API answers 404 when there are none, which is treated as an empty list.
export const fetchIndents = async (statuses = [], scope = {}) => {
  const org_id = currentUser().org_id;
  const lists = await Promise.all(
    statuses.map(async (status) => {
      const qs = new URLSearchParams({ status, ...scope }).toString();
      try {
        const res = await axios.get(`${API_URL}/indents/${encodeURIComponent(org_id)}?${qs}`);
        return res.data?.indents || [];
      } catch (err) {
        if (err.response?.status === 404 || err.response?.data?.status === 404) return [];
        throw err;
      }
    })
  );
  // Priority first, then earliest delivery
  return lists.flat().sort((a, b) => {
    if ((a.priority_flag === "Y") !== (b.priority_flag === "Y")) return a.priority_flag === "Y" ? -1 : 1;
    return new Date(a.delivery_by_datetime || 0) - new Date(b.delivery_by_datetime || 0);
  });
};

export const getIndentDetail = (params) => {
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  return axios.get(`${API_URL}/indentdetail/${org_id}?indent_number=${params}`);
};


export const getJobListing = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const response = await axios.get(
      `${API_URL}/production-monitoring/${org_id}?branch_id=${branch_id}`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const saveJob = async (params) => {
  try {
    const response = await axios.post(
      `${API_URL}/production-monitoring`,
      params
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    return error;
  }
};

export const saveTs = async (params) => { 
  return await axios.post(
    `${API_URL}/timesheet`,
    params
  );
};

// Function to convert UTC time to AEST
export const convertToTimeZone = (time) => {
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert the time from UTC to the specified timezone (AEST here)
  const zonedTime = utcToZonedTime(time, currentTimeZone);

  // Format the time to display in a readable format
  return format(zonedTime, "yyyy-MM-dd HH:mm:ssXXX");
};

export const getProductSummary = async (param) => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const response = await axios.get(
      `${API_URL}/product-dashboard/${org_id}?start_date='${param.start_date}'&&end_date='${param.end_date}'&&type=${param.type}`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getProductReport = async (param) => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    let url = `${API_URL}/production-report/${org_id}?start_date='${param.start_date}'&&end_date='${param.end_date}'`;
    if (param.emp_id) {
      url = url+`&&emp_id='${param.emp_id}'`;
    }
    if (param.product_id) {
      url = url+`&&product_id='${param.product_id}'`;
    }
    const response = await axios.get(url);
    return response.data; // Return only the data from the response
  } catch (error) {
    throw error;
  }
};

export const getIndentReport = async (param) => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    let url = `${API_URL}/indent-report/${org_id}?from_date='${param.from_date}'&&to_date='${param.to_date}'&&status=${param.status}`;
    const response = await axios.get(url);
    return response.data; // Return only the data from the response
  } catch (error) {
    throw error;
  }
};

export const getTSListing = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
    const response = await axios.get(
      `${API_URL}/timesheet/${org_id}?branch_id=${branch_id}`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};
