//<!-- MODULE -->//
if(typeof InvalidVariableError === 'undefined') {
//<!-- /MODULE -->//
class InvalidVariableError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidVariableError";
    }
}
//<!-- MODULE -->//
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = InvalidVariableError;
    }
}
//<!-- /MODULE -->//