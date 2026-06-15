"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaComments, FaSearch, FaPlus, FaChevronUp, FaUserCircle, FaTag, FaChevronLeft, FaPaperPlane } from 'react-icons/fa';
import styles from './page.module.css';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: 'Maths' | 'Science' | 'Exam Prep' | 'General';
  author: {
    name: string;
    class: string;
    isFounder?: boolean;
  };
  upvotes: number;
  upvotedBy: string[]; // list of user ids/emails who upvoted
  createdAt: string;
  replies: ForumReply[];
  tags: string[];
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    name: string;
    class: string;
    isFounder?: boolean;
  };
  createdAt: string;
}

const CATEGORIES = ['All Topics', 'Maths', 'Science', 'Exam Prep', 'General'];

const INITIAL_POSTS: ForumPost[] = [
  {
    id: 'post-1',
    title: '🔥 High-Yield Theorems for Class 10 Science Boards!',
    content: 'Hi everyone! I have summarized the top 5 most frequently asked physics and chemistry theorems for the upcoming boards. Pay special attention to Joule\'s Law of Heating and Snell\'s Law. Let me know if you need the full PDF notes!',
    category: 'Science',
    author: { name: 'Amit Sharma', class: 'Founder', isFounder: true },
    upvotes: 42,
    upvotedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    tags: ['Class 10', 'Physics', 'Chemistry', 'Boards'],
    replies: [
      {
        id: 'reply-1',
        content: 'Wow! This is extremely helpful sir, Snell\'s law derivations are always a bit tricky for me. Please share the notes!',
        author: { name: 'Rohan Gupta', class: 'Class 10' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'reply-2',
        content: 'I have uploaded the full Class 10 Science notes package in the /notes section! Do check them out.',
        author: { name: 'Amit Sharma', class: 'Founder', isFounder: true },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      }
    ]
  },
  {
    id: 'post-2',
    title: '📐 Quick Trigonometry Identities Shortcut Method',
    content: 'Do you get confused with values of sin, cos, tan at 30, 45, 60 degrees? Here is a simple hand-shortcut trick to remember the entire trigonometric table in under 10 seconds. Check it out: for sin, it\'s sqrt(fingers below)/2!',
    category: 'Maths',
    author: { name: 'Priya Patel', class: 'Class 11' },
    upvotes: 28,
    upvotedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    tags: ['Class 11', 'Trigonometry', 'Math Shortcuts'],
    replies: [
      {
        id: 'reply-3',
        content: 'Oh wow! I never knew about this sin hand trick. Makes remembering identities so much easier! Thanks Priya!',
        author: { name: 'Sunny Das', class: 'Class 10' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      }
    ]
  },
  {
    id: 'post-3',
    title: '⏰ What is your best revision strategy 1 month before exams?',
    content: 'Hey guys, with only 4 weeks left for the final exams, I am struggling to manage revision along with schools practicals. Should I solve past year question papers first or focus on re-reading textbook chapters? Let\'s discuss!',
    category: 'Exam Prep',
    author: { name: 'Nikhil Roy', class: 'Class 12' },
    upvotes: 19,
    upvotedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    tags: ['Exam Strategy', 'Revision', 'Study Tips'],
    replies: [
      {
        id: 'reply-4',
        content: 'Focus on 10-year question papers (from our /papers tab). That will give you direct insight into recurring question formats. Then cross-reference weak chapters with revision notes.',
        author: { name: 'Amit Sharma', class: 'Founder', isFounder: true },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      }
    ]
  }
];

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Selected Thread Detail View state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState('');

  // Create Thread Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Maths' | 'Science' | 'Exam Prep' | 'General'>('General');
  const [newPostTags, setNewPostTags] = useState('');

  // Fetch current user and load/initialize posts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/student/me');
        if (res.ok) setCurrentUser(await res.json());
      } catch {}
    };
    fetchUser();

    // Load from LocalStorage
    const cachedPosts = localStorage.getItem('bb_forum_posts');
    if (cachedPosts) {
      setPosts(JSON.parse(cachedPosts));
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem('bb_forum_posts', JSON.stringify(INITIAL_POSTS));
    }
  }, []);

  // Update localStorage when posts change
  const savePosts = (updatedPosts: ForumPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem('bb_forum_posts', JSON.stringify(updatedPosts));
  };

  // Upvote Post
  const handleUpvote = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const updated = posts.map(post => {
      if (post.id === postId) {
        const userId = currentUser.id || currentUser.email;
        const alreadyUpvoted = post.upvotedBy.includes(userId);
        return {
          ...post,
          upvotes: alreadyUpvoted ? post.upvotes - 1 : post.upvotes + 1,
          upvotedBy: alreadyUpvoted 
            ? post.upvotedBy.filter(id => id !== userId)
            : [...post.upvotedBy, userId]
        };
      }
      return post;
    });
    savePosts(updated);
  };

  // Submit Reply
  const handleAddReply = () => {
    if (!newReplyText.trim()) return;
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const newReply: ForumReply = {
      id: `reply-${Date.now()}`,
      content: newReplyText.trim(),
      author: {
        name: currentUser.name || currentUser.email.split('@')[0],
        class: `Class ${currentUser.class}`
      },
      createdAt: new Date().toISOString()
    };

    const updated = posts.map(post => {
      if (post.id === selectedPostId) {
        return {
          ...post,
          replies: [...post.replies, newReply]
        };
      }
      return post;
    });

    savePosts(updated);
    setNewReplyText('');
  };

  // Submit New Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const tagArray = newPostTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: newPostCategory,
      author: {
        name: currentUser.name || currentUser.email.split('@')[0],
        class: `Class ${currentUser.class}`
      },
      upvotes: 1,
      upvotedBy: [currentUser.id || currentUser.email],
      createdAt: new Date().toISOString(),
      replies: [],
      tags: tagArray.length > 0 ? tagArray : [newPostCategory]
    };

    const updated = [newPost, ...posts];
    savePosts(updated);

    // Reset Form & Close Modal
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostCategory('General');
    setNewPostTags('');
    setShowCreateModal(false);
    
    // Jump into detail view of new post
    setSelectedPostId(newPost.id);
  };

  // Filter Posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All Topics' || post.category === activeCategory;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div className={styles.container}>
      {/* Detail Thread View */}
      {selectedPostId && selectedPost ? (
        <div className={styles.detailView}>
          <button onClick={() => setSelectedPostId(null)} className={styles.backBtn}>
            <FaChevronLeft /> Back to Discussions
          </button>

          <div className={`glass-panel ${styles.threadCard}`}>
            <div className={styles.threadHeader}>
              <div className={styles.authorMeta}>
                <FaUserCircle className={styles.authorAvatar} />
                <div>
                  <span className={styles.authorName}>
                    {selectedPost.author.name}
                    {selectedPost.author.isFounder && <span className={styles.founderBadge}>BBA Founder</span>}
                  </span>
                  <span className={styles.authorSub}>
                    {selectedPost.author.class} • {new Date(selectedPost.createdAt).toLocaleDateString(undefined, {
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
              Replies ({selectedPost.replies.length})
            </h3>

            <div className={styles.repliesList}>
              {selectedPost.replies.map(reply => (
                <div key={reply.id} className={`glass-panel ${styles.replyCard}`}>
                  <div className={styles.replyAuthor}>
                    <FaUserCircle className={styles.replyAvatar} />
                    <div>
                      <span className={styles.replyName}>
                        {reply.author.name}
                        {reply.author.isFounder && <span className={styles.founderBadge}>BBA Founder</span>}
                      </span>
                      <span className={styles.replySub}>
                        {reply.author.class} • {new Date(reply.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <p className={styles.replyContent}>{reply.content}</p>
                </div>
              ))}

              {selectedPost.replies.length === 0 && (
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
            {filteredPosts.map(post => (
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
                    <span className={styles.postAuthor}>Posted by {post.author.name} ({post.author.class})</span>
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
                      💬 {post.replies.length} replies
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredPosts.length === 0 && (
              <div className={`glass-panel ${styles.emptyState}`}>
                <p>No active discussions found for this topic. Be the first to start a thread!</p>
              </div>
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
