// // /app/blog/page.tsx
// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import React from "react";

// const categories = [
//   "All",
//   "Product Updates",
//   "News",
//   "Academy",
//   "Client Management",
//   "Ambassador",
//   "Features",
// ];

// const posts = [
//   {
//     id: "1",
//     title: "An online booking system: how does it work?",
//     excerpt: "A short intro to how booking flows work for your team and customers.",
//     author: "Jane Cooper",
//     date: "Nov 8, 2025",
//     category: "Product Updates",
//     image: "/images/card1.jpg",
//   },
//   {
//     id: "2",
//     title:
//       "4 reasons why all golf professionals need golf scheduling software",
//     excerpt: "Why scheduling matters and the top benefits for coaches and clubs.",
//     author: "Guy Hawkins",
//     date: "Sep 2, 2025",
//     category: "Features",
//     image: "/images/card2.jpg",
//   },
//   {
//     id: "3",
//     title:
//       "Booking a golf lesson in an online system: the advantages and disadvantages",
//     excerpt: "A balanced take on modern lesson-booking software.",
//     author: "Esther Howard",
//     date: "Aug 10, 2025",
//     category: "News",
//     image: "/images/card3.jpg",
//   },
// ];

// export default function BlogPage() {
//   const [active, setActive] = React.useState("All");

//   const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);

//   return (
//     <div className="min-h-screen bg-emerald-50 text-emerald-900">
//       {/* Header */}
//       <header className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <div
//             className="w-10 h-10 bg-emerald-700 rounded flex items-center justify-center text-white font-semibold"
//             aria-hidden="true"
//           >
//             PA
//           </div>
//           <nav className="hidden md:flex gap-6 text-sm items-center" aria-label="Main navigation">
//             <Link href="#" className="hover:underline">Our Services</Link>
//             <Link href="#" className="hover:underline">Case Studies</Link>
//             <Link href="#" className="hover:underline">Pricing</Link>
//             <Link href="#" className="hover:underline">About Us</Link>
//             <Link href="#" className="ml-4 inline-flex items-center gap-2 bg-emerald-700 text-white px-3 py-1 rounded-full text-sm">Live demo</Link>
//           </nav>
//         </div>

//         <div className="md:hidden">
//           {/* simple accessible mobile toggle placeholder */}
//           <button aria-label="Open menu" className="p-2 rounded-md hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600">☰</button>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 pb-20">
//         <h1 className="text-4xl md:text-5xl font-semibold mb-6">Blog</h1>

//         {/* category pills */}
//         <div className="flex flex-wrap gap-3 mb-8">
//           {categories.map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setActive(cat)}
//               aria-pressed={active === cat}
//               className={`px-4 py-2 rounded-full text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
//                 active === cat ? "bg-emerald-900 text-white" : "bg-white text-emerald-900"
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>

//         {/* hero banner */}
//         <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
//           <div className="md:col-span-2 bg-emerald-900 text-white rounded-2xl p-7 md:p-10 flex flex-col justify-between">
//             <div>
//               <h2 className="text-2xl md:text-3xl font-bold mb-3">5 advantages of golf scheduling software</h2>
//               <p className="text-emerald-100 max-w-xl leading-relaxed">
//                 We’re happy to announce Michael Jacobs, a top 50 teaching professional, as official ProAgenda.com ambassador. Michael is known for his excellent job.
//               </p>
//             </div>

//             <div className="mt-6">
//               <Link href="#" className="inline-flex items-center gap-3 bg-emerald-50 text-emerald-900 px-4 py-2 rounded-full font-medium hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600">
//                 Read full article
//               </Link>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 flex items-center justify-center">
//             {/* Replace with your SVG or image */}
//             <div className="w-full h-56 flex items-center justify-center">
//               {/* Decorative SVG illustration */}
//               <svg viewBox="0 0 200 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration">
//                 <rect x="0" y="0" width="200" height="120" rx="12" fill="#EEF2E9" />
//                 <g transform="translate(20,10)" fill="none" stroke="#166534" strokeWidth="2">
//                   <path d="M10 60 Q40 10 80 50" />
//                   <circle cx="120" cy="30" r="12" stroke="#EA580C" fill="#EA580C" />
//                 </g>
//               </svg>
//             </div>
//           </div>
//         </section>

