
class FileNotRetrievedError extends Error {
    constructor(message) {
        super(message);
        this.name = "FileNotRetrievedError";
    }
}

//<!-- MODULE -->//
if(typeof module !== 'undefined' && module.exports) {
    module.exports = FileNotRetrievedError;
}
//<!-- /MODULE -->//