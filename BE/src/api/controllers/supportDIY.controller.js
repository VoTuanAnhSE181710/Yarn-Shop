export default class SupportDIYController {
    constructor({ supportDIYService }) {
        this.supportDIYService = supportDIYService;
    }

    async getAllPosts(req, res, next) {
        try {
            const result = await this.supportDIYService.getPosts(req.query);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getPostById(req, res, next) {
        try {
            const { id } = req.params;
            const post = await this.supportDIYService.getPostById(id);
            res.status(200).json({
                status: 'success',
                data: { post }
            });
        } catch (error) {
            next(error);
        }
    }

    async createPost(req, res, next) {
        try {
            const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : { ...req.body };
            
            // Auto-assign creator from current user token
            if (!data.creatorId && req.user && req.user.userId) {
                data.creatorId = req.user.userId;
            }
            
            // Process uploaded images from multipart/form-data
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(f => f.path);
                if (!data.images) data.images = [];
                data.images.push(...imagePaths);
            }
            
            const post = await this.supportDIYService.createPost(data);
            res.status(201).json({
                status: 'success',
                data: { post }
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePost(req, res, next) {
        try {
            const { id } = req.params;
            const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : { ...req.body };
            
            // Process uploaded images from multipart/form-data
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(f => f.path);
                if (!data.images) data.images = [];
                data.images.push(...imagePaths);
            }
            
            const post = await this.supportDIYService.updatePost(id, data);
            res.status(200).json({
                status: 'success',
                data: { post }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ status: 'error', message: 'Status is required' });
            }
            const post = await this.supportDIYService.updateStatus(id, status);
            res.status(200).json({
                status: 'success',
                data: { post }
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePost(req, res, next) {
        try {
            const { id } = req.params;
            await this.supportDIYService.deletePost(id);
            res.status(200).json({
                status: 'success',
                message: 'Support DIY Post deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
