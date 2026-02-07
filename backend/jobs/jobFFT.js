
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const { join, basename } = require("path");
const {v4 : uuidv4} = require("uuid");
const { existsSync, writeFileSync } = require("fs");
const { spawn, exec } = require("child_process");
const { Worker } = require("worker_threads");
const JobsManager = require("../routes/jobs");
const path = require("path");
const { words } = require("lodash");

class FFTWorkerState {
    cancelled = false;
    /**@type {Promise<any>} */
    ffmpegPromise = null;
    /**@type {Worker} */
    worker;
    /**@type {Promise<any>} */
    workerPromise;
        /**@type {string} */

    uuid;
        /**@type {string} */

    audioPath;
};

/**
 * This job runs FFT of the audio files in parallel and write the result
 * into .bin files that can be streamed to the client's browser on playback.
 * 
 * Each audio file is decomposed into chuncks of x seconds. On each chunck 
 * we run a FFT and store the result. 
 * 
 * The job issues a promsie for each audio file. There is a list 
 * of avaliable worker that gets sliced if avaliable. The goal is 
 * to reuse the Worker rather than creating one for each file. 
 */
class JobFFT extends Job {
    /** @type {FFTWorkerState[]} */
    currentFFTWrokers = [];
    currentConfig = {};
    /** @type {string[]} */
    waitingList = [];
    /** @type {Worker []} */
    freeWorkersToUse = [];
    upgradeProgress(){
        this.updateProgress(this.progress.done + 1, this.progress.total);
    }
    
    /**
     * @param {{completeLibrary : boolean, tracks : string[]}} payload Do we have to recompute the whole library
     * @param {string} jobKey
     * @param {JobsManager} jobManager
     */
    constructor(jobKey, jobManager, payload)  {
        
        const completeLibrary = payload.completeLibrary || false;
        // @ts-ignore
        super( jobKey, jobManager, payload);
        
        // @ts-ignore
        this.currentConfig = require(jobManager.libraryConfig.configFilePath);
        if(completeLibrary){
            this.waitingList = this.GetWholeLibraryFiles();
        } else {
            this.waitingList = payload.tracks;
        }
        this.updateProgress(0, this.waitingList.length);
        for(let i = 0; i < this.currentConfig.ServerFFT.parallelCompute; i++){
            this.CreateFFTWorker(0);
        };

        
    };
    addNewTask(payload){
        this.waitingList.push(...payload.tracks);
    }

    GetFreeWorker() {
        return this.currentConfig.ServerFFT.parallelCompute - 
        this.currentFFTWrokers.length;
    }

