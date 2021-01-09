
class InvalidFilterError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidFilterError";
    }
}

//<!-- MODULE -->//
if(typeof module !== 'undefined' && module.exports) {
    module.exports = InvalidFilterError;
}
//<!-- /MODULE -->//