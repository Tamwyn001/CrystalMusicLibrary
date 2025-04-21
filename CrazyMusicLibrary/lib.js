export const parseAudioDuration = (rawDuration) => {
    var pad = function(num) { return ('00'+num).slice(-2) };
    const hours = Math.floor(rawDuration / 3600);
    const minutes = Math.floor((rawDuration % 3600) / 60);
    const seconds = pad(Math.floor(rawDuration % 60));
    const readable = (hours > 0) ?
        `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    return { hours, minutes, seconds, readable };
}