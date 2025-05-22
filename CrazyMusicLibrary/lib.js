export const parseAudioDuration = (rawDuration) => {
    var pad = function(num) { return ('00'+num).slice(-2) };
    const hours = Math.floor(rawDuration / 3600);
    const minutes = Math.floor((rawDuration % 3600) / 60);
    const seconds = pad(Math.floor(rawDuration % 60));
    const readable = (hours > 0) ?
        `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    return { hours, minutes, seconds, readable };
}

export const parseDataSize = (rawSize) => {
    const kb = Math.floor(rawSize / 1024);
    const mb = Math.floor(kb / 1024);
    const gb = Math.floor(mb / 1024);
    const tb = Math.floor(gb / 1024);
    const readable = (tb > 0) ?
        `${Number(rawSize/1024/1024/1024/1024).toFixed(2)}TB` : (gb > 0) ?
            `${Number(rawSize/1024/1024/1024).toFixed(2)}GB` : (mb > 0) ?
                `${Number(rawSize/1024/1024).toFixed(2)}MB` : `${Number(rawSize/1024).toFixed(2)}KB`;
    return { kb, mb, gb, tb, readable };
}

//https://css-tricks.com/converting-color-spaces-in-javascript/
export const HSLToHex = (h,s,l) => {
    s /= 100;
    l /= 100;
  
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0, 
        b = 0; 
  
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
  
    // Prepend 0s, if necessary
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }

export const lerp  = (a,b,x) => {
  return a + (b-a)*x
} 