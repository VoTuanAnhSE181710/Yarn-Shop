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

export interface CommunityPost {
  id: string;
  username: string;
  image: string;
  caption: string;
  likes: number;
  project: string;
}
