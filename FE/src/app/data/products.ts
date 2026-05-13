export interface Product {
  id: string;
  name: string;
  price: number;
  category: "yarn" | "tools" | "kit";
  description: string;
  image: string;
  color?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  materials?: string[];
  weight?: string;
  yardage?: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Soft Cotton Yarn - Blush Pink",
    price: 12.99,
    category: "yarn",
    description: "Ultra-soft cotton yarn perfect for beginners. This gentle blush pink creates cozy, breathable pieces.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    color: "Blush Pink",
    weight: "DK Weight",
    yardage: 220,
  },
  {
    id: "2",
    name: "Rainbow Pastel Yarn Bundle",
    price: 34.99,
    category: "yarn",
    description: "A dreamy collection of 6 pastel colors. Perfect for creating gradient projects or mix-and-match pieces.",
    image: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    color: "Multi-color",
    weight: "Medium Weight",
    yardage: 150,
  },
  {
    id: "3",
    name: "Chunky Merino Wool - Sage Green",
    price: 18.99,
    category: "yarn",
    description: "Luxuriously soft merino wool in a calming sage green. Ideal for quick, cozy projects.",
    image: "https://images.unsplash.com/photo-1649680579917-4cc253d7761b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    color: "Sage Green",
    weight: "Chunky",
    yardage: 120,
  },
  {
    id: "4",
    name: "Sunset Gradient Yarn",
    price: 16.99,
    category: "yarn",
    description: "Self-striping yarn that creates beautiful sunset gradients as you crochet. No color changes needed!",
    image: "https://images.unsplash.com/photo-1649680603092-b0edd0e5e2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    color: "Gradient",
    weight: "DK Weight",
    yardage: 200,
  },
  {
    id: "5",
    name: "Beginner Crochet Hook Set",
    price: 24.99,
    category: "tools",
    description: "Complete set of ergonomic crochet hooks in all essential sizes. Designed for comfort during long crochet sessions.",
    image: "https://images.unsplash.com/photo-1682953745453-c537d3248028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    id: "6",
    name: "Premium Bamboo Hook Set",
    price: 32.99,
    category: "tools",
    description: "Eco-friendly bamboo hooks that are gentle on your hands. Smooth finish for effortless stitching.",
    image: "https://images.unsplash.com/photo-1620633437938-be73c35eb77e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    id: "7",
    name: "Cozy Blanket Starter Kit",
    price: 49.99,
    category: "kit",
    description: "Everything you need to create your first chunky blanket. Includes yarn, hook, and step-by-step video tutorial.",
    image: "https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    materials: ["5 skeins chunky yarn", "Size N hook", "Pattern booklet", "Video access"],
  },
  {
    id: "8",
    name: "Cute Amigurumi Animals Kit",
    price: 39.99,
    category: "kit",
    description: "Make adorable mini animals! Kit includes yarn in 6 colors, stuffing, safety eyes, and patterns for 3 animals.",
    image: "https://images.unsplash.com/photo-1630191631464-24a005b8cfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "intermediate",
    materials: ["6 yarn colors", "Polyfill stuffing", "Safety eyes", "3 patterns"],
  },
  {
    id: "9",
    name: "Self-Care Scrunchie Kit",
    price: 22.99,
    category: "kit",
    description: "Create trendy scrunchies for yourself or gifts! Quick project perfect for stress relief.",
    image: "https://images.unsplash.com/photo-1596536220107-16ea84ac5bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    difficulty: "beginner",
    materials: ["3 yarn skeins", "Hair ties", "Hook", "Pattern"],
  },
];

export interface CommunityPost {
  id: string;
  username: string;
  image: string;
  caption: string;
  likes: number;
  project: string;
}

export const communityPosts: CommunityPost[] = [
  {
    id: "1",
    username: "cozy_maker",
    image: "https://images.unsplash.com/photo-1586219835562-cc2cbaeb5ef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Just finished my first blanket! Took me 3 weeks but so worth it for those Netflix nights ☁️",
    likes: 234,
    project: "Cozy Blanket",
  },
  {
    id: "2",
    username: "yarn_therapy",
    image: "https://images.unsplash.com/photo-1519412849983-957822373d02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Crocheting between study sessions = best stress relief 💜",
    likes: 189,
    project: "Study Break Scarf",
  },
  {
    id: "3",
    username: "stitch_n_chill",
    image: "https://images.unsplash.com/photo-1628723367681-5dc96eb6f1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    caption: "Made these little guys for my friends! They loved them 🐻",
    likes: 312,
    project: "Amigurumi Bears",
  },
];
