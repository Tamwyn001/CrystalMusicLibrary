export const parseAudioDuration = (rawDuration) => {
    var pad = function(num) { return ('00'+num).slice(-2) };
    const hours = Math.floor(rawDuration / 3600);
    const minutes = Math.floor((rawDuration % 3600) / 60);
    const seconds = pad(Math.floor(rawDuration % 60));
    const readable = (hours > 0) ?
        `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    return { hours, minutes, seconds, readable };
}

export const parseDataSize = (rawSize) => {
    const kb = Math.floor(rawSize / 1024);
    const mb = Math.floor(kb / 1024);
    const gb = Math.floor(mb / 1024);
    const tb = Math.floor(gb / 1024);
    const readable = (tb > 0) ?
        `${tb}TB` : (gb > 0) ?
            `${gb}GB` : (mb > 0) ?
                `${mb}MB` : `${kb}KB`;
    return { kb, mb, gb, tb, readable };
}