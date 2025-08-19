import { useNavigate } from "react-router-dom";
import apiBase from "./APIbase";

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

  export const RGBAToHexA = (r,g,b,a) =>{
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    a = Math.round(a * 255).toString(16);
  
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
    if (a.length == 1)
      a = "0" + a;
  
    return "#" + r + g + b + a;
  }

  export const RGBToHex = (r,g,b) =>{
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
  
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }

export const hexToRGB = (h) => {
  let r = 0, g = 0, b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

  // 6 digits
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }
  
  return "rgb("+ +r + "," + +g + "," + +b + ")";
}

export const hexToRGBArray = (h) => {
  let r = 0, g = 0, b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

  // 6 digits
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }
  
  return [parseInt(r), parseInt(g), parseInt(b)];
}
export const lerp  = (a,b,t) => {
  return a + (b-a)*t
} 

export const remap  = (x,a,b,c,d) => {
  return lerp(c,d,(x-a)/(b-a));
} 


export const trimString = (string, max ) => {
  var stringNorm = string ?? "";
  if (stringNorm.length > max){
    return stringNorm.substring(0,max-2) + "..";
  }
  return stringNorm;
}

export const verifyToken = (location = "") => { 
  const avoidRedirect = ["/", "/register"]
	return new Promise (async (resolve) => {
		const ok = await fetch(`${apiBase}/auth/verifyToken`,  
				{method: 'POST', credentials: 'include'})
			.then(async res => {
				if(!res.ok){
          //No redirection if already in auth/register page.
          if(avoidRedirect.includes(location)){return false;}
					await fetch(`${apiBase}/auth/logout`, {method: 'POST', credentials: 'include'})
					.then((response) => {
						if (response.ok) {
							window.location.href = "/";
							
						} else {
							console.error('Logout failed');
						}
					});
					return false;
				}
				return true;
			});
		resolve(ok);
	});
}

/**
 * Checks the token validity and runs the callback function if valid.
 * Optionaly you can pass a path. If this match the register or auth route,
 * no redirect to login page will be done.
 * @param {(any) => any} fn The callback to execute if valid token.
 * @param {string} location
 * @returns A promise that resolves after the check.
 */
export const asVerified = (fn, location = "") => {
	return async function verify() { 
    const valid = await verifyToken(location);
		if(! valid) return;
		fn();
	};
}
// http://stackoverflow.com/questions/1026069/ddg#1026087
export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
