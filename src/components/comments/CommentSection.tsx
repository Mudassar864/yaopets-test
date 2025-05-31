import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, X, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CommentItem from "./CommentItem";
import { interactionStorage } from "@/utils/localStorageManager";

type Comment = {
  id: number;
  content: string;
  username: string;
  userPhotoUrl?: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  userId: number;
};

type CommentSectionProps = {
  postId: number;
  commentsCount?: number;
  onCommentsCountChange?: (count: number) => void;
  initialComments?: Comment[]; // pass comments from parent
};

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  commentsCount: initialCommentsCount = 0,
  onCommentsCountChange,
  initialComments = [],
}) => {
  const { user } = useAuth();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    initialComments.length || initialCommentsCount
  );

  // Load comments from localStorage if not provided
  useEffect(() => {
    if (initialComments.length === 0 && user) {
      const storedComments = interactionStorage.getPostComments(postId);
      if (storedComments.length > 0) {
        const formattedComments = storedComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          username: comment.username || 'User',
          userPhotoUrl: comment.userPhotoUrl,
          createdAt: comment.createdAt,
          likesCount: comment.likesCount || 0,
          isLiked: interactionStorage.isCommentLiked(user.id, comment.id),
          userId: comment.userId
        }));
        setComments(formattedComments);
        setCommentsCount(formattedComments.length);
      }
    }
  }, [postId, initialComments, user]);

  // Add comment using localStorage
  const handleCommentSubmit = () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);

    try {
      // Add comment to localStorage
      const comment = interactionStorage.addComment(user.id, postId, newComment.trim());
      
      // Create comment object for UI
      const newCommentObj: Comment = {
        id: comment.id,
        content: comment.content,
        username: user.username || user.name || "You",
        userPhotoUrl: user.profileImage || "",
        createdAt: comment.createdAt,
        likesCount: 0,
        isLiked: false,
        userId: user.id,
      };
      
      setComments((prev) => [newCommentObj, ...prev]);
      setCommentsCount((prev) => prev + 1);
      if (onCommentsCountChange) {
        onCommentsCountChange(commentsCount + 1);
      }
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle like on comment
  const handleLikeToggle = (commentId: number) => {
    if (!user) return;
    
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked;
          
          // Update in localStorage
          if (newIsLiked) {
            interactionStorage.likeComment(user.id, commentId);
          } else {
            interactionStorage.unlikeComment(user.id, commentId);
          }
          
          return {
            ...comment,
            isLiked: newIsLiked,
            likesCount: newIsLiked
              ? comment.likesCount + 1
              : Math.max(0, comment.likesCount - 1),
          };
        }
        return comment;
      })
    );
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);

    // Focus textarea when expanding
    setTimeout(() => {
      if (commentInputRef.current && !isExpanded) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="mt-2">
      {/* Expand/collapse button */}
      <button
        onClick={toggleExpanded}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MessageSquare size={18} className="mr-1" />
        {isExpanded ? "Hide comments" : `View ${commentsCount} comments`}
      </button>

      {isExpanded && (
        <>
          {/* New comment form */}
          <div className="flex gap-2 mt-3 mb-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.profileImage || ""} />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[40px] py-2 resize-none rounded-xl"
              />
              <Button 
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || isSubmitting || !user}
                className="absolute right-2 bottom-2 h-6 px-2 text-xs"
                variant="default"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
          {/* Comments list */}
          <div className="space-y-2 mb-3">
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    id={comment.id}
                    content={comment.content}
                    username={comment.username}
                    userPhotoUrl={comment.userPhotoUrl}
                    createdAt={comment.createdAt}
                    likesCount={comment.likesCount}
                    isLiked={comment.isLiked}
                    userId={comment.userId}
                    onLikeToggle={handleLikeToggle}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-2">
                Be the first to comment!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentSection;