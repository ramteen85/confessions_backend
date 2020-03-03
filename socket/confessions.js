module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('newconfession', (confession) => {
            io.emit('refresh', {});
        });

        socket.on('addMessage', (data) => {
            io.emit('addMessage', {data});
        });

        socket.on('refresh', () => {
            io.emit('refresh', {});
        });
    });
}