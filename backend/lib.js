import { readdir, stat } from "fs/promises"; // Import fs/promises to read directory and get file stats
import { join } from "path";

export function currentDate(){
    var pad = function(num) { return ('00'+num).slice(-2) };
    var date = new Date();
    date = date.getUTCFullYear()         + '-' +
            pad(date.getUTCMonth() + 1)  + '-' +
            pad(date.getUTCDate())       + ' ' +
            pad(date.getUTCHours()+1)      + ':' +
            pad(date.getUTCMinutes())    + ':' +
            pad(date.getUTCSeconds());
    return date;
}


export const dirSize = async directory => {
    const files = await readdir( directory );
    const stats = files.map( (file) => stat( join( directory, file ) ) );
  
    return ( await Promise.all( stats ) ).reduce( ( accumulator, { size } ) => accumulator + size, 0 );
  }