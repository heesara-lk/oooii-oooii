import { Essay } from "./types";

const now = Date.now();

export const SAMPLE_ESSAYS: Essay[] = [
  {
    id: 'things-unfinished',
    title: 'Things Left Unfinished',
    date: new Date(now - 3*3600*1000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1200&auto=format&fit=crop',
    caption: 'Letters unsent, still loved',
    excerpt: 'Not everything needs closure. Some things need permission to stay open.',
    likes: 221,
    tags: ['closure'],
    createdAt: now - 3*3600*1000,
    content: [
      "We are told to finish everything. Close the loop. Get closure. But some stories are meant to stay slightly open, like a window.",
      "I have letters I never sent. Conversations I never finished. Drawings half-drawn. They are not failures. They are proof I was alive and trying, and life moved before I could finish.",
      "You are allowed to leave something unfinished and still be a complete person. Completion is not the only kind of wholeness.",
      "Today, pick one unfinished thing and bless it instead of fixing it. Say: you taught me as far as you could. Thank you.",
    ]
  },
  {
    id: 'slow-return',
    title: 'The Slow Return to Yourself',
    date: new Date(now - 20*3600*1000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
    caption: 'Forest breathing',
    excerpt: 'Coming home to yourself is not a sprint. It is a slow walk.',
    likes: 193,
    tags: ['return'],
    createdAt: now - 20*3600*1000,
    content: [
      "You left yourself slowly, without noticing. A little less sleep here, a little more yes when you meant no.",
      "So you will return slowly too. Not in one grand revelation. In small returns. Making tea the way you like it.",
      "Give yourself a year of slow returns. You do not have to become new. You have to become familiar again.",
    ]
  },
  {
    id: 'enough-today',
    title: 'You Were Enough Today',
    date: new Date(now - 50*3600*1000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop',
    caption: 'Light on an empty bench',
    excerpt: 'You do not have to become impressive to be worthy of rest.',
    likes: 265,
    tags: ['enough'],
    createdAt: now - 50*3600*1000,
    content: [
      "You don't have to earn the night. You don't have to finish the list to be allowed to lie down.",
      "Some days your best looks like brushing your teeth and answering one email. That is still a day you showed up.",
      "Tonight, place your hand where your heart is and say: I did what I could with what I had. That will be enough for today.",
    ]
  },
  {
    id: 'stay-soft',
    title: 'Stay Soft Anyway',
    date: new Date(now - 90*3600*1000).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
    caption: 'Morning tea in a chipped cup',
    excerpt: 'The world may harden you, but softness is not naivety.',
    likes: 176,
    tags: ['softness'],
    createdAt: now - 90*3600*1000,
    content: [
      "Stay soft. Not because the world is soft, but because you are.",
      "Softness is not weakness. It is the decision to keep your heart as a living thing, not a museum.",
      "You can have boundaries and still be tender. You can say no and still wish people well.",
    ]
  },
];
