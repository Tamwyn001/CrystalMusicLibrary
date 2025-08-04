const { promises } = require("readline");
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const {parseFile} = require('music-metadata');
const { join, basename, resolve } = require("path");
const {v4 : uuidv4} = require("uuid");
const FFT = require("fft.js");
const { existsSync } = require("fs");
const { reject } = require("lodash");
const { spawn, exec } = require("child_process");

class JobFFT extends Job {

    currentFFTWrokers = [];
    currentConfig = {};

    upgradeProgress(){
        this.updateProgress(this.progress.done + 1, this.progress.total);
    }
    
    /**
     * @param {boolean} completeLibrary Do we have to recompute the whole library
     */
    constructor(completeLibrary)  {
        // @ts-ignore
        super(...arguments);
        this.status = JobStatus.PENDING;
        this.fetchTracks();
       
    }  

    AddFilesToFFT(paths) {
        // @ts-ignore
        this.currentConfig = require('../config/config.json');
        const freeWorkers = this.currentConfig.ServerFFT.parallelCompute - 
            this.currentFFTWrokers.length;
        if(freeWorkers > 0){
            
        }
    }

    CreateFFTWorker(path){
        const worker = new Promise( async(resolve,reject) => {
            if (!existsSync(path)) { resolve();}
            // STEP 1 : Audio to raw pcm data
            const sampleRate = GetSampleRate(path);
            const pcmBuffer = await DecodeFlacToPCM(path);
            const pcmChunks = ChunkPCM(pcmBuffer, sampleRate,
                 this.currentConfig.ServerFFT.samplingInterval);
            const f = new FFT(this.currentConfig.ServerFFT.samples);
            const out = f.createComplexArray();
            const realInput = new Array(f.size);
            f.realTransform(out,    );
        });
        const workerUUID = uuidv4();
        this.currentFFTWrokers.push({uuid : workerUUID, worker : worker});
    }

    
}
module.exports = JobFFT;

const DecodeFlacToPCM = (filePath) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        /**
         * Raw 32-bit float samples (f32le)
         * Mono channel (-ac 1)
         * Sample rate of 44100 Hz
         */
        const ffmpeg = spawn('ffmpeg', [
            '-i', filePath,
            '-f', 'f32le',
            '-ac', '1',
            '-ar', '44100',
            'pipe:1'
        ]);
        ffmpeg.stdout.on('data', (data) => chunks.push(data));
        ffmpeg.stderr.on('data', (err) => console.error(err.toString()));

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve(Buffer.concat(chunks));
            else reject(new Error(`ffmpeg exited with code ${code}`));
        });

    });
};

const ChunkPCM = (buffer, sampleRate, secondsPerChunk) => {
    const chunkSize = sampleRate * secondsPerChunk;
    const floatArray = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
    
    const chunks = [];
    for (let i = 0; i < floatArray.length; i += chunkSize) {
      chunks.push(floatArray.slice(i, i + chunkSize));
    }
    return chunks;
};

const GetSampleRate = (filePath) => {
    return new Promise((resolve, reject) => {
      exec(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
        if (error) return reject(error);
        resolve(parseInt(stdout.trim(), 10));
      });
    });
  }



