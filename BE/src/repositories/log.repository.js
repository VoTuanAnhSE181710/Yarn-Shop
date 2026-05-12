class LogRepository {
    async saveLog({
        action,
        targetType,
        outcome,
        actorId = null,
        details = {},
    }) {
        return {
            action,
            targetType,
            outcome,
            actorId,
            details,
            timestamps: new Date(),
        };
    }
}

export default LogRepository;
