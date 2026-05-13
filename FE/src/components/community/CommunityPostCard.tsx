import { Heart, MessageCircle } from "lucide-react";

interface Post {
  id: string;
  username: string;
  image: string;
  caption: string;
  likes: number;
  project: string;
  tags?: string[];
}

interface CommunityPostCardProps {
  post: Post;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden bg-muted">
        <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
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
        {post.tags && post.tags.length > 0 && (
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
  );
}
