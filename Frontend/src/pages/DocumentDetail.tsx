import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Share2,
  Edit,
  Highlighter,
  StickyNote,
  MessageSquare,
  History,
  ArrowLeft,
  Users,
  Trash2,
  Send
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

interface DocumentWithDetails {
  id: string;
  title: string;
  content: string;
  summary?: string;
  urgency: 'low' | 'medium' | 'high';
  uploaded_by: string;
  created_at: string;
  department?: { name: string };
  profile?: { full_name: string };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  position?: any;
}

interface Highlight {
  id: string;
  user_id: string;
  text: string;
  color: string;
  created_at: string;
}

interface DocumentPermission {
  id: string;
  user_id: string;
  permission_level: 'view' | 'edit' | 'admin';
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [document, setDocument] = useState<DocumentWithDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'permissions' | 'notes' | 'highlights' | 'comments'>('comments');
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit' | 'admin'>('view');

  // Redirect to login if not logged in
  useEffect(() => {
    if (!profile) {
      navigate('/login');
    }
  }, [profile]);

  // Load mock or API data
  useEffect(() => {
    if (id && profile) {
      loadDocumentData();
    }
  }, [id, profile]);

  const loadDocumentData = async () => {
    setLoading(true);

    try {
      // Replace these with your API calls
      const fetchedDocument: DocumentWithDetails = {
        id: id!,
        title: 'Sample Document',
        content: 'This is a sample document content.',
        summary: 'This is a short summary.',
        urgency: 'medium',
        uploaded_by: profile!.id,
        created_at: new Date().toISOString(),
        department: { name: 'Engineering' },
        profile: { full_name: profile!.full_name }
      };

      const fetchedComments: Comment[] = [];
      const fetchedNotes: Note[] = [];
      const fetchedHighlights: Highlight[] = [];
      const fetchedPermissions: DocumentPermission[] = [];
      const fetchedProfiles: Profile[] = [profile!];

      setDocument(fetchedDocument);
      setComments(fetchedComments);
      setNotes(fetchedNotes);
      setHighlights(fetchedHighlights);
      setPermissions(fetchedPermissions);
      setAllProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error loading document data:', error);
    }

    setLoading(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !profile) return;
    const newC: Comment = {
      id: Date.now().toString(),
      user_id: profile.id,
      content: newComment,
      created_at: new Date().toISOString()
    };
    setComments([newC, ...comments]);
    setNewComment('');
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !profile) return;
    const newN: Note = {
      id: Date.now().toString(),
      user_id: profile.id,
      content: newNote,
      created_at: new Date().toISOString(),
      position: {}
    };
    setNotes([newN, ...notes]);
    setNewNote('');
  };

  const handleAddPermission = () => {
    if (!selectedUser) return;
    const newP: DocumentPermission = {
      id: Date.now().toString(),
      user_id: selectedUser,
      permission_level: permissionLevel
    };
    setPermissions([...permissions, newP]);
    setShowAddPermission(false);
    setSelectedUser('');
  };

  const handleDeletePermission = (id: string) => {
    setPermissions(permissions.filter(p => p.id !== id));
  };

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-gray-600">Document not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-73px)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
              <p className="text-sm text-gray-600">{document.department?.name} • {new Date(document.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-12">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    document.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    document.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {document.urgency.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-sm text-gray-500">
                    Uploaded by {document.profile?.full_name || 'Unknown'}
                  </span>
                </div>
                {document.summary && (
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                    <p className="text-sm text-gray-700">{document.summary}</p>
                  </div>
                )}
              </div>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
                {document.content || 'No content available'}
              </div>
            </div>
          </div>

          {/* Right Tabs */}
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="border-b border-gray-200">
              <div className="flex">
                {(['permissions', 'notes', 'highlights', 'comments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                  <button onClick={handleAddComment} className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                    <span>Post Comment</span>
                  </button>
                  <div className="space-y-4 mt-4">
                    {comments.map(c => (
                      <div key={c.id} className="border-b border-gray-200 pb-4">
                        <p className="text-sm font-medium">{profile.full_name}</p>
                        <p className="text-sm text-gray-700">{c.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                  <button onClick={handleAddNote} className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Add Note
                  </button>
                  <div className="space-y-3 mt-4">
                    {notes.map(n => (
                      <div key={n.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        {n.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add highlights and permissions similarly */}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
