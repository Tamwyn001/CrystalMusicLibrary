
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const { join, basename } = require("path");
const {v4 : uuidv4} = require("uuid");
const { existsSync, writeFileSync } = require("fs");
const { spawn, exec } = require("child_process");
const { Worker } = require("worker_threads");


/**
 * This job runs FFT of the audio files in parallel and write the result
 * into .bin files that can be streamed to the client's browser on playback.
 * 
 * Each audio file is decomposed into chuncks of x seconds. On each chunck 
 * we run a FFT and store the result. 
 */
class JobFFT extends Job {
    /** @type {{uuid :string, FFTPromise : Promise<any>}[]} */
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
        if(this.status === JobStatus.INACTIVE ||
            this.status === JobStatus.PAUSED ){return;}
        let cancelled = false;
        let ffmpegPromise;
        /**@type {Worker} */
        let worker;
      
        // Fetch the next audio file in the waiting list.
        if(this.waitingList.length == 0) {
            return;
        } ;
        const audioPath = this.waitingList[waitingListId];
        this.waitingList.splice(0,1);


        // Creates and runs the worker/promise
        const workerPromise = new Promise( async(resolve,reject) => {
           
            this.status = JobStatus.RUNNING;
            if (!existsSync(audioPath)) { resolve();}


            // STEP 1 : Audio to raw pcm data
            ffmpegPromise = getSampleRate(audioPath);
             /** @type {Number} */
            const sampleRate = await ffmpegPromise;
            ffmpegPromise = decodeFlacToPCM(audioPath, sampleRate);
            /** @type {Int16Array} */
            const pcmView = await ffmpegPromise;
            const pcmLength = pcmView.length;
            // STEP 2 : Modify (trim) PCM data to match power 2
            // const nextPow2 = Math.pow(2, Math.floor(Math.log2(pcmChunks[0].length)));
            const nextPow2 = this.currentConfig.ServerFFT.samples;
            worker = new Worker('./jobs/workers/fftWorker.js');
            
            // STEP 3 : Run FFT on each chunk and get amplitude and phase
            worker.postMessage({
                message : "START_FFT",
                pow2Len : nextPow2,
                pcmBuffer: pcmView.buffer,
                sampleRate,
                interval: this.currentConfig.ServerFFT.samplingInterval,
              }, [pcmView.buffer]);
            const result = [];

            /**
             * @type {() => Int16Array}
             */
            const concatFFTInt16ChunksFromResult = () => {
                let offset = 0;
                //each chunk is expected to be og length nextPow2;
                const concat = new Int16Array(nextPow2 * result.length);
                for (const chunk of result) {
                    concat.set(chunk, offset);
                    offset += nextPow2;
                  };
                return concat;
            }
            const writeFFTData = () => {
                // STEP 4: Store the FFT into a FLot32 bin file
                const FFTpath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                    basename(audioPath).split(".")[0] + ".bin");
                const FFTStatPath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                        "stat_"+ basename(audioPath).split(".")[0] + ".json");

                writeFileSync(FFTpath, 
                    Buffer.from(concatFFTInt16ChunksFromResult().buffer));  
                const stat = { 
                    sampleRate: sampleRate,
                    fftSize: nextPow2,
                    interval: this.currentConfig.ServerFFT.samplingInterval,
                    format: "int16",
                    bytePerChunk : (nextPow2 ) * 2 * 1 // One value in a 2 bytes int16
                };
                writeFileSync(FFTStatPath, JSON.stringify(stat, null, 4));     
                resolve(); 
            }

            worker.on("message", ({dataChunks, finished}) => {
                if(!worker) {return;} // Worker gets killed
                result.push(...dataChunks);
                if(!finished){
                    worker.postMessage({message : "BATCH_RECIEVED"});
                } else {
                    const samplesPerChunk = sampleRate * this.currentConfig.ServerFFT.samplingInterval;
                    worker.postMessage({message : "CONFIRM_END"});
                    console.log("           - confirm thread with ", result.length,
                         "chunks from", Math.ceil(pcmLength / samplesPerChunk));
                    writeFFTData();
                }
            });
            worker.on('error', reject);
            worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
            });
        });
        workerPromise.cancel = () =>{
            cancelled = true;
            // Cancel ongoing ffmpeg processes
            if (ffmpegPromise && typeof ffmpegPromise.cancel === 'function') {
                ffmpegPromise.cancel().catch(() => {});
                ffmpegPromise = null;
            }
            if (worker) {
                worker.postMessage({message : "KILL"});
                worker = null;
            }
            // Clear large buffers

            workerPromise.pcmView = null;
            workerPromise.result = [];
            // Drop from workers list immediately
            const idx = this.currentFFTWrokers.findIndex(w => w.FFTPromise === workerPromise);
            if (idx !== -1) this.currentFFTWrokers.splice(idx, 1);

            // Force reject so caller knows
            return Promise.reject('Processing cancelled');

        };
        const workerUUID = uuidv4();
        console.log("[Job]      FFT new worker ", workerUUID)
        this.PushNewWorker( workerUUID, workerPromise);

        try{
            await workerPromise.catch((err) => {console.log(err, "at", workerUUID);});
        } catch (err) {
            console.log("Err:", err, " on worker", workerUUID);
            return;
        }

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
        this.currentFFTWrokers.push({uuid: uuid, FFTPromise : worker});
        worker.then(() => {
            console.log("[Job]      FFT finished worker ", uuid)
            //If job manually stopped
            if(this.status !== JobStatus.INACTIVE 
                || this.status !==  JobStatus.PAUSED 
            ){
                this.CreateNextWorkerIfFree();
            }
        });
    }
    
    CreateNextWorkerIfFree(){
        if(this.GetFreeWorker() > 0){
            this.CreateFFTWorker(0);
        }  
    }
    resumeJob(){
        super.resumeJob();
        for(let i = this.currentFFTWrokers.length; i < this.currentConfig.ServerFFT.parallelCompute; i++){
            this.CreateFFTWorker(0);
        };
    }

    stopJob(){
        super.stopJob();
        this.status = JobStatus.INACTIVE; 
        this.currentFFTWrokers.forEach(({uuid, FFTPromise}) => {
            FFTPromise.cancel().catch(() => {});
        });
        this.currentFFTWrokers = [];
    };

    
}
module.exports = JobFFT;



const decodeFlacToPCM = (/** @type {string} */ filePath, /** @type {Number} */ sampleRate) => {
    let ffmpeg;
    const promise = new Promise((resolve, reject) => {
        const chunks = [];
        /**
         * Raw 32-bit float samples (f32le)
         * Mono channel (-ac 1)
         * Sample rate of 44100 Hz
         */
        ffmpeg = spawn('ffmpeg', [
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
                const pcmView = new Int16Array(
                    rawPCM.buffer,
                    rawPCM.byteOffset,
                    rawPCM.byteLength / Int16Array.BYTES_PER_ELEMENT
                );
                resolve(pcmView);
            }
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });
    });
    promise.cancel = () =>{
        ffmpeg.kill('SIGKILL');
        return Promise.reject('Processing cancelled');
    };
return promise;
};



const getSampleRate = (/** @type {string} */ filePath) => {
    let ffmpeg;
    const promise = new Promise((resolve, reject) => {
        ffmpeg = exec(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
          if (error) return reject(error);
          resolve(parseInt(stdout.trim(), 10));
        });
    });
    promise.cancel = () =>{
        ffmpeg.kill('SIGKILL');
        return Promise.reject('Processing cancelled');
    }
    return promise;
};



