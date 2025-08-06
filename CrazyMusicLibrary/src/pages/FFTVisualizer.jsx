import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider';
import './FFTVisualizer.css';
const FFTVisualizer = () => {
	const animationRef = useRef();
	/** @type {React.RefObject<React.JSX.IntrinsicElements.canvas>} */
	const canvasRef = useRef(null);
	const {getFFTAtTime, fftConfigRef, globalAudioRef} = useAudioPlayer();
	const barNumber = 100;
  	const animate = (time) => {
		// Do your animation logic here
		// Example: update canvas or sync with audio time
		const ctx = canvasRef.current.getContext("2d");
		
		if(ctx){
			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
			let FFTdata = getFFTAtTime(time/1000);
			
			if(!FFTdata){
				animationRef.current = requestAnimationFrame(animate);
				return;
			};
			const deltaFrequency = fftConfigRef.current.sampleRate / FFTdata.length;
			FFTdata = FFTdata.slice(0, Math.floor(22000/deltaFrequency));
			const barSummation = Math.floor(FFTdata.length / barNumber);
			const display = new Array(barNumber);
			display.fill(0);
			for (let i = 0; i < FFTdata.length; i++) {
				display[Math.floor(i/barSummation)] += Number(FFTdata[i]);
			}
			let barWidth = (canvasRef.current.width ) / barNumber ;
			let x = 0;
// rgb(147, 137, 255)
			for (let i = 0; i < display.length; i++) {
				const barHeight = Math.sqrt(display[i]) * (barNumber / 5) * globalAudioRef.current?.volume;
				ctx.fillStyle = `rgb(${barHeight-100} 137 255)`;
				ctx.fillRect(x, canvasRef.current.height - barHeight / 2, barWidth, barHeight);

				x += barWidth + 1;
			  }
		}
		animationRef.current = requestAnimationFrame(animate);
  	};

	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationRef.current); // cleanup on unmount
	}, []);

	return <canvas ref={canvasRef} id="fft-canvas" width={1900} height={1000}></canvas>;
}

export default FFTVisualizer;
