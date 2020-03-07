module.exports = (io, User, _) => {
    const userData = new User();
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

        socket.on('online', (data) => {
            socket.join(data.room);
            userData.EnterRoom(socket.id, data.userId, data.room);
            const list = userData.GetList(data.room);
            io.emit('usersOnline', _.uniq(list));
        });

        socket.on('disconnect', () => {
            const user = userData.RemoveUser(socket.id);
            if(user) {
                const userArr = userData.GetList(user.room);
                const arr = _.uniq(userArr);
                console.log(arr);
                _.remove(arr, n => n === user.userId);
                io.emit('usersOnline', arr);
            }
        })
    });
}