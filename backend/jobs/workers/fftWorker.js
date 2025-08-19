
const { parentPort } = require('worker_threads');
const FFT = require('fft.js');
const { default: Complex } = require('complex.js');
const { v4 : uuidv4} = require('uuid');

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

// todo wrap this process into a class, so killed ref gets set to true. 
class ThreadState {
    /**@type {boolean} */
    killed;
    /**@type {boolean} */
    fftRunning ;
    /**@type {boolean} */
    sendingChunksRunning;
    /**@type {(value: any) => void} Resolves the ack so that the next chunk gets sent*/
    pendingAckResolver;  
    /**@type {Number} */
    FFTchunkSize;
    /**@type {Number} */
    sentChunks;
    /**@type {Int16Array[]} */
    absArgChunks = [];
    constructor(){
        this.reset();
        this.uuid = uuidv4();
    }
    reset (){
        this.uuid = uuidv4();
        this.killed = false;
        this.fftRunning = false;
        this.sendingChunksRunning = false;
        this.pendingAckResolver = null;  
        this.FFTchunkSize = 0;
        this.sentChunks = 0;
        this.absArgChunks.length = 0;
    }
};


const threadState = new ThreadState();

parentPort.on('message', async (data) => {
    // console.log("dat");
    if(threadState.killed) return;
    const {message, ...content} = data;
    switch(message){
        case "KILL":
            // kill the process cooperativley
            threadState.killed = true;
            console.log("triggered kill");
            if (threadState.pendingAckResolver) {
                threadState.pendingAckResolver();
                threadState.pendingAckResolver = null;
            }
            return;
        case "START_FFT":
            // console.log("thread started with uuid", threadState.uuid);
            if(threadState.absArgChunks.length > 0){
                console.error("Worker started with non empty chunks");
            }
            startFFTAnalysis(content);
            break;
        case "BATCH_RECIEVED":
            // resolve the waiter (if any)
            if (threadState.pendingAckResolver) {
                threadState.pendingAckResolver();
                threadState.pendingAckResolver = null;
            }
            return;
        case "FREE_MEMORY":
            // Reset the state
            threadState.reset();
            parentPort.postMessage({message : "WORKER_READY_FOR_NEXT", data : {}})

        break;

        case "CONFIRM_END":
            // kill the process
            process.exit(0);
        break;
    }
});

const startFFTAnalysis = (data) => {
    if(threadState.killed) return;
    threadState.fftRunning = true;
    const { pow2Len, pcmBuffer, sampleRate, interval } = data;
    const truePow2 = Math.pow(2, Math.round(Math.log( pow2Len || 512)/Math.log(2)));
   
    threadState.FFTchunkSize = truePow2;
	const f = new FFT(truePow2);
    const chunks = chunkPCM(pcmBuffer, sampleRate, interval); 
    let id = 0;
    try{
        for (let chunk of chunks) {
            const out = f.createComplexArray();
            let padded = new Int16Array(pow2Len);
            padded.set(chunk.subarray(0, pow2Len)); // one copy *only here*, right before FFT
            padded = cleanPCMChunk(padded);

            if (chunk.some(x => !Number.isFinite(x))) {
                console.warn("Invalid value in chunk:", chunk);
            }
            padded = applyWindow(padded);

            f.realTransform(out, padded);
            //an array of int16
            threadState.absArgChunks[id] = computeArgAbsOfChunk(out);
            id++;
        };
        threadState.fftRunning = false;
        startBackStreaming();
    }
    catch(err) {
        console.log("Error in thread worker:", err);
        process.exit(WorkerErrors.FFT_ERROR);
    }
}
let batchSize;

const startBackStreaming = () => {
    if(threadState.killed) return;
    // We send up to 4096 equivalent of chunks size.
    // So sampling at 512 batches at 8 chunks.
    batchSize = Math.max(1, Math.floor(4096 / threadState.FFTchunkSize));
    threadState.sentChunks = 0;
    sendNextBatch();
};

const sendNextBatch = async () => {
    if(threadState.killed) return;
    if(threadState.sentChunks >= threadState.absArgChunks.length){
        console.error("Worker sent batch again but should be finished!!:",
            threadState.sentChunks , threadState.absArgChunks.length);
    }
    threadState.sendingChunksRunning = true;
    // Prepares a chunk and transfert it to the main thread
    const batch = threadState.absArgChunks.slice(threadState.sentChunks, threadState.sentChunks + batchSize);
    parentPort.postMessage(
        {
            message: "WORKER_DATA",
            data : {
                dataChunks : batch,
                finished : threadState.sentChunks + batchSize >= threadState.absArgChunks.length,
                uuid : threadState.uuid
            }
        },
        batch.map(c => c.buffer));

    threadState.sentChunks += batchSize;

    await new Promise((resolve, reject) => {
        if (threadState.killed) return resolve();
        threadState.pendingAckResolver = resolve;

        // Optionally add a timeout to auto-resume if ack never comes:
        // setTimeout(() => { if (threadState.pendingAckResolver) {
        //     threadState.pendingAckResolver();
        //     threadState.pendingAckResolver = null; 
        // } }, 5000);
 
    });
    // if killed, stop
    if (threadState.killed) return;

    // continue sending next batch
    return sendNextBatch();
};