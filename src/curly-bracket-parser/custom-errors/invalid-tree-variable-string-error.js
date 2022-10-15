//<!-- MODULE -->//
if(typeof InvalidTreeVariableStringError === 'undefined') {
//<!-- /MODULE -->//
class InvalidTreeVariableStringError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidTreeVariableStringError";
    }
}
//<!-- MODULE -->//
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = InvalidTreeVariableStringError;
    }
}
//<!-- /MODULE -->//