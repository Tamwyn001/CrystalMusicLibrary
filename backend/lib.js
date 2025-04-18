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