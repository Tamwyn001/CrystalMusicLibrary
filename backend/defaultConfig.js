// Should we create FFT representations of the audio files on the server?
// This is used to stream a spectrum to the user.
// We avoid using web audio api because it breaks the background playback
// on Safari.
/**
  Should we create FFT representations of the audio files on the server?
 This is used to stream a spectrum to the user.
 We avoid using web audio api because it breaks the background playback
 on Safari.
 */
const defaultConfig = {
    ServerFFT : {
        useServerFFT : true,
        samples : 512,
        samplingInterval : 0.0166, //60fps
        parallelCompute : 5
    }
}

const UserDefaultConfig = {
    FFT : {
        bars : 255
    }
};

module.exports = {defaultConfig, UserDefaultConfig};