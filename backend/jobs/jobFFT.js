
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const { join, basename } = require("path");
const {v4 : uuidv4} = require("uuid");
const FFT = require("fft.js");
const { existsSync, writeFileSync } = require("fs");
const { spawn, exec } = require("child_process");
const Complex = require('complex.js');

/**
 * This job runs FFT of the audio files in parallel and write the result
 * into .bin files that can be streamed to the client's browser on playback.
 * 
 * Each audio file is decomposed into chuncks of x seconds. On each chunck 
 * we run a FFT and store the result. 
 */
class JobFFT extends Job {
    /** @type {{uuid :string, worker : Promise<any>}[]} */
    currentFFTWrokers = [];
    currentConfig = {};
    /** @type {string[]} */
    waitingList = [];

    upgradeProgress(){
        this.updateProgress(this.progress.done + 1, this.progress.total);
    }
    
    /**
     * @param {boolean} completeLibrary Do we have to recompute the whole library
     * @param {string} jobKey
     * @param {JobManager} jobManager
     */
    constructor(completeLibrary, jobKey, jobManager)  {
        // @ts-ignore
        super( jobKey, jobManager);
        
        // @ts-ignore
        this.currentConfig = require('../config/config.json');
        if(completeLibrary){

            this.waitingList = this.GetWholeLibraryFiles();
            this.updateProgress(0, this.waitingList.length);
            for(let i = 0; i < this.currentConfig.ServerFFT.parallelCompute; i++){
                this.CreateFFTWorker(0);
            };
        };
        
    };

    GetFreeWorker() {
        return this.currentConfig.ServerFFT.parallelCompute - 
        this.currentFFTWrokers.length;
    }

    /**
     * @param {any} paths
     */
    AddFilesToFFT(paths) {
        // @ts-ignore
        this.currentConfig = require('../config/config.json');
        const freeWorkers = this.GetFreeWorker();
        if(freeWorkers > 0){
            
        }
    }

    GetWholeLibraryFiles(){
        const db = getDatabase();
        /** @type {{path : string}[]} tracks */
        const tracks = db.prepare("SELECT path FROM tracks;").all();
        return tracks.map(track => track.path);
    }

