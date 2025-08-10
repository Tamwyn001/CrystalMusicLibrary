import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider';
import './FFTVisualizer.css';
const FFTVisualizer = () => {
	const animationRef = useRef();
	/** @type {React.RefObject<React.JSX.IntrinsicElements.canvas>} */
	const canvasRef = useRef(null);
	const {getFFTAtCurrentTime, fftConfigRef, globalAudioRef, FFTUserSetingsRef,fetchFFTUserSettings} = useAudioPlayer();
	
  	const animate = () => {
		// Do your animation logic here
		// Example: update canvas or sync with audio time
		if(!canvasRef.current) {
			animationRef.current = requestAnimationFrame(animate);
			return;
		}
		const ctx = canvasRef.current.getContext("2d");
		if(ctx && FFTUserSetingsRef.current){
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
				const barHeight = Math.log2(display[i]) * (barNumber / 5) * globalAudioRef.current?.volume;
				ctx.fillStyle = `rgb(${barHeight-100} 137 255)`;
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

		return () => cancelAnimationFrame(animationRef.current); // cleanup on unmount
	}, []);

	return <canvas ref={canvasRef} id="fft-canvas" width={1900} height={1000}></canvas>;
}

export default FFTVisualizer;
