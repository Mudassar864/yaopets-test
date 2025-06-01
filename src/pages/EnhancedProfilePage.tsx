import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import CreatePostModal from "@/components/modals/CreatePostModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProfileHeader from "@/components/ui/profile/ProfileHeader";
import ProfileStats from "@/components/ui/profile/ProfileStats";
import ProfileGamification from "@/components/ui/profile/ProfileGamification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { userManagement, petStorage, interactionStorage, postStorage } from "@/utils/localStorageManager";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { FaPaw } from "react-icons/fa";
import { MessageCircle, Send, Bookmark } from "lucide-react";
import OptimizedImage from "@/components/media/OptimizedImage";
import CommentSection from "@/components/comments/CommentSection";
import CommentsModal from "@/components/comments/CommentsModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function EnhancedProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, updateUser, logout } = useAuth();
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [activeView, setActiveView] = useState<"posts" | "followers" | "following" | "friends">("posts");
  const [selectedTab, setSelectedTab] = useState("posts");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Determine if this is the current user's profile
  const isOwnProfile = !id || (user && String(id) === String(user.id));

  // Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationshipCounts, setRelationshipCounts] = useState({
    followerCount: 0,
    followingCount: 0,
    friendsCount: 0,
  });
  const [followingStatus, setFollowingStatus] = useState<{ isFollowing: boolean }>({ isFollowing: false });

  // Load profile data and posts
  useEffect(() => {
    const fetchData = async () => {
      // If viewing own profile, use current user data
      if (isOwnProfile && user) {
        setProfileData(user);
        const userPets = petStorage.getUserPets(user.id);
        setPets(userPets);
        const userSavedPosts = interactionStorage.getSavedPosts(user.id);
        setSavedPosts(userSavedPosts);
        const followers = userManagement.getFollowers(user.id);
        const following = userManagement.getFollowing(user.id);
        setRelationshipCounts({
          followerCount: followers.length,
          followingCount: following.length,
          friendsCount: 0,
        });
        // Fetch posts for the current user
        const userPosts = postStorage.getAllPosts().filter(post => post.userId === user.id);
        setPosts(userPosts.map(post => ({
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
        })));
      } 
      // If viewing another user's profile
      else if (id) {
        const userId = parseInt(id);
        const otherUser = userManagement.getUserById(userId);
        if (otherUser) {
          setProfileData(otherUser);
          const userPets = petStorage.getUserPets(userId);
          setPets(userPets);
          const followers = userManagement.getFollowers(userId);
          const following = userManagement.getFollowing(userId);
          setRelationshipCounts({
            followerCount: followers.length,
            followingCount: following.length,
            friendsCount: 0,
          });
          if (user) {
            const isFollowing = userManagement.isFollowing(user.id, userId);
            setFollowingStatus({ isFollowing });
          }
          // Fetch posts for the other user
          const userPosts = postStorage.getAllPosts().filter(post => post.userId === userId);
          setPosts(userPosts.map(post => ({
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
          })));
        } else {
          toast({
            title: "User not found",
            description: "The requested user profile does not exist",
            variant: "destructive",
          });
          setLocation("/");
        }
      }
    };

    fetchData();
  }, [id, user, isOwnProfile, setLocation, toast]);

  // Editing handlers
  const handleEditBio = () => {
    setNewBio(profileData?.bio || "");
    setIsEditingBio(true);
  };

  const handleSaveBio = () => {
    if (isOwnProfile && user) {
      updateUser({ bio: newBio });
      setProfileData((prev: any) => ({ ...prev, bio: newBio }));
    }
    setIsEditingBio(false);
    toast({ title: "Profile updated", description: "Bio updated successfully!" });
  };

  const handleEditWebsite = () => {
    setNewWebsite(profileData?.website || "");
    setIsEditingWebsite(true);
  };

  const handleSaveWebsite = () => {
    if (isOwnProfile && user) {
      updateUser({ website: newWebsite });
      setProfileData((prev: any) => ({ ...prev, website: newWebsite }));
    }
    setIsEditingWebsite(false);
    toast({ title: "Profile updated", description: "Website updated successfully!" });
  };

  const handleEditName = () => {
    setNewName(profileData?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (isOwnProfile && user) {
      updateUser({ name: newName });
      setProfileData((prev: any) => ({ ...prev, name: newName }));
    }
    setIsEditingName(false);
    toast({ title: "Profile updated", description: "Name updated successfully!" });
  };

  const handleEditCity = () => {
    setNewCity(profileData?.city || "");
    setIsEditingCity(true);
  };

  const handleSaveCity = () => {
    if (isOwnProfile && user) {
      updateUser({ city: newCity });
      setProfileData((prev: any) => ({ ...prev, city: newCity }));
    }
    setIsEditingCity(false);
    toast({ title: "Profile updated", description: "City updated successfully!" });
  };

  // Update profile photo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      if (isOwnProfile && user) {
        updateUser({ profileImage: imageUrl });
      }

      setProfileData((prev: any) => prev ? { ...prev, profileImage: imageUrl } : prev);
      toast({ title: "Profile updated", description: "Profile photo updated!" });
      setIsPhotoDialogOpen(false);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Logout
  const handleLogout = async () => {
    logout();
    setLocation("/auth/login");
  };

  // Follow/unfollow
  const handleFollowToggle = () => {
    if (!user || !profileData) return;

    const targetUserId = parseInt(id || "0");

    if (followingStatus.isFollowing) {
      userManagement.unfollowUser(user.id, targetUserId);
      setFollowingStatus({ isFollowing: false });
      setRelationshipCounts(prev => ({
        ...prev,
        followerCount: Math.max(0, prev.followerCount - 1),
      }));
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${profileData.name}`,
      });
    } else {
      userManagement.followUser(user.id, targetUserId);
      setFollowingStatus({ isFollowing: true });
      setRelationshipCounts(prev => ({
        ...prev,
        followerCount: prev.followerCount + 1,
      }));
      toast({
        title: "Following",
        description: `You are now following ${profileData.name}`,
      });
    }
  };

  // Message user
  const handleMessageUser = () => {
    if (!user || !profileData) return;
    setLocation(`/chat/${profileData.id}`);
  };

  // View change
  const handleViewChange = (view: "posts" | "followers" | "following" | "friends") => {
    setActiveView(view);
  };

  // Like/unlike post
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

    // Update post in localStorage
    const storedPost = postStorage.getPostById(postId);
    if (storedPost) {
      postStorage.updatePost(postId, {
        ...storedPost,
        likesCount: newIsLiked ? (storedPost.likesCount || 0) + 1 : Math.max(0, (storedPost.likesCount || 0) - 1),
      });
    }
  };

  // Save/unsave post
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
      setSavedPosts(prev => [...prev, currentPost]);
    } else {
      interactionStorage.unsavePost(user.id, postId);
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
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

  // User type label
  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'tutor': return 'Tutor';
      case 'doador': return 'Donor';
      case 'voluntário': return 'Volunteer';
      case 'veterinário': return 'Veterinarian';
      default: return type;
    }
  };

  if (!profileData) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="app-container bg-neutral-50">
      <Header
        title={isOwnProfile ? "My Profile" : "Profile"}
        showFilters={false}
        showBack={!isOwnProfile}
      />

      {/* Main Content */}
      <main className={activeView === 'posts' ? "pb-16" : "pb-4"}>
        {/* Modern Profile Header */}
        <ProfileHeader
          profileData={profileData}
          isOwnProfile={isOwnProfile}
          isEditingName={isEditingName}
          isEditingCity={isEditingCity}
          isEditingBio={isEditingBio}
          isEditingWebsite={isEditingWebsite}
          newName={newName}
          newCity={newCity}
          newBio={newBio}
          newWebsite={newWebsite}
          isPhotoDialogOpen={isPhotoDialogOpen}
          setIsPhotoDialogOpen={setIsPhotoDialogOpen}
          handleEditName={handleEditName}
          handleEditCity={handleEditCity}
          handleEditBio={handleEditBio}
          handleEditWebsite={handleEditWebsite}
          handleSaveName={handleSaveName}
          handleSaveCity={handleSaveCity}
          handleSaveBio={handleSaveBio}
          handleSaveWebsite={handleSaveWebsite}
          setNewName={setNewName}
          setNewCity={setNewCity}
          setNewBio={setNewBio}
          setNewWebsite={setNewWebsite}
          setIsEditingName={setIsEditingName}
          setIsEditingCity={setIsEditingCity}
          setIsEditingBio={setIsEditingBio}
          setIsEditingWebsite={setIsEditingWebsite}
          followingStatus={followingStatus}
          handleFollowToggle={handleFollowToggle}
          handleMessageUser={handleMessageUser}
          handleLogout={handleLogout}
          followUser={{ isPending: false }}
          unfollowUser={{ isPending: false }}
          updateProfile={{ isPending: false }}
          getUserTypeLabel={getUserTypeLabel}
        />

        <div className="px-4 mt-4">
          {/* Modern Profile Stats */}
          <ProfileStats
            relationshipCounts={relationshipCounts}
            pets={pets}
            savedPosts={savedPosts}
            activeView={activeView}
            handleViewChange={handleViewChange}
          />

          {/* Modern Gamification */}
          <div className="mb-4">
            <ProfileGamification
              points={profileData.points || 0}
              level={profileData.level || 'Beginner'}
              badges={profileData.achievementBadges || []}
            />
          </div>

          {/* Main content by selected view */}
          {activeView === 'posts' ? (
            <div className="space-y-4">
              <Tabs value={selectedTab} className="w-full" onValueChange={setSelectedTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <Card key={post.id} className="border-0 shadow-none">
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
                                <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <span
                              className="font-medium text-sm cursor-pointer hover:text-orange-500 transition-colors"
                              onClick={() => post.user.id && setLocation(`/profile/${post.user.id}`)}
                            >
                              {post.user.username}
                            </span>
                          </div>
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
                                  post.isSaved ? 'text-orange-500 fill-orange-500' : 'text-black'
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
                              // Update post in localStorage
                              const storedPost = postStorage.getPostById(post.id);
                              if (storedPost) {
                                postStorage.updatePost(post.id, { ...storedPost, commentsCount: count });
                              }
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
                  ) : (
                    <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                      <p className="text-neutral-600">No posts yet</p>
                      {isOwnProfile && (
                        <Button className="mt-3" onClick={() => setCreatePostModalOpen(true)}>
                          Create Post
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pets" className="space-y-4">
                  {pets && pets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {pets.map((pet: any) => (
                        <div key={pet.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div className="h-32 bg-neutral-200">
                            {pet.photos && pet.photos.length > 0 ? (
                              <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-icons text-neutral-400 text-4xl">pets</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium">{pet.name}</h4>
                            <p className="text-xs text-neutral-500">{pet.breed || pet.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                      <p className="text-neutral-600">No pets registered</p>
                      {isOwnProfile && (
                        <Button className="mt-3" onClick={() => setLocation("/new-pet")}>
                          Register a pet
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="space-y-4">
                  {savedPosts && savedPosts.length > 0 ? (
                    <div className="space-y-4">
                      {savedPosts.map((post: any) => (
                        <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                          {post.mediaUrls && post.mediaUrls.length > 0 ? (
                            post.mediaType === "video" ? (
                              <video src={post.mediaUrls[0]} controls className="w-full h-48 object-cover" />
                            ) : (
                              <img src={post.mediaUrls[0]} alt="Post" className="w-full h-48 object-cover" />
                            )
                          ) : (
                            <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
                              <span className="material-icons text-neutral-400 text-4xl">image</span>
                            </div>
                          )}
                          <div className="p-4">
                            <p className="text-sm">{post.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                      <p className="text-neutral-600">No saved posts</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Save posts by tapping the bookmark icon
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : activeView === 'followers' ? (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Followers</h3>
              {relationshipCounts.followerCount > 0 ? (
                <div className="space-y-3">
                  {userManagement.getFollowers(profileData.id).map((followerId: number) => {
                    const follower = userManagement.getUserById(followerId);
                    return follower ? (
                      <div key={follower.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            {follower.profileImage ? (
                              <AvatarImage src={follower.profileImage} alt={follower.name} />
                            ) : (
                              <AvatarFallback>{follower.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{follower.name}</p>
                            <p className="text-xs text-neutral-500">{follower.city || ''}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/profile/${follower.id}`)}>
                          View
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-center text-neutral-500">No followers yet</p>
              )}
            </div>
          ) : activeView === 'following' ? (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Following</h3>
              {relationshipCounts.followingCount > 0 ? (
                <div className="space-y-3">
                  {userManagement.getFollowing(profileData.id).map((followingId: number) => {
                    const following = userManagement.getUserById(followingId);
                    return following ? (
                      <div key={following.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            {following.profileImage ? (
                              <AvatarImage src={following.profileImage} alt={following.name} />
                            ) : (
                              <AvatarFallback>{following.name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">{following.name}</p>
                            <p className="text-xs text-neutral-500">{following.city || ''}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setLocation(`/profile/${following.id}`)}>
                          View
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-center text-neutral-500">Not following anyone yet</p>
              )}
            </div>
          ) : null}
        </div>
      </main>

      {/* Dialog for profile photo upload */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update profile photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <label
                htmlFor="profile-photo-upload"
                className="inline-block px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary/90 transition"
              >
                Select image
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            // Update post in localStorage
            const storedPost = postStorage.getPostById(selectedPostId);
            if (storedPost) {
              postStorage.updatePost(selectedPostId, { ...storedPost, commentsCount: count });
            }
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

      {/* Bottom Navigation */}
      {activeView === 'posts' && <BottomNavigation />}

      {/* Post Creation Modal */}
      <CreatePostModal
        open={createPostModalOpen}
        onOpenChange={setCreatePostModalOpen}
      />
    </div>
  );
}