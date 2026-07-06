export default class DIYPostController {
    constructor({ diyPostService }) {
        this.diyPostService = diyPostService;
    }

    async getAllPosts(req, res, next) {
        try {
            const result = await this.diyPostService.getPosts(req.query);
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
            const post = await this.diyPostService.getPostById(id);
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
            const data = { ...req.body };
            // Auto-assign creator if logged in and not specified in body
            if (!data.creatorId && req.user && req.user._id) {
                data.creatorId = req.user._id;
            }
            
            const post = await this.diyPostService.createPost(data);
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
            const post = await this.diyPostService.updatePost(id, req.body);
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
            await this.diyPostService.deletePost(id);
            res.status(200).json({
                status: 'success',
                message: 'DIY Post deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
