//<!-- MODULE -->//
if(typeof UnresolvedVariablesError === 'undefined') {
//<!-- /MODULE -->//
class UnresolvedVariablesError extends Error {
    constructor(message) {
        super(message);
        this.name = "UnresolvedVariablesError";
    }
}
//<!-- MODULE -->//
    if(typeof module !== 'undefined' && module.exports) {
        module.exports = UnresolvedVariablesError;
    }
}
//<!-- /MODULE -->//