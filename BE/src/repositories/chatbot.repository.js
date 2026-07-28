import mongoose from "mongoose";
import ChatSession from "../models/chatSession.js";
import Course from "../models/course.js";
import DIYPost from "../models/diyPost.js";
import Kit from "../models/kit.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import Video from "../models/video.js";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCourseLevel(level) {
  const mapping = {
    beginner: "beginner",
    intermediate: "mid",
    mid: "mid",
    advanced: "pro",
    pro: "pro",
  };
  return mapping[level] || null;
}

export default class ChatbotRepository {
  findSession(sessionId) {
    return ChatSession.findOne({ sessionId });
  }

  createSession({ sessionId, userId = null }) {
    return ChatSession.create({ sessionId, userId: userId || null });
  }

  async appendMessages({
    sessionId,
    messages,
    currentIntent,
    profile,
  }) {
    const update = {
      $push: { messages: { $each: messages } },
      $set: {
        currentIntent,
        lastActivityAt: new Date(),
      },
    };

    if (profile && Object.keys(profile).length) {
      for (const [key, value] of Object.entries(profile)) {
        if (value !== undefined) {
          update.$set[`profile.${key}`] = value;
        }
      }
    }

    return ChatSession.findOneAndUpdate({ sessionId }, update, {
      returnDocument: "after",
    });
  }

  markHandoff({ sessionId, reason }) {
    return ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          status: "HANDOFF",
          "handoff.requestedAt": new Date(),
          "handoff.reason": reason || "Customer requested human support",
          lastActivityAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async findLearning({
    level,
    keyword,
    maxDuration,
    minRating = 0,
    limit = 5,
    userId,
  }) {
    const courseFilter = {
      isPublished: true,
      deletedAt: null,
      averageRating: { $gte: Number(minRating) || 0 },
    };
    const normalizedLevel = normalizeCourseLevel(level);
    if (normalizedLevel) courseFilter.level = normalizedLevel;

    const videoFilter = {
      isActive: true,
      status: "APPROVED",
      averageRating: { $gte: Number(minRating) || 0 },
    };
    if (maxDuration) {
      videoFilter.duration = { $lte: Number(maxDuration) };
    }

    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      courseFilter.$or = [
        { title: regex },
        { description: regex },
        { tags: regex },
      ];
      videoFilter.$or = [
        { title: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    const [courses, videos] = await Promise.all([
      Course.find(courseFilter)
        .sort({ averageRating: -1, enrolledCount: -1 })
        .limit(limit)
        .lean(),
      Video.find(videoFilter)
        .sort({ averageRating: -1, viewCount: -1 })
        .limit(limit)
        .lean(),
    ]);

    let enrolledIds = new Set();
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select("enrolled").lean();
      enrolledIds = new Set(
        (user?.enrolled || []).map((id) => String(id)),
      );
    }

    return {
      courses: courses.map((course) => ({
        ...course,
        enrolled: enrolledIds.has(String(course._id)),
      })),
      videos,
    };
  }

  findProducts({ category, keyword, limit = 100 }) {
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }
    return Product.find(filter)
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(limit)
      .lean();
  }

  async findDIY({ keyword, level, maxPrice, limit = 5 }) {
    const kitFilter = { isActive: true };
    if (level) {
      const levelMapping = {
        mid: "intermediate",
        pro: "advanced",
      };
      kitFilter.level = levelMapping[level] || level;
    }
    if (maxPrice) kitFilter.price = { $lte: Number(maxPrice) };

    const postFilter = { status: "Done" };
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), "i");
      kitFilter.$or = [
        { name: regex },
        { description: regex },
      ];
      postFilter.$or = [
        { title: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    const [kits, posts] = await Promise.all([
      Kit.find(kitFilter)
        .sort({ averageRating: -1, totalRatings: -1 })
        .limit(limit)
        .lean(),
      DIYPost.find(postFilter)
        .sort({ averageRating: -1, likeCount: -1 })
        .limit(limit)
        .lean(),
    ]);

    return { kits, posts };
  }
}
