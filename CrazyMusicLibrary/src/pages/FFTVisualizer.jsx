import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider';
import './FFTVisualizer.css';
import { lerp } from '../../lib';
const FFTVisualizer = () => {
	const animationRef = useRef();
	/** @type {React.RefObject<React.JSX.IntrinsicElements.canvas>} */
	const canvasRef = useRef(null);
	const {getFFTAtCurrentTime, fftConfigRef, globalAudioRef, FFTUserSetingsRef,
		fetchFFTUserSettings, colorOverride, currentTrackData} = useAudioPlayer();
	const lastTime = useRef(0);
  	const animate = (now) => {
		if(currentTrackData?.type == "radio"){
			cancelAnimationFrame(animationRef.current);
			return;}
		// Do your animation logic here
		// Example: update canvas or sync with audio time
		if(!canvasRef.current) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		const ctx = canvasRef.current.getContext("2d");
		if(ctx && FFTUserSetingsRef.current && colorOverride.current){
			if(now - lastTime.current < (1000 / FFTUserSetingsRef.current.FPS)){
				animationRef.current = requestAnimationFrame(animate);
				return;
			}
			lastTime.current = now;
			const barNumber = FFTUserSetingsRef.current.bars;
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);


			const FFTdata = getFFTAtCurrentTime();
			if(!FFTdata){
				animationRef.current = requestAnimationFrame(animate);
				return;
			};
			const deltaFrequency = fftConfigRef.current.sampleRate / FFTdata.length;
			// FFTdata = FFTdata.slice(0, Math.floor(22000/deltaFrequency));
			const barSummation = Math.max(1,FFTdata.length / barNumber);
			const display = new Array(barNumber);
			display.fill(0);
			for (let i = 0; i < FFTdata.length; i++) {
				// todo Math.floor leaves some artefect for bar > fftsise/2 
				display[Math.floor(i/barSummation)] += Number(FFTdata[i]);

			}
			let barWidth = (canvasRef.current.width / barNumber - 1);
			// console.log(barWidth, canvasRef.current.width , barNumber)
			let x = 0;
			for (let i = 0; i < display.length; i++) {
				const barHeight = FFTUserSetingsRef.current.scale * 
						 Math.log2(display[i])
					* (barNumber / 5) * globalAudioRef.current?.volume;
				if(colorOverride.current?.length > 0) {
					const alpha = Math.min(1, Math.max(0,barHeight/FFTUserSetingsRef.current.scale / FFTUserSetingsRef.current.contrast / 300));
					ctx.fillStyle = `rgb(
						${lerp(colorOverride.current[0][0], colorOverride.current[1][0], alpha)} 
						${lerp(colorOverride.current[0][1], colorOverride.current[1][1],alpha)}
						${lerp(colorOverride.current[0][2], colorOverride.current[1][2], alpha)}
						)`;

				}
				else{
					ctx.fillStyle = `rgb(${barHeight/FFTUserSetingsRef.current.scale / FFTUserSetingsRef.current.contrast} 137 255)`;
				}
				ctx.fillRect(x, canvasRef.current.height - barHeight, barWidth, barHeight);

				x += barWidth + 1;
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
		animationRef.current = requestAnimationFrame(animate);

		return () => {cancelAnimationFrame(animationRef.current)}; // cleanup on unmount
	}, []);

	return <canvas ref={canvasRef} id="fft-canvas" width={1900} height={1000}></canvas>;
}

export default FFTVisualizer;
