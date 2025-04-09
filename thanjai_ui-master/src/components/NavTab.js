import  React, {useEffect} from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Badge } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CreateIndent from "../pages/CreateIndent";
import IndentListing from "../pages/IndentListing";
import { useUser } from '../utilities/UserContext';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function NavTab() {
  const { user, login, logout } = useUser();
    const theme = createTheme({
        withDivider: {
            justifyContent: `space-between`,
        },
        palette: {
          primary: {
            main: '#ffa133',
          },
          secondary: {
            main: '#f44336',
          },
        },    
      });
      
  const [value, setValue] = React.useState(null);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabValue = (value)=>{
    setValue(3);
  }

  useEffect(()=>{
    if(user?.user_type === 'B'){
      setValue(3);
    }else {
      setValue(1);
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      
    <Box sx={{ width: "100%" }}>
      <Box sx={{alignContent:'center', mt:2}}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          sx={{
            '& .MuiTabs-flexContainer': {
              justifyContent: 'space-between', // Apply space between the tabs
            },
          }}
          
        >
          <Tab
            label={
              <Badge badgeContent='C' color="primary">
                <ShoppingCartIcon style={{ fontSize: 50 }}/>
              </Badge>
            }
            disabled={user?.user_type === 'K'}           
            {...a11yProps(0)}
          />
          <Tab
            label={
              <Badge badgeContent='A' color="primary">
                <ChecklistRtlIcon style={{ fontSize: 50 }}/>
              </Badge>
            } 
            disabled={user?.user_type === 'B'}           
            {...a11yProps(1)}
          />
        <Tab
            label={
              <Badge badgeContent='D' color="primary">
                <LocalShippingIcon style={{ fontSize: 50 }}/>
              </Badge>
            }
            disabled={user?.user_type === 'B'}           
            {...a11yProps(2)}
          />
          <Tab
            label={
              <Badge badgeContent='R' color="primary">
                <CallReceivedIcon style={{ fontSize: 50 }}/>
              </Badge>
            }
            disabled={user?.user_type === 'K'}           
            {...a11yProps(3)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <CreateIndent sendToParent={tabValue}/>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
      <IndentListing tabValue={1}/>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <IndentListing tabValue={2}/>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
       <IndentListing tabValue={3}/>
      </CustomTabPanel>
    </Box>
    </ThemeProvider>
  );
}
