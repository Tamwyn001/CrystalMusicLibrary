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

// const dateFromJJMMAAAA = (date) => {
//     const year = date.slice(0, 4);
//     const month = date.slice(4, 6);
//     const day = date.slice(6, 8);
//     return `${year}-${month}-${day}`;
// }


const dirSize = async directory => {
    const files = await readdir( directory );
    const stats = files.map( (file) => stat( join( directory, file ) ) );
  
    return ( await Promise.all( stats ) ).reduce( ( accumulator, { size } ) => accumulator + size, 0 );
  }

  function asTransaction(dbInstance, func) {
    let begin = dbInstance.prepare('BEGIN');
    let commit = dbInstance.prepare('COMMIT');
    let rollback = dbInstance.prepare('ROLLBACK');
    return function (...args) {
      begin.run();
      try {
        func(...args);
        commit.run();
      } finally {
        if (dbInstance.inTransaction) rollback.run();
      }
    };
  }

  function interpolateQuery(sql, params) {
    let i = 0;
    return sql.replace(/\?/g, () => {
      const val = params[i++];
      if (val === null) return 'NULL';
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? '1' : '0';
      return `'${String(val).replace(/'/g, "''")}'`; // escape single quotes
    });
  }

  module.exports = {
    currentDate,
    dirSize,
    interpolateQuery,
    asTransaction};