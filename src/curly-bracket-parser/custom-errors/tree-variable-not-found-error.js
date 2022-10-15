//<!-- MODULE -->//
if(typeof TreeVariableNotFoundError === 'undefined') {
//<!-- /MODULE -->//
class TreeVariableNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "TreeVariableNotFoundError";
    }
}
//<!-- MODULE -->//
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = TreeVariableNotFoundError;
    }
}
//<!-- /MODULE -->//