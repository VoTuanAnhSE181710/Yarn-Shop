import { NotFoundError, BadRequestError } from "../error/error.js";

export default class SupportDIYService {
    constructor({ supportDIYRepository, notificationService }) {
        this.supportDIYRepository = supportDIYRepository;
        this.notificationService = notificationService;
    }

    async getPosts(query) {
        const { page = 1, limit = 10, status, creatorId, linkedComboId, linkedProductId } = query;
        let filter = {};

        if (status) filter.status = status;
        if (creatorId) filter.creatorId = creatorId;
        if (linkedComboId) filter['linkedCombo.comboId'] = linkedComboId;
        if (linkedProductId) filter['linkedProduct.productId'] = linkedProductId;

        return this.supportDIYRepository.findAll({
            filter,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    }

    async getPostById(id) {
        const post = await this.supportDIYRepository.findById(id);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }

    async createPost(data) {
        const post = await this.supportDIYRepository.create(data);
        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "SUPPORT", priority: "NORMAL", title: "Đã gửi yêu cầu hỗ trợ DIY",
                message: `Yêu cầu '${post.title}' của bạn đã được gửi thành công.`,
                userId: data.creatorId
            }).catch(console.error);
            await this.notificationService.createNotification({
                type: "SUPPORT", priority: "NORMAL", title: "Yêu cầu hỗ trợ DIY mới",
                message: `Có yêu cầu hỗ trợ DIY mới: '${post.title}'.`,
                targetRole: "Admin"
            }).catch(console.error);
        }
        return post;
    }

    async updatePost(id, data) {
        const post = await this.supportDIYRepository.update(id, data);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }

    async updateStatus(id, status) {
        const validStatuses = ["Pending", "Done", "Cancel"];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }
        const post = await this.supportDIYRepository.update(id, { status });
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        if (this.notificationService) {
            await this.notificationService.createNotification({
                type: "SUPPORT", priority: "NORMAL", title: "Cập nhật yêu cầu hỗ trợ DIY",
                message: `Yêu cầu '${post.title}' của bạn đã chuyển sang trạng thái: ${status}.`,
                userId: post.creatorId
            }).catch(console.error);
        }
        return post;
    }

    async deletePost(id) {
        const post = await this.supportDIYRepository.delete(id);
        if (!post) {
            throw new NotFoundError("Support DIY Post not found");
        }
        return post;
    }
}
