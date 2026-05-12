import { configDotenv } from 'dotenv';
import jwt from 'jsonwebtoken';
configDotenv();

const JWT_SECRET = process.env.JWT_SECRET;

export const socketAuth = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication Error: Token is not provided!'));
    }

    try {
        const decode = jwt.verify(token, JWT_SECRET);
        socket.user = decode
        next();
    } catch (error) {
        return next(new Error('Authentication error: Invalid token'))
    }
}