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
