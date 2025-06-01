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
  content: string;
  mediaUrls: string[];
  mediaType: "image" | "gif" | "video";
  location: { address: string } | null;
  visibilityType: "public" | "private";
  postType: string;
  isStory: boolean;
  user: {
    id: number;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
};

const DEMO_POSTS: Post[] = [
  {
    id: 101,
    userId: 1,
    content: "Meet Luna! She's looking for a loving home. 🐾",
    mediaUrls: ["https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80"],
    mediaType: "image",
    location: null,
    visibilityType: "public",
    postType: "regular",
    isStory: false,
    user: {
      id: 1,
      username: "Alice",
      profileImage: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    likesCount: 12,
    commentsCount: 2,
    isLiked: false,
    isSaved: false,
  },
  // Add other demo posts similarly...
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

      // Load posts from localStorage
      try {
        const savedPosts = postStorage.getAllPosts();
        console.log('Loaded posts from localStorage:', savedPosts);
        if (Array.isArray(savedPosts) && savedPosts.length > 0) {
          allPosts = savedPosts.map(post => ({
            id: post.id,
            userId: post.userId,
            content: post.content || '',
            mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
            mediaType: post.mediaType || 'image',
            location: post.location || null,
            visibilityType: post.visibilityType || 'public',
            postType: post.postType || 'regular',
            isStory: post.isStory || false,
            user: {
              id: post.user?.id || post.userId,
              username: post.user?.username || 'User',
              profileImage: post.user?.profileImage || '',
            },
            createdAt: post.createdAt || new Date().toISOString(),
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            isLiked: user ? interactionStorage.isPostLiked(user.id, post.id) : false,
            isSaved: user ? interactionStorage.isPostSaved(user.id, post.id) : false,
          }));
        }
      } catch (localError) {
        console.error('Error loading posts from localStorage:', localError);
      }

      // Add demo posts if no posts exist
      if (allPosts.length === 0) {
        allPosts = DEMO_POSTS.map(post => ({
          ...post,
          isLiked: user ? interactionStorage.isPostLiked(user.id, post.id) : false,
          isSaved: user ? interactionStorage.isPostSaved(user.id, post.id) : false,
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
            likesCount: newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
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
          return { ...post, isSaved: newIsSaved };
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
                    onClick={() => post.user.id && setLocation(`/profile/${post.user.id}`)}
                  >
                    {post.user.profileImage ? (
                      <AvatarImage src={post.user.profileImage} alt={post.user.username} />
                    ) : (
                      <AvatarFallback>{generateInitials(post.user.username)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span
                    className="font-medium text-sm cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => post.user.id && setLocation(`/profile/${post.user.id}`)}
                  >
                    {post.user.username}
                  </span>
                </div>
                <MoreHorizontal size={20} className="text-gray-500" />
              </div>

              {/* Post content - image or video */}
              {post.mediaUrls.length > 0 && post.mediaUrls[0] ? (
                <div className="w-full">
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrls[0]}
                      controls
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <OptimizedImage
                      src={post.mediaUrls[0]}
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
                  <span className="font-medium text-sm mr-1">{post.user.username}</span>
                  <span className="text-sm">{post.content}</span>
                </div>

                {/* Post date */}
                <div className="text-gray-400 text-xs mb-2">
                  {formatDistanceToNow(new Date(post.createdAt), { locale: ptBR, addSuffix: true })}
                </div>

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
                  initialComments={user ? interactionStorage.getPostComments(post.id).map(comment => ({
                    id: comment.id,
                    content: comment.content,
                    username: comment.username || 'User',
                    userPhotoUrl: comment.userPhotoUrl,
                    createdAt: comment.createdAt,
                    likesCount: comment.likesCount || 0,
                    isLiked: interactionStorage.isCommentLiked(user.id, comment.id),
                    userId: comment.userId,
                  })) : []}
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
            userId: comment.userId,
          })) : []}
        />
      )}
    </div>
  );
}