import { useEffect, useRef, useState } from "react";
import { hexToRGBArray, lerp, RGBToHex } from "../../lib.js";
import _ from "lodash";
const possibleColors = [
    hexToRGBArray('#f8be99'),
    hexToRGBArray('#f495e9'),
    hexToRGBArray('#bbfbdf'),
    hexToRGBArray('#c4d3f8'),
    hexToRGBArray('#edc9f9'),
    hexToRGBArray('#909ef8'),
    hexToRGBArray('#96ebf4')
];
const FPS = 60;
const BG_COLOR = hexToRGBArray('#242424');
const CMLLogoAnimated = () => {

    const [colors, setColors] = useState([BG_COLOR,BG_COLOR]);
    const colorsPrevious = useRef([]);
    const colorsNext = useRef([BG_COLOR,BG_COLOR]);

    const colorPool = useRef(possibleColors);
    const colorAnimFrame = useRef(0);
    const colorAnimInterval = useRef(0);
    useEffect(()=>{
        colorAnimInterval.current = setInterval(lerpColors, 1000/FPS);
        return () =>{
            clearInterval(colorAnimInterval.current);
        }
    },[]);
    const sampleColorFromPool = () =>{
        const color = _.sample(colorPool.current);
        colorPool.current.filter(c => c.join(",") != color.join(","));
        return color;
    }
    const lerpColors = () => {
        if(colorAnimFrame.current % FPS === 0){
            // Push back into the pool only if it's a valid color that can be picked later.
            if(colorsPrevious.current[0] &&
                colorsPrevious.current[0] !== BG_COLOR)
            {
                colorPool.current.push(...colorsPrevious.current);
            }
            colorsPrevious.current = colorsNext.current;
            colorsNext.current = [sampleColorFromPool(), sampleColorFromPool()];

        }
        setColors(colorsPrevious.current.map(
            (col1,i) => colorsNext.current[i].map((colBit2, j) => {
                // console.log(parseInt(lerp(col1[j], colBit2, colorAnimFrame.current % FPS)));
                return parseInt(lerp(col1[j], colBit2, colorAnimFrame.current % FPS / FPS))}
            )));
        colorAnimFrame.current += 1;
        
    }

  return  <div id="background-img" 
    style={{"--col1" : RGBToHex(...colors[0]),
         "--col2" : RGBToHex(...colors[1])}}/>;        
}

export default CMLLogoAnimated;