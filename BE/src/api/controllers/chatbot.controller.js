class ChatbotController {
  #chatbotService;

  constructor({ chatbotService }) {
    this.#chatbotService = chatbotService;
  }

  health = async (_req, res, next) => {
    try {
      res.status(200).json(this.#chatbotService.getHealth());
    } catch (error) {
      next(error);
    }
  };

  menu = async (_req, res, next) => {
    try {
      res.status(200).json(this.#chatbotService.getMenu());
    } catch (error) {
      next(error);
    }
  };

  createSession = async (req, res, next) => {
    try {
      const result = await this.#chatbotService.createSession({
        sessionId: req.body.sessionId,
        userId: req.user?.userId || null,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  message = async (req, res, next) => {
    try {
      const result = await this.#chatbotService.handleMessage({
        ...req.body,
        userId: req.user?.userId || null,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  recommendLearn = async (req, res, next) => {
    try {
      const results = await this.#chatbotService.recommendLearn(
        req.body,
        req.user?.userId || null,
      );
      res.status(200).json({ status: "success", data: results });
    } catch (error) {
      next(error);
    }
  };

  recommendShop = async (req, res, next) => {
    try {
      const results = await this.#chatbotService.recommendShop(req.body);
      res.status(200).json({ status: "success", data: results });
    } catch (error) {
      next(error);
    }
  };

  recommendDIY = async (req, res, next) => {
    try {
      const results = await this.#chatbotService.recommendDIY(req.body);
      res.status(200).json({ status: "success", data: results });
    } catch (error) {
      next(error);
    }
  };

  adminContact = async (_req, res, next) => {
    try {
      res.status(200).json(this.#chatbotService.getAdminContact());
    } catch (error) {
      next(error);
    }
  };

  handoff = async (req, res, next) => {
    try {
      const result = await this.#chatbotService.requestHandoff({
        ...req.body,
        userId: req.user?.userId || null,
      });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default ChatbotController;