    padPCM(chunk, fftSize) {
        const padded = new Int16Array(fftSize);
        padded.set(chunk.slice(0, fftSize)); // If chunk is shorter, fills the rest with 0
        return padded;
      };
    /**
     * 
     * @param {Number} waitingListId 
     * @returns 
     */
    async CreateFFTWorker(waitingListId){

        // Fetch the next audio file in the waiting list.
        if(this.waitingList.length == 0) {
            return;
        } ;
        const audioPath = this.waitingList[waitingListId];
        this.waitingList.splice(0,1);

        // Creates and runs the worker/promise
        const worker = new Promise( async(resolve,reject) => {
            this.status = JobStatus.RUNNING;
            if (!existsSync(audioPath)) { resolve();}

            // STEP 1 : Audio to raw pcm data
            const sampleRate = await getSampleRate(audioPath);
            const pcmBuffer = await decodeFlacToPCM(audioPath, sampleRate);
            const pcmChunks = chunkPCM(pcmBuffer, sampleRate,
                 this.currentConfig.ServerFFT.samplingInterval);

            // STEP 2 : Modify (trim) PCM data to match power 2
            // const nextPow2 = Math.pow(2, Math.floor(Math.log2(pcmChunks[0].length)));
            const nextPow2 = this.currentConfig.ServerFFT.samples;
            const pow2PCMChunks = pcmChunks.map(chunk => this.padPCM(chunk, nextPow2));
            const f = new FFT(nextPow2);
            const absArgChunks = [];

            function cleanPCMChunk(chunk) {
                return chunk.map(x => Number.isNaN(x) ? 0 : x);
            }

            // STEP 3 : Run FFT on each chunk and get amplitude and phase
            await Promise.all(pow2PCMChunks.map((chunk, id) => {
                // f.realTransfor most likely synchronous so we promisify it.
                const out = f.createComplexArray();
                const clean = cleanPCMChunk(chunk);
                if (chunk.some(x => !Number.isFinite(x))) {
                    console.warn("Invalid value in chunk:", chunk);
                }
                const hannWindowed = clean.map((val, n) => val * 0.5 * (1 - Math.cos(2 * Math.PI * n / (clean.length - 1))));

                f.realTransform(out, hannWindowed);
                // console.log(out);
                absArgChunks[id] = computeArgAbsOfChunk(out);
            }));
            
            // STEP 4: Store the FFT into a FLot32 bin file
            const FFTpath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                basename(audioPath).split(".")[0] + ".bin");
            const FFTStatPath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                    "stat_"+ basename(audioPath).split(".")[0] + ".json");
            const flat = absArgChunks.flat(); // <- Make sure this is an array of numbers
            const int16 = Int16Array.from(flat); // <- Convert to Int16
            writeFileSync(FFTpath, Buffer.from(Int16Array.from(int16).buffer));  
            const stat = { 
                sampleRate: sampleRate,
                fftSize: f.size,
                interval: this.currentConfig.ServerFFT.samplingInterval,
                format: "int16",
                bytePerChunk : (f.size / 2 ) * 2 * 1 // One value in a 2 bytes int16
            };
            writeFileSync(FFTStatPath, JSON.stringify(stat, null, 4));     
            resolve();        
        });

        const workerUUID = uuidv4();
        console.log("[Job]      FFT registers new worker ", workerUUID)

        this.PushNewWorker( workerUUID, worker);
        await worker;

        // Remove the worker reference on completion
        const workerIndex = this.currentFFTWrokers.findIndex(
            worker => worker.uuid == workerUUID);
        this.currentFFTWrokers.splice(workerIndex, 1);
        this.upgradeProgress();

        if(this.currentFFTWrokers.length == 0 && this.waitingList.length == 0) {
            // Stops the job if all done.
            this.jobManager.stopJob(this.jobKey);
        }
    };

    /**
     * Create a new worker and takes care of creating the next one when finished.
     * @param {string} uuid 
     * @param {Promise<void>} worker 
     */
    PushNewWorker(uuid, worker) {
        this.currentFFTWrokers.push({uuid: uuid, worker : worker});
        worker.then(() => {
            console.log("[Job]      FFT finished worker ", uuid)
            this.CreateNextWorkerIfFree();
        });
    }
    
    CreateNextWorkerIfFree(){
        if(this.GetFreeWorker() > 0){
            this.CreateFFTWorker(0);
        }  
    }

    
}
module.exports = JobFFT;

/** 
 * @param {Number[]} chunkFFT
 * 
 */
const computeArgAbsOfChunk = (chunkFFT) => {
    // from [re, im], we get [arg, abs] so same length.
    const absArg = [];
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

const decodeFlacToPCM = (/** @type {string} */ filePath, /** @type {string} */ sampleRate) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        /**
         * Raw 32-bit float samples (f32le)
         * Mono channel (-ac 1)
         * Sample rate of 44100 Hz
         */
        const ffmpeg = spawn('ffmpeg', [
            '-loglevel', 'error', 
            '-i', filePath,
            '-f', 's16le', // Int16bits instead of float32, do not that that precise visualisation
            '-ac', '1',
            '-ar', sampleRate.toString(),
            'pipe:1'
        ]);
        ffmpeg.stdout.on('data', (data) => chunks.push(data));
        ffmpeg.stderr.on('data', (err) => console.error(err.toString()));

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                const rawPCM = Buffer.concat(chunks); // Combine all chunks
                resolve(rawPCM);}
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });

    });
};

const chunkPCM = (/** @type {{ buffer: any; byteOffset: number; byteLength: number; }} */ buffer, /** @type {number} */ sampleRate, /** @type {number} */ secondsPerChunk) => {
    const chunkSize = sampleRate * secondsPerChunk;
    const floatArray = new Int16Array(buffer.buffer);
    
    const chunks = [];
    for (let i = 0; i < floatArray.length; i += chunkSize) {
      chunks.push(floatArray.slice(i, i + chunkSize));
    }
    return chunks;
};

const getSampleRate = (/** @type {string} */ filePath) => {
    return new Promise((resolve, reject) => {
      exec(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
        if (error) return reject(error);
        resolve(parseInt(stdout.trim(), 10));
      });
    });
};



