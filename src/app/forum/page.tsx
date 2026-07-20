"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaComments, FaSearch, FaPlus, FaChevronUp, FaUserCircle, FaTag, FaChevronLeft, FaPaperPlane } from 'react-icons/fa';
import styles from './page.module.css';

interface ForumReply {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorClass: string;
  isFounder: boolean;
  createdAt: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorClass: string;
  isFounder: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
  tags: string[];
  replies?: ForumReply[];
  _count?: {
    replies: number;
  };
}

const CATEGORIES = ['All Topics', 'Maths', 'Science', 'Exam Prep', 'General'];

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // Selected Thread Detail View state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newReplyText, setNewReplyText] = useState('');

  // Create Thread Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<string>('General');
  const [newPostTags, setNewPostTags] = useState('');

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) setCurrentUser(await res.json());
      } catch {}
    };
    fetchUser();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/forum/posts', window.location.origin);
      if (activeCategory !== 'All Topics') {
        url.searchParams.set('category', activeCategory);
      }
      if (searchQuery.trim()) {
        url.searchParams.set('search', searchQuery.trim());
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPostId) {
      const delayDebounceFn = setTimeout(() => {
        fetchPosts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeCategory, searchQuery, selectedPostId]);

  useEffect(() => {
    if (selectedPostId) {
      const fetchDetail = async () => {
        setIsDetailLoading(true);
        try {
          const res = await fetch(`/api/forum/posts/${selectedPostId}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedPost(data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsDetailLoading(false);
        }
      };
      fetchDetail();
    } else {
      setSelectedPost(null);
    }
  }, [selectedPostId]);

  // Upvote Post
  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`/api/forum/posts/${postId}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        
        // Optimistic UI update
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return prev;
            const updatedUpvotes = data.upvoted ? prev.upvotes + 1 : prev.upvotes - 1;
            const updatedUpvotedBy = data.upvoted 
              ? [...prev.upvotedBy, currentUser.id || currentUser.email]
              : prev.upvotedBy.filter(id => id !== (currentUser.id || currentUser.email));
            return { ...prev, upvotes: updatedUpvotes, upvotedBy: updatedUpvotedBy };
          });
        }
        
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const updatedUpvotes = data.upvoted ? post.upvotes + 1 : post.upvotes - 1;
            const updatedUpvotedBy = data.upvoted 
              ? [...post.upvotedBy, currentUser.id || currentUser.email]
              : post.upvotedBy.filter(id => id !== (currentUser.id || currentUser.email));
            return { ...post, upvotes: updatedUpvotes, upvotedBy: updatedUpvotedBy };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Reply
  const handleAddReply = async () => {
    if (!newReplyText.trim() || !selectedPostId) return;
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`/api/forum/posts/${selectedPostId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newReplyText.trim() })
      });
      if (res.ok) {
        const reply = await res.json();
        setSelectedPost(prev => prev ? {
          ...prev,
          replies: [...(prev.replies || []), reply]
        } : prev);
        setNewReplyText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit New Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
          tags: newPostTags
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        // Reset Form & Close Modal
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostCategory('General');
        setNewPostTags('');
        setShowCreateModal(false);
        
        // Jump into detail view of new post
        setSelectedPostId(newPost.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Detail Thread View */}
      {selectedPostId ? (
        <div className={styles.detailView}>
          <button onClick={() => setSelectedPostId(null)} className={styles.backBtn}>
            <FaChevronLeft /> Back to Discussions
          </button>

          {isDetailLoading || !selectedPost ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>Loading post details...</p>
            </div>
          ) : (
            <>
              <div className={`glass-panel ${styles.threadCard}`}>
                <div className={styles.threadHeader}>
                  <div className={styles.authorMeta}>
                    <FaUserCircle className={styles.authorAvatar} />
                    <div>
                      <span className={styles.authorName}>
                        {selectedPost.authorName}
                        {selectedPost.isFounder && <span className={styles.founderBadge}>BBA Founder</span>}
                      </span>
                      <span className={styles.authorSub}>
                        {selectedPost.authorClass} • {new Date(selectedPost.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleUpvote(selectedPost.id, e)} 
                    className={`${styles.voteBtn} ${currentUser && selectedPost.upvotedBy.includes(currentUser.id || currentUser.email) ? styles.voteActive : ''}`}
                  >
                    <FaChevronUp /> {selectedPost.upvotes}
                  </button>
                </div>

                <h1 className={styles.threadTitle}>{selectedPost.title}</h1>
                <p className={styles.threadContent}>{selectedPost.content}</p>

                <div className={styles.threadTags}>
                  <span className={styles.categoryBadge}>{selectedPost.category}</span>
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className={styles.tagBadge}>#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Replies Section */}
              <div className={styles.repliesBox}>
                <h3 className={styles.repliesTitle}>
                  Replies ({(selectedPost.replies || []).length})
                </h3>

                <div className={styles.repliesList}>
                  {(selectedPost.replies || []).map(reply => (
                    <div key={reply.id} className={`glass-panel ${styles.replyCard}`}>
                      <div className={styles.replyAuthor}>
                        <FaUserCircle className={styles.replyAvatar} />
                        <div>
                          <span className={styles.replyName}>
                            {reply.authorName}
                            {reply.isFounder && <span className={styles.founderBadge}>BBA Founder</span>}
                          </span>
                          <span className={styles.replySub}>
                            {reply.authorClass} • {new Date(reply.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <p className={styles.replyContent}>{reply.content}</p>
                    </div>
                  ))}

                  {(selectedPost.replies || []).length === 0 && (
                    <p className={styles.noReplies}>No replies yet. Be the first to help out!</p>
                  )}
                </div>

                {/* Post Reply Bar */}
                {currentUser ? (
                  <div className={styles.addReplyContainer}>
                    <textarea
                      placeholder="Type a helpful response..."
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      className={styles.replyInput}
                      rows={3}
                    />
                    <button onClick={handleAddReply} className={styles.submitReplyBtn}>
                      <FaPaperPlane /> Post Reply
                    </button>
                  </div>
                ) : (
                  <div className={`glass-panel ${styles.loginPrompt}`}>
                    <p>Please <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link> to join this discussion.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Discussion Bulletin Dashboard */
        <div className={styles.dashboardView}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <FaComments /> Community Forum
            </div>
            <h1 className={styles.title}>
              Discussion <span className="text-gradient">Hub</span>
            </h1>
            <p className={styles.subtitle}>
              Ask questions, share premium study materials, and brainstorm concepts with peers!
            </p>
          </div>

          {/* Controls Panel */}
          <div className={styles.controlsRow}>
            <div className={styles.searchWrapper}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search topics, questions, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button 
              onClick={() => currentUser ? setShowCreateModal(true) : window.location.href = '/login'} 
              className={styles.askBtn}
            >
              <FaPlus /> Start Discussion
            </button>
          </div>

          {/* Filter Row */}
          <div className={styles.filtersBar}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Thread Cards List */}
          <div className={styles.threadsList}>
            {isLoading ? (
              <div className={`glass-panel ${styles.emptyState}`}>
                <p>Loading discussions...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className={`glass-panel ${styles.emptyState}`}>
                <p>No active discussions found for this topic. Be the first to start a thread!</p>
              </div>
            ) : (
              posts.map(post => (
                <div 
                  key={post.id} 
                  className={`glass-panel ${styles.postCard}`}
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className={styles.postLeft}>
                    <button 
                      onClick={(e) => handleUpvote(post.id, e)} 
                      className={`${styles.votePill} ${currentUser && post.upvotedBy.includes(currentUser.id || currentUser.email) ? styles.votePillActive : ''}`}
                    >
                      <FaChevronUp />
                      <span>{post.upvotes}</span>
                    </button>
                  </div>
                  <div className={styles.postBody}>
                    <div className={styles.postMeta}>
                      <span className={styles.postCategory}>{post.category}</span>
                      <span className={styles.postAuthor}>Posted by {post.authorName} ({post.authorClass})</span>
                      <span className={styles.postDate}>
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    <p className={styles.postPreview}>{post.content}</p>
                    
                    <div className={styles.postFooter}>
                      <div className={styles.postTagsList}>
                        {post.tags.map(tag => (
                          <span key={tag} className={styles.postTag}>#{tag}</span>
                        ))}
                      </div>
                      <span className={styles.repliesCount}>
                        💬 {post._count?.replies || 0} replies
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Start Discussion Dialog Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={`glass-panel ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>🚀 Start a New Discussion</h2>
            <form onSubmit={handleCreatePost} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Thread Title</label>
                <input
                  type="text"
                  placeholder="e.g. Can someone help explain Joule's Heating Effect?"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Subject Category</label>
                  <select
                    value={newPostCategory}
                    onChange={(e: any) => setNewPostCategory(e.target.value)}
                    className={styles.select}
                  >
                    <option value="Maths">Maths</option>
                    <option value="Science">Science</option>
                    <option value="Exam Prep">Exam Prep</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tags (separated by comma)</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Class 10, Boards"
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description / Body Content</label>
                <textarea
                  placeholder="Provide details about your query, equation, or tips so others can answer thoroughly..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className={styles.textarea}
                  rows={6}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Publish Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
