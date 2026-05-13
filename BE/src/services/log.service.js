export default class LogService {
    constructor({ logRepository }) {
        this.logRepository = logRepository;
    }
    async getLogs(filter, pagination) {
        return this.logRepository.getLogs(filter, pagination);
    }
    async getStatistics() {
        const statistics = await this.logRepository.getStatistics();
        return {
            message: 'Log statistics retrieved successfully.',
            data: statistics
        };
    }
}