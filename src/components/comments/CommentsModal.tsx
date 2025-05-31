import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, X, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CommentItem from "./CommentItem";
import { interactionStorage } from "@/utils/localStorageManager";

// Client-side comment interface
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

type CommentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  commentsCount: number;
  onCommentsCountChange?: (count: number) => void;
  initialComments?: Comment[]; // Pass comments from parent
};

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
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
  const [commentsCount, setCommentsCount] = useState(
    initialComments.length || initialCommentsCount
  );
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Focus the comment input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 300);
    }
  }, [isOpen, postId]);

  // Submit comment using localStorage
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

  // Like/unlike comment
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col animate-slide-up"
        style={{ transform: "translateY(0)" }}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
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
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <MessageSquare size={48} className="mb-2" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* New comment form */}
        <div className="border-t p-4">
          <div className="flex gap-2">
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
                className="min-h-[40px] py-2 resize-none rounded-xl pr-20"
              />

              <Button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || isSubmitting || !user}
                className="absolute right-2 bottom-2 h-7 px-2 rounded-full"
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
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;