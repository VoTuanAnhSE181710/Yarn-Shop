export default class AiAgentController {
  constructor({ aiAgentService }) {
    this.aiAgentService = aiAgentService;
  }

  health = async (_req, res, next) => {
    try {
      res.status(200).json(this.aiAgentService.getHealth());
    } catch (error) {
      next(error);
    }
  };

  createSession = async (req, res, next) => {
    try {
      const result = await this.aiAgentService.createSession({
        sessionId: req.body.sessionId,
        userId: req.user?.userId || req.user?._id || null,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  message = async (req, res, next) => {
    try {
      const result = await this.aiAgentService.handleMessage({
        ...req.body,
        userId: req.user?.userId || req.user?._id || null,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  confirm = async (req, res, next) => {
    try {
      const result = await this.aiAgentService.confirmOrder({
        ...req.body,
        userId: req.user?.userId || req.user?._id,
        request: req,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}