    /**
     * @param {any} paths
     */
    AddFilesToFFT(paths) {
        // @ts-ignore
        this.currentConfig = require(jobManager.libraryConfig.configFilePath);
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
        const workerState = new FFTWorkerState();
      
        // Fetch the next audio file in the waiting list.
        if(this.waitingList.length == 0) {
            return;
        } ;
        workerState.audioPath = this.waitingList[waitingListId];
        this.waitingList.splice(0,1);


        // Creates and runs the worker/promise
        workerState.workerPromise = new Promise( async(resolve,reject) => {
           
            this.status = JobStatus.RUNNING;
            if (!existsSync(workerState.audioPath)) { resolve();}
            
            //STEP 0: Book a worker if exisiting:
            if(this.freeWorkersToUse.length > 0){
                workerState.worker = this.freeWorkersToUse.splice(0,1)[0];
                //Remove old listeners to register new ones
                workerState.worker.removeAllListeners("message");
                workerState.worker.removeAllListeners("error");
                workerState.worker.removeAllListeners("exit");
            }
            

            // STEP 1 : Audio to raw pcm data
            workerState.ffmpegPromise = getSampleRate(workerState.audioPath);
             /** @type {Number} */
            const sampleRate = await workerState.ffmpegPromise;
            if(workerState.cancelled) reject("Worker stopped");
            workerState.ffmpegPromise = decodeFlacToPCM(workerState.audioPath, sampleRate);
            /** @type {Int16Array} */
            const pcmView = await workerState.ffmpegPromise;
            if(!pcmView) {reject("No pcm data, maybe stopped"); return;};
            if(workerState.cancelled) {reject("Worker stopped"); return;};
            const pcmLength = pcmView.length;
            // const nextPow2 = Math.pow(2, Math.floor(Math.log2(pcmChunks[0].length)));
            const nextPow2 = this.currentConfig.ServerFFT.samples;

            // If no worker got booked, we create a new one
            if(!workerState.worker){
                const workerPath = join(__dirname, 'workers', 'fftWorker.js');    
                workerState.worker = new Worker(workerPath);
                // console.log("Created new worker");
            }
            // INTO the worker:
            // STEP 2 : Modify (trim) PCM data to match power 2, apply windowing
            // STEP 3 : Run FFT on each chunk and get amplitude and phase
            workerState.worker.postMessage({
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
                // STEP 4: Store the FFT into a int16 bin file
                const FFTpath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                    basename(workerState.audioPath).split(".")[0] + ".bin");
                const FFTStatPath = join(process.env.CML_DATA_PATH_RESOLVED, "ffts", 
                        "stat_"+ basename(workerState.audioPath).split(".")[0] + ".json");

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
                
            }

            workerState.worker.on("message", ({message , data}) => {
                switch (message) {
                    // When the worker says it is ready to start a new job (got cleaned up)
                    // we rseolve to trigger the next job.
                    // Tirggered from workerState.worker.postMessage({message : "FREE_MEMORY"});
                    case "WORKER_READY_FOR_NEXT":
                        // console.log("mermory freeded, ready for next work.");
                        if (workerState.worker) {
                            this.freeWorkersToUse.push(workerState.worker);
                            // console.log('Pushing worker pool');
                        }  
                        workerState.worker = null;
                        resolve();
                        break;
                    case "WORKER_DATA":
                        const {dataChunks, finished, uuid} = data;
                        if(workerState.cancelled) {return;} // Worker gets killed
                        result.push(...dataChunks);
                        if(!finished){
                            if(!workerState.worker){
                                console.warn("Worker not valid anymore on job", workerState);
                            }
                            workerState.worker.postMessage({message : "BATCH_RECIEVED"});
                            
                        } else {
                            const samplesPerChunk = sampleRate * this.currentConfig.ServerFFT.samplingInterval;

                            // Pass the ref of the worker and drop it
                            workerState.worker.postMessage({message : "FREE_MEMORY"});
                            console.log("             -> confirm thread with", result.length,
                                "chunks from", Math.ceil(pcmLength / samplesPerChunk), uuid);
                            writeFFTData(); 
                        }
                }
            });
            workerState.worker.on('error', reject);
            workerState.worker.on('exit', (code) => {
            if (code !== 0) reject(`Worker stopped with code ${code}`);
            });
        });
        workerState.workerPromise.cancel = () =>{
            workerState.cancelled = true;
            // Cancel ongoing ffmpeg processes
            if (workerState.ffmpegPromise && typeof workerState.ffmpegPromise.cancel === 'function') {
                workerState.ffmpegPromise.cancel().catch(() => {});
                workerState.ffmpegPromise = null;
            }
            if (workerState.worker) {
                workerState.worker.postMessage({message : "KILL"});
                workerState.worker = null;
            }
            // Clear large buffers

            workerState.workerPromise.pcmView = null;
            workerState.workerPromise.result = [];
            // Drop from workers list immediately
            const idx = this.currentFFTWrokers.findIndex(state => state.uuid === workerState.uuid);
            if (idx !== -1) this.currentFFTWrokers.splice(idx, 1);

            // Force reject so caller knows
            return Promise.reject('Processing cancelled');

        };
        workerState.uuid = uuidv4();
        console.log("[Job]      FFT new worker ", workerState.uuid)
        this.PushNewWorker(workerState);

        try{
            await workerState.workerPromise.catch((err) => {console.log(err, "at", workerState.uuid);});
        } catch (err) {
            console.log("Err:", err, " on worker", workerState.uuid);
            return;
        }

        // Remove the worker reference on completion
        const workerIndex = this.currentFFTWrokers.findIndex(
            state => state.uuid == workerState.uuid);
        this.currentFFTWrokers.splice(workerIndex, 1);
        this.upgradeProgress();
        this.progress.working = this.currentFFTWrokers.length;
        console.log("[Job]      FFT finished worker ", workerState.uuid,
             ". Remaining ", this.waitingList.length)
        if(this.currentFFTWrokers.length == 0 && this.waitingList.length == 0) {
            // Stops the job if all done.
            this.jobManager.stopJob(this.jobKey);
            return;
        }

        //If job manually stopped
        if(this.status !== JobStatus.INACTIVE 
            || this.status !==  JobStatus.PAUSED 
        ){
            this.CreateNextWorkerIfFree();
        }
    };

    /**
     * Create a new worker and takes care of creating the next one when finished.
     * @param {FFTWorkerState} worker 
     */
    PushNewWorker(worker) {
        this.currentFFTWrokers.push(worker);
        this.progress.working = this.currentFFTWrokers.length;
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
        this.currentFFTWrokers.forEach((state) => {
            state.workerPromise.cancel().catch((err) => {console.log(err)});
        });
        this.currentFFTWrokers = [];
        this.freeWorkersToUse.forEach(worker => {
            worker.postMessage({message : "CONFIRM_END"});
        });
        console.log("JOB stoped");
        this.freeWorkersToUse = [];
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
            else reject(`ffmpeg exited with code ${code}`);
        });
    }).catch(()=>{});
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
    }).catch(()=>{});
    promise.cancel = () =>{
        ffmpeg.kill('SIGKILL');
        return Promise.reject('Processing cancelled');
    }
    return promise;
};



