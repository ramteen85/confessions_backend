class User {
    constructor() {
        this.globalArray = [];
    }

    EnterRoom(socketId, userId, room) {
        const user = { socketId: socketId, userId: userId, room: room };
        this.globalArray.push(user);
        return user;
    }

    GetUserId(id) {
        const socketId = this.globalArray.filter(userId => userId.socketId === id)[0];
        return socketId;
    }

    RemoveUser(id) {
        const user = this.GetUserId(id);
        if(user) {
            this.globalArray = this.globalArray.filter(userId => userId.socketId !== id);
        }
        return user;
    }

    GetList(room) {
        const roomName = this.globalArray.filter(user => user.room === room);
        const ids = roomName.map(user => user.userId);
        return ids;
    }
}

module.exports = { User };