//         {/* posts grid */}
//         <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {filtered.map((post) => (
//             <article key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
//               <div className="relative w-full h-44">
//                 {/* modern next/image usage: parent must be relative which it is */}
//                 <Image src={post.image} alt={post.title} fill className="object-cover" placeholder="blur" sizes="(max-width: 768px) 100vw, 33vw" />
//               </div>

//               <div className="p-5">
//                 <div className="text-xs text-emerald-600 mb-2">{post.category} • {post.date}</div>
//                 <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
//                 <p className="text-sm text-emerald-700 mb-4">{post.excerpt}</p>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-900 text-sm" aria-hidden="true">
//                       {post.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
//                     </div>
//                     <div className="text-sm text-emerald-700">{post.author}</div>
//                   </div>

//                   <Link href="#" className="text-sm text-emerald-900 font-medium hover:underline">Read</Link>
//                 </div>
//               </div>
//             </article>
//           ))}
//         </section>
//       </main>

//       <footer className="max-w-7xl mx-auto px-6 py-10 text-sm text-emerald-700">
//         © {new Date().getFullYear()} ProAgenda — Built for team collaboration: kanban, live meets, markdown, sheets, canvas.
//       </footer>
//     </div>
//   );
// }
"use client"; 

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
const heroIllustration = "/images/hero_blog.png";
const kanbanIllustration = "/images/img1.png";
const meetingIllustration = "/images/img2.png";
const productivityIllustration = "/images/img3.png";

const categories = [
  "All",
  "Product Updates",
  "News",
  "Tutorials",
  "Team Management",
  "Productivity",
  "Features",
];

const blogPosts = [
  {
    id: 1,
    title: "5 advantages of using collaborative project management software",
    excerpt: "We're happy to announce the release of our new collaborative tools that help teams work together more efficiently...",
    category: "Product Updates",
    author: {
      name: "Sarah Johnson",
      avatar: "SJ",
    },
    date: "2024-03-15",
    featured: true,
  },
  {
    id: 2,
    title: "How real-time collaboration transforms remote teams",
    excerpt: "Discover how synchronous editing and live updates can boost your team's productivity...",
    category: "Tutorials",
    author: {
      name: "Mike Chen",
      avatar: "MC",
    },
    date: "2024-03-12",
  },
  {
    id: 3,
    title: "4 reasons why teams need integrated communication tools",
    excerpt: "Learn why having all your communication in one place makes a difference...",
    category: "Team Management",
    author: {
      name: "Emily Rodriguez",
      avatar: "ER",
    },
    date: "2024-03-10",
  },
  {
    id: 4,
    title: "Managing projects with Kanban: best practices and tips",
    excerpt: "Master the art of visual project management with our comprehensive guide...",
    category: "Features",
    author: {
      name: "David Kim",
      avatar: "DK",
    },
    date: "2024-03-08",
  },
];

const getIllustration = (id: number) => {
  const illustrations = [kanbanIllustration, meetingIllustration, productivityIllustration];
  return illustrations[(id - 2) % illustrations.length];
};

const FeaturedBlogCard = ({ post }: { post: typeof blogPosts[0] }) => {
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-sm">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              {post.excerpt}
            </p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground w-fit rounded-full"
            size="lg"
          >
            Read full article
          </Button>
        </div>
        <div className="bg-secondary flex items-center justify-center p-8">
          <img 
            src={heroIllustration} 
            alt="Team collaboration illustration" 
            className="w-full h-full object-contain max-h-80"
          />
        </div>
      </div>
    </div>
  );
};

const BlogCard = ({ post }: { post: typeof blogPosts[0] }) => {
  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="aspect-video bg-secondary overflow-hidden">
        <img 
          src={getIllustration(post.id)} 
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {post.author.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{post.author.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(
    (post) => selectedCategory === "All" || post.category === selectedCategory
  );

  const featuredPost = filteredPosts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
     

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-8">Blog</h1>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <FeaturedBlogCard post={featuredPost} />
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Blog;
