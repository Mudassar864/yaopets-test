import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  Home, 
  Search, 
  PlusCircle, 
  Heart, 
  Stethoscope, 
  MoreHorizontal,
  MessageCircle,
  Send,
  Bookmark
} from 'lucide-react';
import { FaPaw } from 'react-icons/fa';
import { Link, useLocation } from 'wouter';
import { useAuth } from "@/hooks/useAuth";
import OptimizedImage from "@/components/media/OptimizedImage";
import PersistentImage from "@/components/media/PersistentImage";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CommentsModal from "@/components/comments/CommentsModal";
import CommentSection from "@/components/comments/CommentSection";
import Header from "../components/layout/Header";
import { generateInitials } from "@/lib/utils";
import { interactionStorage, postStorage } from "@/utils/localStorageManager";

type Post = {
  id: number;
  userId: number;
  username: string;
  userPhotoUrl: string;
  content: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  date: string;
  isLiked: boolean;
  isSaved: boolean;
};

const DEMO_POSTS: Post[] = [
  {
    id: 101,
    userId: 1,
    username: "Alice",
    userPhotoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
    content: "Meet Luna! She's looking for a loving home. 🐾",
    imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80",
    likesCount: 12,
    commentsCount: 2,
    date: formatDistanceToNow(new Date(Date.now() - 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 102,
    userId: 2,
    username: "Bob",
    userPhotoUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    content: "Thor is a playful pup ready for adventure! 🐶",
    imageUrl: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&q=80",
    likesCount: 8,
    commentsCount: 1,
    date: formatDistanceToNow(new Date(Date.now() - 2 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 103,
    userId: 3,
    username: "Clara",
    userPhotoUrl: "https://randomuser.me/api/portraits/women/43.jpg",
    content: "Adopt Max and gain a loyal friend for life! 🦴",
    imageUrl: "https://images.unsplash.com/photo-1502672023488-70e25813f145?w=800&q=80",
    likesCount: 20,
    commentsCount: 4,
    date: formatDistanceToNow(new Date(Date.now() - 5 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 104,
    userId: 4,
    username: "David",
    userPhotoUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    content: "My cat Whiskers enjoying the sunshine today! 😺",
    imageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80",
    likesCount: 15,
    commentsCount: 3,
    date: formatDistanceToNow(new Date(Date.now() - 8 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 105,
    userId: 5,
    username: "Emma",
    userPhotoUrl: "https://randomuser.me/api/portraits/women/33.jpg",
    content: "Found this little guy abandoned. Taking him to the vet now. 💔",
    imageUrl: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=800&q=80",
    likesCount: 32,
    commentsCount: 7,
    date: formatDistanceToNow(new Date(Date.now() - 12 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 106,
    userId: 6,
    username: "Frank",
    userPhotoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    content: "Beach day with my best buddy! 🏖️",
    imageUrl: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&q=80",
    likesCount: 18,
    commentsCount: 2,
    date: formatDistanceToNow(new Date(Date.now() - 18 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 107,
    userId: 7,
    username: "Grace",
    userPhotoUrl: "https://randomuser.me/api/portraits/women/22.jpg",
    content: "My new rescue puppy! Meet Daisy 🌼",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    likesCount: 27,
    commentsCount: 5,
    date: formatDistanceToNow(new Date(Date.now() - 24 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 108,
    userId: 8,
    username: "Henry",
    userPhotoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    content: "Just donated to the local animal shelter. Every bit helps! 🙏",
    imageUrl: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=800&q=80",
    likesCount: 22,
    commentsCount: 3,
    date: formatDistanceToNow(new Date(Date.now() - 36 * 60 * 60 * 1000), { locale: ptBR, addSuffix: true }),
    isLiked: false,
    isSaved: false,
  }
];

export default function PetFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  // Initialize local interactions system
  useEffect(() => {
    if (user && user.id) {
      // console.log(`Local interactions system initialized for user ${user.id}`);
    }
  }, [user]);

  // Fetch posts from localStorage and add demo data
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      let allPosts: Post[] = [];

      // 1. Load posts from localStorage
      try {
        const savedPosts = postStorage.getAllPosts();
        if (Array.isArray(savedPosts) && savedPosts.length > 0) {
          allPosts = savedPosts.map(post => {
            const postId = post.id;
            const isLiked = user ? interactionStorage.isPostLiked(user.id, postId) : false;
            const isSaved = user ? interactionStorage.isPostSaved(user.id, postId) : false;
            
            return {
              id: postId,
              userId: post.userId,
              username: post.username || 'User',
              userPhotoUrl: post.userPhotoUrl || '',
              content: post.content || '',
              imageUrl: Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0
                ? post.mediaUrls[0]
                : post.imageUrl || '',
              likesCount: post.likesCount || 0,
              commentsCount: post.commentsCount || 0,
              date: post.createdAt
                ? formatDistanceToNow(new Date(post.createdAt), { locale: ptBR, addSuffix: true })
                : 'recently',
              isLiked,
              isSaved
            };
          });
        }
      } catch (localError) {
        console.error('Error loading posts from localStorage:', localError);
      }

      // 2. Add demo posts if no posts exist
      if (allPosts.length === 0) {
        allPosts = DEMO_POSTS.map(post => ({
          ...post,
          isLiked: user ? interactionStorage.isPostLiked(user.id, post.id) : false,
          isSaved: user ? interactionStorage.isPostSaved(user.id, post.id) : false
        }));
      }

      setPosts(allPosts);
      setIsLoading(false);
    };

    fetchPosts();
  }, [user]);

  const toggleLike = async (postId: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Login to like posts",
        variant: "destructive",
      });
      setLocation("/auth/login");
      return;
    }

    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const newIsLiked = !currentPost.isLiked;
    
    // Update local storage
    if (newIsLiked) {
      interactionStorage.likePost(user.id, postId);
    } else {
      interactionStorage.unlikePost(user.id, postId);
    }

    // Update UI
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: newIsLiked,
            likesCount: newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1)
          };
        }
        return post;
      })
    );
  };

  const toggleSave = async (postId: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Login to save posts",
        variant: "destructive",
      });
      setLocation("/auth/login");
      return;
    }

    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const newIsSaved = !currentPost.isSaved;
    
    // Update local storage
    if (newIsSaved) {
      interactionStorage.savePost(user.id, postId);
    } else {
      interactionStorage.unsavePost(user.id, postId);
    }

    // Update UI
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isSaved: newIsSaved
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-14">
      {/* Header */}
      <Header title="YaoPets" showFilters={true} />

      {/* Feed */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No posts available right now.</p>
            <Link href="/create-post">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full">
                Create a post
              </button>
            </Link>
          </div>
        ) : (
          posts.map(post => (
            <Card key={post.id} className="mb-6 border-0 shadow-none">
              {/* Post header */}
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar
                    className="h-8 w-8 mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => post.userId && setLocation(`/profile/${post.userId}`)}
                  >
                    {post.userPhotoUrl ? <AvatarImage src={post.userPhotoUrl} alt={post.username} /> : null}
                    <AvatarFallback>{generateInitials(post.username)}</AvatarFallback>
                  </Avatar>
                  <span
                    className="font-medium text-sm cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => post.userId && setLocation(`/profile/${post.userId}`)}
                  >
                    {post.username}
                  </span>
                </div>
                <MoreHorizontal size={20} className="text-gray-500" />
              </div>

              {/* Post content - image or text */}
              {post.imageUrl && post.imageUrl.trim() !== '' ? (
                <div className="w-full">
                  {post.imageUrl.startsWith('blob:') ? (
                    <PersistentImage
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-auto object-cover"
                      onImageLoad={(permanentUrl: string) => {
                        setPosts(currentPosts => {
                          return currentPosts.map((p: Post) => {
                            if (p.id === post.id) {
                              return { ...p, imageUrl: permanentUrl };
                            }
                            return p;
                          });
                        });
                        
                        // Update in localStorage
                        const storedPost = postStorage.getPostById(post.id);
                        if (storedPost) {
                          if (Array.isArray(storedPost.mediaUrls)) {
                            storedPost.mediaUrls[0] = permanentUrl;
                          } else {
                            storedPost.mediaUrls = [permanentUrl];
                          }
                          postStorage.updatePost(post.id, storedPost);
                        }
                      }}
                    />
                  ) : (
                    <OptimizedImage
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-auto object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-50">
                  <p className="text-lg">{post.content}</p>
                </div>
              )}

              {/* Post actions */}
              <div className="p-3">
                <div className="flex justify-between mb-2">
                  <div className="flex space-x-4">
                    <button onClick={() => toggleLike(post.id)}>
                      <FaPaw
                        className={`h-6 w-6 ${post.isLiked ? 'text-orange-500' : 'text-black'}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setIsCommentsModalOpen(true);
                      }}
                    >
                      <MessageCircle size={24} className="fill-black" />
                    </button>
                    <button>
                      <Send size={24} className="fill-black" />
                    </button>
                  </div>
                  <button onClick={() => toggleSave(post.id)}>
                    <Bookmark
                      size={24}
                      className={`transition-colors ${
                        post.isSaved
                          ? 'text-orange-500 fill-orange-500'
                          : 'text-black'
                      }`}
                    />
                  </button>
                </div>

                {/* Likes count */}
                <div className="font-semibold text-sm mb-1">{post.likesCount} likes</div>

                {/* Caption */}
                <div className="mb-1">
                  <span className="font-medium text-sm mr-1">{post.username}</span>
                  <span className="text-sm">{post.content}</span>
                </div>

                {/* Post date */}
                <div className="text-gray-400 text-xs mb-2">{post.date}</div>

                {/* Comments section */}
                <CommentSection 
                  postId={post.id}
                  commentsCount={post.commentsCount}
                  onCommentsCountChange={(count) => {
                    setPosts(prev =>
                      prev.map(p => {
                        if (p.id === post.id) {
                          return { ...p, commentsCount: count };
                        }
                        return p;
                      })
                    );
                  }}
                />
              </div>
            </Card>
          ))
        )}
      </main>

      {/* Comments modal */}
      {selectedPostId && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => setIsCommentsModalOpen(false)}
          postId={selectedPostId}
          commentsCount={posts.find(p => p.id === selectedPostId)?.commentsCount || 0}
          onCommentsCountChange={(count: number) => {
            setPosts(prev =>
              prev.map(p => {
                if (p.id === selectedPostId) {
                  return { ...p, commentsCount: count };
                }
                return p;
              })
            );
          }}
          initialComments={user ? interactionStorage.getPostComments(selectedPostId).map(comment => ({
            id: comment.id,
            content: comment.content,
            username: comment.username || 'User',
            userPhotoUrl: comment.userPhotoUrl,
            createdAt: comment.createdAt,
            likesCount: comment.likesCount || 0,
            isLiked: interactionStorage.isCommentLiked(user.id, comment.id),
            userId: comment.userId
          })) : []}
        />
      )}
    </div>
  );
}