import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import cloudinary from './cloudinary.js'

const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user_avatars',
        allowed_formats: ['jpg', 'png'],
        transformation: [{ quality: "auto", fetch_format: "auto" }]
    },
});

const aiChatStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai_chat',
        allowed_formats: ['jpg', 'png', 'pdf'],
        transformation: [{ quality: "auto", fetch_format: "auto" }]
    }
});


export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadChatMedia = multer({ storage: aiChatStorage });

const messageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'messages',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'mp4'],
        resource_type: 'auto', // allows different file types
        transformation: [{ quality: "auto", fetch_format: "auto" }]
    }
});

export const uploadMessageMedia = multer({ storage: messageStorage });

const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'videos',
        allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
        resource_type: 'video',
        transformation: [{ quality: "auto", fetch_format: "auto" }]
    }
});

export const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});
