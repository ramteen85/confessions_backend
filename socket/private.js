module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('joinchat', (data) => {
            socket.join(data.typingObject.room1);
            socket.join(data.typingObject.room2);
            console.log('user has joined the room');
        });

        socket.on('istyping', (data) => {
            console.log(data);
            io.to(data.userData.receiverId).emit('istyping', data);
        });

        socket.on('stoptyping', (data) => {
            console.log(data);
            io.to(data.userData.receiverId).emit('stoptyping', data);
        });
    });
}