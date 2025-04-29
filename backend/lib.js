const { readdir, stat } = require("fs/promises"); // Import fs/promises to read directory and get file stats
const { join } = require("path");

const currentDate= () =>{
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


const dirSize = async directory => {
    const files = await readdir( directory );
    const stats = files.map( (file) => stat( join( directory, file ) ) );
  
    return ( await Promise.all( stats ) ).reduce( ( accumulator, { size } ) => accumulator + size, 0 );
  }

  module.exports = {
    currentDate,
    dirSize};