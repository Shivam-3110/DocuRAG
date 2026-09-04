function createChunks(text) {
    return text.split('\n\n').filter(chunk => chunk.trim() !== '');
}

module.exports = {
    createChunks
};
