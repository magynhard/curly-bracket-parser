
class FilterAlreadyRegisteredError extends Error {
    constructor(message) {
        super(message);
        this.name = "FilterAlreadyRegisteredError";
    }
}

//<!-- MODULE -->//
if(typeof module !== 'undefined' && module.exports) {
    module.exports = FilterAlreadyRegisteredError;
}
//<!-- /MODULE -->//