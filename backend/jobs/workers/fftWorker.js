
const { parentPort } = require('worker_threads');
const FFT = require('fft.js');
const { default: Complex } = require('complex.js');

const WorkerErrors = {
    FFT_ERROR : 1
}

function cleanPCMChunk(chunk) {
    for (let i = 0; i < chunk.length; i++) {
        if (Number.isNaN(chunk[i])) chunk[i] = 0;
    }
    return chunk; // same reference, no new allocation
}

//Apply Hann window
function applyWindow(chunk) {
    for (let i = 0; i < chunk.length; i++) {
        chunk[i] = chunk[i] * 0.5 * (1 - Math.cos(2 * Math.PI * i / (chunk.length - 1)));
    }
    return chunk; // same reference, no new allocation
}
/** 
 * @param {Number[]} chunkFFT
 * 
 */
const computeArgAbsOfChunk = (chunkFFT) => {
    // from [re, im], we get [arg] so half length.
    const absArg = new Int16Array(chunkFFT.length / 2);
    const maxPossibleAbsValue = 33000;
    const SCALE_FACTOR = 1 / maxPossibleAbsValue;
    for (let index = 0; index < chunkFFT.length / 2; index++) {
        const i = 2 * index;

        //  @ts-ignore
        let complex = new Complex({
            re : Number(chunkFFT[i]),
            im : Number(chunkFFT[i + 1])});
        // absArg[i] = complex.arg();
        // absArg[i + 1] = complex.abs(); 
        const magnitude = complex.abs(); // float

        const scaled = Math.floor(magnitude / 100); // scale to -32768 to 32767
        // Clamp to Int16 range just in case
        absArg[i] = Math.max(-32768, Math.min(32767, scaled));
    }
    return absArg;
}

const chunkPCM = (pcmBuffer, sampleRate, interval) => {
    const pcmView = new Int16Array(pcmBuffer);
    const samplesPerChunk = sampleRate * interval;
    const chunks = [];

    for (let i = 0; i < pcmView.length; i += samplesPerChunk) {
        const len = Math.min(samplesPerChunk, pcmView.length - i);
        chunks.push(pcmView.subarray(i, i + len)); // ZERO-COPY view
    }
    return chunks;
}
let FFTchunkSize;
let sentChunks;
/**@type {Int16Array[]} */
let absArgChunks = [];
parentPort.on('message', async (data) => {
    const {message, ...content} = data;
    switch(message){
        case "START_FFT":
            startFFTAnalysis(content);
            break;
        case "BATCH_RECIEVED":
            sendNextBatch();
            break;
        case "CONFIRM_END":
            // kill the process
            process.exit(0);
        break;
        case "KILL":
            // kill the process
            console.log("Killing");
            process.exit(0);
        break;
    }
});

const startFFTAnalysis = (data) => {
    const { pow2Len, pcmBuffer, sampleRate, interval } = data;
    FFTchunkSize = pow2Len;
	const f = new FFT(pow2Len);
    const chunks = chunkPCM(pcmBuffer, sampleRate, interval); 
    let id = 0;
    try{
        for (let chunk of chunks) {
            const out = f.createComplexArray();
            let padded = new Int16Array(pow2Len);
            padded.set(chunk); // one copy *only here*, right before FFT
            padded = cleanPCMChunk(padded);

            if (chunk.some(x => !Number.isFinite(x))) {
                console.warn("Invalid value in chunk:", chunk);
            }
            padded = applyWindow(padded);

            f.realTransform(out, padded);
            //an array of int16
            absArgChunks[id] = computeArgAbsOfChunk(out);
            id++;
        };
        startBackStreaming();
    }
    catch(err) {
        console.log("Error in thread worker:", err);
        process.exit(WorkerErrors.FFT_ERROR);
    }
}
let batchSize;

const startBackStreaming = () => {
    // We send up to 4096 equivalent of chunks size.
    // So sampling at 512 batches at 8 chunks.
    batchSize = Math.max(1, Math.floor(4096 / FFTchunkSize));
    sentChunks = 0;
    sendNextBatch();
};

const sendNextBatch = () => {
    const batch = absArgChunks.slice(sentChunks, sentChunks + batchSize);
    parentPort.postMessage(
        {
            dataChunks : batch,
            finished : sentChunks + batchSize >= absArgChunks.length
        },
        batch.map(c => c.buffer));

    sentChunks += batchSize
};