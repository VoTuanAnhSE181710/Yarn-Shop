import { Play, Book, Video } from "lucide-react";

export function Learn() {
  const tutorials = [
    {
      id: 1,
      title: "Your First Chain Stitch",
      difficulty: "beginner",
      duration: "5 min",
      thumbnail: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      description: "Learn the foundation of all crochet projects—the chain stitch.",
    },
    {
      id: 2,
      title: "Reading Crochet Patterns",
      difficulty: "beginner",
      duration: "8 min",
      thumbnail: "https://images.unsplash.com/photo-1628723367681-5dc96eb6f1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      description: "Decode those confusing abbreviations and symbols like a pro.",
    },
    {
      id: 3,
      title: "Making Your First Granny Square",
      difficulty: "beginner",
      duration: "12 min",
      thumbnail: "https://images.unsplash.com/photo-1519412849983-957822373d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      description: "The classic crochet pattern that opens up endless possibilities.",
    },
  ];

  const resources = [
    {
      title: "Stitch Library",
      description: "Browse 50+ basic and advanced stitches with step-by-step photos.",
      icon: Book,
    },
    {
      title: "Video Tutorials",
      description: "Follow along with our beginner-friendly video series.",
      icon: Video,
    },
    {
      title: "Live Workshops",
      description: "Join our weekly live sessions and crochet together!",
      icon: Play,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="mb-4">Learn to Crochet</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From total beginner to confident maker—we'll guide you every stitch of the way.
            No judgment, just support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 border border-border text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="mb-2">{resource.title}</h3>
                <p className="text-muted-foreground text-sm">{resource.description}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="mb-6">Popular Tutorials</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow group cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {tutorial.duration}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                      {tutorial.difficulty}
                    </span>
                  </div>
                  <h4 className="mb-2">{tutorial.title}</h4>
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-4">Still Feeling Overwhelmed?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              That's totally normal! Crochet has a learning curve, but trust us—once it clicks,
              it's so rewarding. Start with our beginner kits that include everything you need
              plus guided video support.
            </p>
            <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors">
              Browse Beginner Kits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
