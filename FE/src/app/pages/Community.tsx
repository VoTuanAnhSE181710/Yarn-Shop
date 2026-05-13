import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { communityPosts as defaultPosts } from "../data/products";
import { CommunityUploadModal } from "../components/CommunityUploadModal";
import { useAuth } from "../context/AuthContext";

interface UserPost {
  id: string;
  username: string;
  image: string;
  caption: string;
  likes: number;
  project: string;
  tags?: string[];
}

export function Community() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const { user } = useAuth();

  const allPosts = [...userPosts, ...defaultPosts];

  const handleUploadSubmit = (post: {
    image: string;
    title: string;
    description: string;
    tags: string[];
  }) => {
    const newPost: UserPost = {
      id: `user-${Date.now()}`,
      username: user?.name.toLowerCase().replace(" ", "_") || "anonymous",
      image: post.image,
      caption: post.description || post.title,
      likes: 0,
      project: post.title,
      tags: post.tags,
    };
    setUserPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="mb-4">Community Gallery</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your creations, get inspired, and connect with fellow makers.
            We're all learning together! 💛
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12 text-center">
          <h3 className="mb-3">Share Your Latest Make</h3>
          <p className="text-muted-foreground mb-6">
            Finished a project? Show it off! Use #CozyStitchCreations
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Upload Your Creation
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPosts.map((post) => (
            <div
              key={post.id}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {post.username[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">@{post.username}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{post.caption}</p>
                {"tags" in post && post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                    {post.project}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-card rounded-2xl p-8 border border-border">
          <h2 className="mb-6 text-center">Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2">✨ Be Kind & Supportive</h4>
              <p className="text-muted-foreground text-sm">
                Everyone's at different skill levels. Celebrate progress, not perfection.
              </p>
            </div>
            <div>
              <h4 className="mb-2">🎨 Share Your Process</h4>
              <p className="text-muted-foreground text-sm">
                WIPs (works in progress) are just as welcome as finished pieces!
              </p>
            </div>
            <div>
              <h4 className="mb-2">💬 Ask Questions</h4>
              <p className="text-muted-foreground text-sm">
                Stuck on a stitch? Need pattern help? This community's got your back.
              </p>
            </div>
            <div>
              <h4 className="mb-2">🌈 Celebrate Creativity</h4>
              <p className="text-muted-foreground text-sm">
                There's no "wrong" way to crochet. Embrace your unique style!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
