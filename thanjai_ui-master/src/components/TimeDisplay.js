import React from 'react';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const TimeDisplay = () => {
  const timeInUTC = '2025-03-27T11:15:32.000Z'; // The UTC time you want to convert
  const timeZone = 'Australia/Sydney'; // AEST (Sydney timezone)

  // Function to convert UTC time to AEST
  const convertToTimeZone = (time, timeZone) => {
    // Convert the time from UTC to the specified timezone (AEST here)
    const zonedTime = utcToZonedTime(time, timeZone);
    
    // Format the time to display in a readable format
    return format(zonedTime, 'yyyy-MM-dd HH:mm:ssXXX');
  };

  return (
    <div>
      <h1>Converted Time:</h1>
      <p>{convertToTimeZone(timeInUTC, timeZone)}</p>
    </div>
  );
};

export default TimeDisplay;
