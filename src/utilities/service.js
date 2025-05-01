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
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
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
    const branch_id = JSON.parse(localStorage.getItem("user"))?.branch_id;
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
    let url = `${API_URL}/indent-report/${org_id}?from_date='${param.from_date}'&&to_date='${param.to_date}'&&stutus=${param.status}`;
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
