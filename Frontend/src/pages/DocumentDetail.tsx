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
  X,
  Send,
  Trash2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { DocumentWithDetails, Comment, Note, Highlight, DocumentPermission, Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    if (id) {
      loadDocumentData();
    }
  }, [id]);

  const loadDocumentData = async () => {
    if (!id) return;

    setLoading(true);

    const [docResult, commentsResult, notesResult, highlightsResult, permissionsResult, profilesResult] = await Promise.all([
      supabase
        .from('documents')
        .select(`
          *,
          department:departments(*),
          profile:profiles(*)
        `)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('comments')
        .select('*')
        .eq('document_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select('*')
        .eq('document_id', id)
        .eq('user_id', profile?.id || '')
        .order('created_at', { ascending: false }),
      supabase
        .from('highlights')
        .select('*')
        .eq('document_id', id)
        .eq('user_id', profile?.id || ''),
      supabase
        .from('document_permissions')
        .select('*')
        .eq('document_id', id),
      supabase.from('profiles').select('*')
    ]);

    if (docResult.data) setDocument(docResult.data);
    if (commentsResult.data) setComments(commentsResult.data);
    if (notesResult.data) setNotes(notesResult.data);
    if (highlightsResult.data) setHighlights(highlightsResult.data);
    if (permissionsResult.data) setPermissions(permissionsResult.data);
    if (profilesResult.data) setAllProfiles(profilesResult.data);

    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !profile || !id) return;

    const { error } = await supabase.from('comments').insert({
      document_id: id,
      user_id: profile.id,
      content: newComment
    });

    if (!error) {
      setNewComment('');
      loadDocumentData();
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile || !id) return;

    const { error } = await supabase.from('notes').insert({
      document_id: id,
      user_id: profile.id,
      content: newNote,
      position: {}
    });

    if (!error) {
      setNewNote('');
      loadDocumentData();
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUser || !id || !profile) return;

    const { error } = await supabase.from('document_permissions').insert({
      document_id: id,
      user_id: selectedUser,
      permission_level: permissionLevel,
      granted_by: profile.id
    });

    if (!error) {
      setShowAddPermission(false);
      setSelectedUser('');
      loadDocumentData();
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    const { error } = await supabase
      .from('document_permissions')
      .delete()
      .eq('id', permissionId);

    if (!error) {
      loadDocumentData();
    }
  };

  if (loading) {
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
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Document not found</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-73px)] flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
                <p className="text-sm text-gray-600">
                  {document.department?.name} • {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Highlighter className="w-4 h-4" />
                <span>Highlight</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <History className="w-4 h-4" />
                <span>Version History</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Traceability</h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Original Source</p>
                <p className="text-xs text-blue-700 mt-1">Section 1.1</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Related Documents</p>
                <p className="text-xs text-gray-600 mt-1">3 linked items</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">References</p>
                <p className="text-xs text-gray-600 mt-1">5 citations</p>
              </div>
            </div>
          </div>

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

              <div className="prose max-w-none">
                {document.content ? (
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {document.content}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No content available</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="border-b border-gray-200">
              <div className="flex">
                {(['permissions', 'notes', 'highlights', 'comments'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'permissions' && <Users className="w-4 h-4 mx-auto" />}
                    {tab === 'notes' && <StickyNote className="w-4 h-4 mx-auto" />}
                    {tab === 'highlights' && <Highlighter className="w-4 h-4 mx-auto" />}
                    {tab === 'comments' && <MessageSquare className="w-4 h-4 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {activeTab === 'permissions' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Permissions</h3>
                    <button
                      onClick={() => setShowAddPermission(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add User
                    </button>
                  </div>

                  {showAddPermission && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select user...</option>
                        {allProfiles
                          .filter(p => !permissions.find(perm => perm.user_id === p.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                          ))}
                      </select>
                      <select
                        value={permissionLevel}
                        onChange={(e) => setPermissionLevel(e.target.value as 'view' | 'edit' | 'admin')}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddPermission}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddPermission(false)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {permissions.map((perm) => {
                      const user = allProfiles.find(p => p.id === perm.user_id);
                      return (
                        <div key={perm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                            <p className="text-xs text-gray-600">{perm.permission_level}</p>
                          </div>
                          {document.uploaded_by === profile?.id && (
                            <button
                              onClick={() => handleDeletePermission(perm.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">My Notes</h3>
                  <div className="mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-800">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">My Highlights</h3>
                  <div className="space-y-3">
                    {highlights.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No highlights yet. Use the highlight tool to mark important text.
                      </p>
                    ) : (
                      highlights.map((highlight) => (
                        <div key={highlight.id} className="p-3 rounded-lg" style={{ backgroundColor: highlight.color + '30' }}>
                          <p className="text-sm text-gray-800">{highlight.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(highlight.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Comments</h3>
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const author = allProfiles.find(p => p.id === comment.user_id);
                      return (
                        <div key={comment.id} className="border-b border-gray-200 pb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {author?.full_name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900">{author?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
