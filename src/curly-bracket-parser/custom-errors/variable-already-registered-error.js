
class VariableAlreadyRegisteredError extends Error {
    constructor(message) {
        super(message);
        this.name = "VariableAlreadyRegisteredError";
    }
}

//<!-- MODULE -->//
if(typeof module !== 'undefined' && module.exports) {
    module.exports = VariableAlreadyRegisteredError;
}
//<!-- /MODULE -->//