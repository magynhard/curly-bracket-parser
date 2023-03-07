//<!-- MODULE -->//
if(typeof CircularReferenceError === 'undefined') {
//<!-- /MODULE -->//
class CircularReferenceError extends Error {
    constructor(message) {
        super(message);
        this.name = "CircularReferenceError";
    }
}
//<!-- MODULE -->//
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = CircularReferenceError;
    }
}
//<!-- /MODULE -->//