export type Essay = {
  id: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
  caption: string;
  excerpt: string;
  content: string[];
  likes: number;
  tags?: string[];
  createdAt: number;
};
