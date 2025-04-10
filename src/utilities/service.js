import axios from "axios";
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const API_URL = "https://pm.thanjaicaterers.com/v1";

export const getBranchLists = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/branches/TR`
    );
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const createNewEmployee = async (payload) => {
  console.log("payload_data",payload)
  try {
    const response = await axios.post(
      `${API_URL}/employee`,payload);
    return response.data; 
  } catch (error) {
    console.error("Error Create Employee:", error);
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
    throw error;
  }
};

export const getListing = (params) => {
  const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
  return axios.get(`${API_URL}/indents/${org_id}?status=${params.status}`);
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
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};


// Function to convert UTC time to AEST
export  const convertToTimeZone = (time) => {
  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Convert the time from UTC to the specified timezone (AEST here)
  const zonedTime = utcToZonedTime(time, currentTimeZone);
  
  // Format the time to display in a readable format
  return format(zonedTime, 'yyyy-MM-dd HH:mm:ssXXX');
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
