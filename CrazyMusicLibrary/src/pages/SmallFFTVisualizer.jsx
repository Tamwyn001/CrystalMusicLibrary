import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider.jsx';
import './FFTVisualizer.css';
import { remap } from '../../lib.js';
const SmallFFTVisualizer = ({fps = 45}) => {
	const animationRef = useRef();
	/** @type {React.RefObject<React.JSX.IntrinsicElements.canvas>} */
	const canvasRef = useRef(null);
	const {getFFTAtCurrentTime, fftConfigRef, globalAudioRef, FFTUserSetingsRef,
		fetchFFTUserSettings, colorOverride, currentTrackData} = useAudioPlayer();
	const lastTime = useRef(0);
	//In case of mobile display
	const notShown = useRef(false);
  	const animate = (now) => {
		// Do your animation logic here
		// Example: update canvas or sync with audio time
		if(currentTrackData?.type == "radio" || notShown.current){
			cancelAnimationFrame(animationRef.current);
			return;
		}
		if(!canvasRef.current) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		const ctx = canvasRef.current.getContext("2d");
		if(ctx && FFTUserSetingsRef.current){

			if(now - lastTime.current < (1000 / fps)){
				animationRef.current = requestAnimationFrame(animate);
				return;
			}
			lastTime.current = now;
			const barNumber = 5;
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);


			const FFTdata = getFFTAtCurrentTime();
			if(!FFTdata){
				animationRef.current = requestAnimationFrame(animate);
				return;
			};
			// cut the upper 60% of the spectrum
			let FFTdataView = FFTdata.subarray(Math.floor(FFTdata.length * 0.3), Math.floor(FFTdata.length * 0.6));
			const barSummation = Math.max(1,FFTdataView.length / barNumber);
			const display = new Array(barNumber);
			display.fill(0);
			for (let i = 0; i < FFTdataView.length; i++) {
				// todo Math.floor leaves some artefect for bar > fftsise/2 
				display[Math.floor(i/barSummation)] += Number(FFTdata[i]);

			}
			let barWidth = (canvasRef.current.width / barNumber - 5);
			// console.log(barWidth, canvasRef.current.width , barNumber)
			let x = 0;
			ctx.strokeStyle = `#ffffff`;
			ctx.fillStyle = "#ffffff";
			for (let i = 0; i < display.length; i++) {
				const remaped = remap(Math.log2(display[i])
				* (barNumber / 5), 5,25, 0, 1);
				const barHeight = Math.max(10, Math.min(80 * 
						remaped * globalAudioRef.current?.volume,
						 canvasRef.current.height - 10));
				
				ctx.beginPath(); 
				ctx.roundRect(2 + x, (canvasRef.current.height - barHeight)/2, barWidth, barHeight, 7);
				ctx.fill();
				ctx.stroke();
				x += barWidth + 5;
			  }
		}
		animationRef.current = requestAnimationFrame(animate);
  	};

	useEffect(() => {
		if(!fftConfigRef.current){
			cancelAnimationFrame(animationRef.current);
			console.log("No FFT data to display, releasing anim frame.");
			return;
		} 
		animationRef.current = requestAnimationFrame(animate);
		console.log("FFT found, requested animation frame.");
	},[fftConfigRef.current]);

	useEffect(() => {

		const mq = window.matchMedia("(max-width: 820px)");

		const update = (e) => {
		  notShown.current = e.matches; // hidden when true
		  animationRef.current = requestAnimationFrame(animate);	  
		  console.log("Canvas hidden?", notShown.current);
		};
	  
		// Initial check
		update(mq);
	  
		// Subscribe
		mq.addEventListener("change", update);
		return () => {
			mq.removeEventListener("change", update);
		}// cleanup on unmount
	}, []);

	return <canvas ref={canvasRef} id="fft-canvas-small" className="in-song-header" width={50} height={50}></canvas>;
}

export default SmallFFTVisualizer;
