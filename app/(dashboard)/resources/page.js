'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import resourceService from '@/lib/api/resourceService';
import cohortService from '@/lib/api/cohortService';
import categoryService from '@/lib/api/categoryService';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  FileText,
  Video,
  Link,
  Upload,
  Calendar,
  User,
  Tag,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Archive,
  Grid3X3,
  List,
  SortAsc,
  MoreVertical,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

const Resources = () => {
  const { user } = useAuth();
  
  const [resources, setResources] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document',
    category: '',
    url: '',
    file: null,
    cohorts: [],
    tags: '',
    visibility: 'public',
    assignmentTemplate: false
  });
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // State for error handling
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch resources based on active tab
        let resourcesData;
        switch (activeTab) {
          case 'templates':
            resourcesData = await resourceService.getTemplateResources();
            break;
          case 'popular':
            resourcesData = await resourceService.getPopularResources();
            break;
          case 'recent':
            resourcesData = await resourceService.getRecentResources();
            break;
          case 'favorites':
            resourcesData = await resourceService.getFavoriteResources();
            break;
          default:
            resourcesData = await resourceService.getResources();
        }
        
        // Fetch categories and analytics
        const [categoriesData, analyticsData] = await Promise.all([
          categoryService.getCategories(),
          resourceService.getResourceAnalytics()
        ]);
        
        setResources(resourcesData.data || []);
        setCategories(categoriesData.data || []);
        setAnalytics(analyticsData.data || {});
        
      } catch (error) {
        console.error('Error fetching resources:', error);
        setError('Failed to load resources. Please try again.');
        toast.error('Failed to load resources');
        // Set fallback empty arrays to prevent map errors
        setResources([]);
        setCategories([]);
        setAnalytics({});
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    fetchCohorts();
  }, [activeTab]);

  const fetchCohorts = async () => {
    try {
      if (user?.role === 'school_admin' || user?.role === 'trainer') {
        const cohortsData = await cohortService.getCohorts();
        setCohorts(cohortsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      // Fallback to mock data
      setCohorts([
        { id: '1', name: 'Graduate Studies' },
        { id: '2', name: 'Undergraduate Research' },
        { id: '3', name: 'Business Studies' },
        { id: '4', name: 'Engineering' },
        { id: '5', name: 'First Year' },
        { id: '6', name: 'Transfer Students' }
      ]);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        color: newCategoryColor
      };

      const response = await categoryService.createCategory(categoryData);
      
      // Add the new category to the list
      setCategories(prev => [...prev, response.data]);
      
      // Set the new category as selected
      setNewResource(prev => ({ ...prev, category: response.data._id }));
      
      // Reset category form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3b82f6');
      
      setIsCreateCategoryDialogOpen(false);
      toast.success('Category created successfully');
      
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleCreateResource = async () => {
    if (!newResource.title || !newResource.description || !newResource.url || !newResource.category) {
      toast.error('Please fill in all required fields including category');
      return;
    }

    try {
      const resourceData = {
        ...newResource,
        tags: newResource.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        cohorts: newResource.cohorts || []
      };

      const response = await resourceService.createResource(resourceData);
      
      // Add the new resource to the list
      setResources(prev => [response.data, ...prev]);
      
      // Reset form
      setNewResource({
        title: '',
        description: '',
        type: 'document',
        category: '',
        url: '',
        file: null,
        cohorts: [],
        tags: '',
        visibility: 'public',
        assignmentTemplate: false
      });
      
      setIsCreateDialogOpen(false);
      toast.success('Resource created successfully');
      
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to create resource');
    }
  };

  const handleEditResource = async () => {
    try {
      setIsEditDialogOpen(false);
      setSelectedResource(null);
      fetchData();
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleToggleFavorite = async (resourceId) => {
    try {
      await resourceService.toggleFavorite(resourceId);
      // Update local state
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { ...resource, isFavorite: !resource.isFavorite }
          : resource
      ));
      toast.success('Favorite updated successfully');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const handleSearch = async (term) => {
    setSearchQuery(term);
    if (term.trim()) {
      try {
        const searchResults = await resourceService.searchResources(term);
        setResources(searchResults.data || []);
      } catch (error) {
        console.error('Error searching resources:', error);
        toast.error('Search failed. Please try again.');
      }
    } else {
      // Reset to original resources when search is cleared
      const fetchData = async () => {
        try {
          let resourcesData;
          switch (activeTab) {
            case 'templates':
              resourcesData = await resourceService.getTemplateResources();
              break;
            case 'popular':
              resourcesData = await resourceService.getPopularResources();
              break;
            case 'recent':
              resourcesData = await resourceService.getRecentResources();
              break;
            case 'favorites':
              resourcesData = await resourceService.getFavoriteResources();
              break;
            default:
              resourcesData = await resourceService.getResources();
          }
          setResources(resourcesData.data || []);
        } catch (error) {
          console.error('Error fetching resources:', error);
        }
      };
      fetchData();
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleView = async (resource) => {
    try {
      // Increment view count
      await resourceService.incrementViews(resource.id);
      
      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, views: (r.views || 0) + 1 }
          : r
      ));
      
      // Open resource
      window.open(resource.url, '_blank');
    } catch (error) {
      console.error('Error tracking view:', error);
      // Still open the resource even if tracking fails
      window.open(resource.url, '_blank');
    }
  };

  const handleDownload = async (resource) => {
    try {
      // Increment download count
      await resourceService.incrementDownloads(resource.id);
      
      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, downloads: (r.downloads || 0) + 1 }
          : r
      ));
      
      // Create download link
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast.error('Download failed');
    }
  };

  const getTabResources = (tab) => {
    const baseFilter = resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || resource.category.toLowerCase().replace(' ', '-') === selectedCategory;
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      const matchesCohort = selectedCohort === 'all' || resource.cohorts.some(cohort => cohort.includes(selectedCohort));
      
      return matchesSearch && matchesCategory && matchesType && matchesCohort;
    });

    switch (tab) {
      case 'favorites':
        return baseFilter.filter(resource => resource.isFavorite);
      case 'templates':
        return baseFilter.filter(resource => resource.assignmentTemplate);
      case 'recent':
        return baseFilter.filter(resource => {
          const daysSinceUpdate = Math.floor((new Date() - new Date(resource.updatedAt)) / (1000 * 60 * 60 * 24));
          return daysSinceUpdate <= 7;
        });
      default:
        return baseFilter;
    }
  };

  const sortedAndFilteredResources = getTabResources(activeTab).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.views + (b.downloads || 0)) - (a.views + (a.downloads || 0));
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

  const getResourceIcon = (type) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'document': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'video': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'link': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'download': return <Download className="h-3 w-3 text-blue-600" />;
      case 'view': return <Eye className="h-3 w-3 text-emerald-600" />;
      case 'create': return <Plus className="h-3 w-3 text-purple-600" />;
      case 'favorite': return <Star className="h-3 w-3 text-amber-600" />;
      default: return <Clock className="h-3 w-3 text-slate-600" />;
    }
  };

  const ResourceDisplay = ({ resources }) => {
    if (resources.length === 0) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No resources found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || selectedCohort !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'No assignment resources have been added yet.'}
          </p>
          {(user?.role === 'school_admin' || user?.role === 'trainer') && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Add First Resource
            </Button>
          )}
        </div>
      );
    }

    return viewMode === 'grid' ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="border border-slate-200 bg-white hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-xs font-medium w-fit ${getResourceTypeColor(resource.type)}`}>
                        {resource.type.toUpperCase()}
                      </Badge>
                      {resource.assignmentTemplate && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs w-fit">
                          TEMPLATE
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(resource.priority)}`}></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(resource.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {resource.isFavorite ? (
                        <Star className="h-3 w-3 text-amber-500 fill-current" />
                      ) : (
                        <StarOff className="h-3 w-3 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {resource.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{resource.views}</span>
                    </div>
                    {resource.downloads && (
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.downloads}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{resource.createdBy}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(resource.url)}
                      className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white h-6 px-2 text-xs"
                      onClick={() => handleView(resource)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    {(user?.role === 'school_admin' || user?.role === 'trainer') && (
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedResource(resource);
                            setIsEditDialogOpen(true);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(resource.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      /* List View - More compact */
      <div className="space-y-1">
        {resources.map((resource) => (
          <div key={resource.id} className="px-4 py-3 hover:bg-slate-50 transition-colors duration-150 group rounded-lg border border-transparent hover:border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div className={`h-1.5 w-1.5 rounded-full ${getPriorityColor(resource.priority)}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {resource.title}
                    </h3>
                    <Badge className={`text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                      {resource.type.toUpperCase()}
                    </Badge>
                    {resource.assignmentTemplate && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                        TEMPLATE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 truncate mb-1">
                    {resource.description}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{resource.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{resource.views}</span>
                    </div>
                    {resource.downloads && (
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{resource.downloads}</span>
                      </div>
                    )}
                    <span>
                      {new Date(resource.updatedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFavorite(resource.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {resource.isFavorite ? (
                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                  ) : (
                    <StarOff className="h-3 w-3 text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyLink(resource.url)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="h-3 w-3 text-slate-400" />
                </Button>
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white h-6 px-2 text-xs"
                  onClick={() => handleView(resource)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
                {(user?.role === 'school_admin' || user?.role === 'trainer') && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResource(resource);
                        setIsEditDialogOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteResource(resource.id)}
                      className="h-6 w-6 p-0 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section - Simplified */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">
              Assignment Resources
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-600 font-normal">
                {user?.role === 'school_admin' ? 'Manage assignment resources and templates' :
                 user?.role === 'trainer' ? 'Share resources and templates with students' :
                 'Access assignment guides, templates, and learning materials'}
              </p>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-md text-sm">
                  {error}
                </div>
              )}
              {analytics && (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Resource Usage: Active</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">{analytics.weeklyGrowth} vs last week</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {(user?.role === 'school_admin' || user?.role === 'trainer') && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Resource</DialogTitle>
                    <DialogDescription>
                      Add a new assignment resource or template for students.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newResource.title}
                          onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                          placeholder="Resource title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={newResource.type} onValueChange={(value) => setNewResource({...newResource, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newResource.description}
                        onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                        placeholder="Resource description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="category">Category</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCreateCategoryDialogOpen(true)}
                            className="h-6 px-2 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add New
                          </Button>
                        </div>
                        <Select value={newResource.category} onValueChange={(value) => setNewResource({...newResource, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(categories) && categories.map(category => (
                              <SelectItem key={category._id || category.id} value={category._id || category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="url">URL/Link</Label>
                        <Input
                          id="url"
                          value={newResource.url}
                          onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={newResource.tags}
                        onChange={(e) => setNewResource({...newResource, tags: e.target.value})}
                        placeholder="Assignment, Template, Guidelines"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="assignmentTemplate"
                        checked={newResource.assignmentTemplate}
                        onChange={(e) => setNewResource({...newResource, assignmentTemplate: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="assignmentTemplate" className="text-sm">
                        Mark as Assignment Template
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateResource} className="bg-slate-900 hover:bg-slate-800">
                      Create Resource
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <span className="ml-3 text-slate-600">Loading resources...</span>
          </div>
        )}
        
        {/* Analytics Cards - More compact, moved up */}
        {!loading && (user?.role === 'school_admin' || user?.role === 'trainer') && (
        <div className="grid grid-cols-5 gap-4 mb-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-slate-900">{analytics.totalResources || 0}</div>
                    <div className="text-xs text-slate-500">Resources</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Eye className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-slate-900">{analytics.totalViews || 0}</div>
                    <div className="text-xs text-slate-500">Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-slate-900">{analytics.totalDownloads || 0}</div>
                    <div className="text-xs text-slate-500">Downloads</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-slate-900">{analytics.favoriteResources || 0}</div>
                    <div className="text-xs text-slate-500">Favorites</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-light text-slate-900">{analytics.templateResources || 0}</div>
                    <div className="text-xs text-slate-500">Templates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && (
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar - More organized */}
          <div className="col-span-3 space-y-6">
            {/* Search - Standalone */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 border-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="px-4 py-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900">Quick Filters</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-slate-700 mb-2 block">Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-8 text-xs border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="link">Links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(user?.role === 'school_admin' || user?.role === 'trainer') && (
                  <div>
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">Cohort</Label>
                    <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                      <SelectTrigger className="h-8 text-xs border-slate-200">
                        <SelectValue placeholder="All Cohorts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cohorts</SelectItem>
                        {Array.isArray(cohorts) && cohorts.map(cohort => (
                          <SelectItem key={cohort.id} value={cohort.name}>
                            {cohort.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="px-4 py-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                      selectedCategory === 'all' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {Array.isArray(categories) && categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category.id 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs opacity-75">{category.count}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Compact */}
            {(user?.role === 'school_admin' || user?.role === 'trainer') && analytics && (
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="px-4 py-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold text-slate-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {analytics?.recentActivity && Array.isArray(analytics.recentActivity) && analytics.recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors duration-150">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-900 truncate font-medium">
                              {activity.resource}
                            </p>
                            <p className="text-xs text-slate-500">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area - Reorganized with tabs */}
          <div className="col-span-9">
            <Card className="border-0 shadow-sm bg-white">
              {/* Tab Navigation */}
              <div className="px-6 py-4 border-b border-slate-100">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid w-fit grid-cols-4 bg-slate-100">
                      <TabsTrigger value="all" className="text-xs">
                        All Resources
                        <Badge variant="secondary" className="ml-2 text-xs bg-white text-slate-700">
                          {getTabResources('all').length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="favorites" className="text-xs">
                        Favorites
                        <Badge variant="secondary" className="ml-2 text-xs bg-white text-slate-700">
                          {getTabResources('favorites').length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="templates" className="text-xs">
                        Templates
                        <Badge variant="secondary" className="ml-2 text-xs bg-white text-slate-700">
                          {getTabResources('templates').length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="recent" className="text-xs">
                        Recent
                        <Badge variant="secondary" className="ml-2 text-xs bg-white text-slate-700">
                          {getTabResources('recent').length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Controls - Right aligned */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'grid' 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Grid3X3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'list' 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <List className="h-3 w-3" />
                        </button>
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-32 h-8 text-xs border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Recent</SelectItem>
                          <SelectItem value="popular">Popular</SelectItem>
                          <SelectItem value="alphabetical">A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* Tab Content */}
              <CardContent className="p-6">
                <Tabs value={activeTab} className="w-full">
                  <TabsContent value="all" className="mt-0">
                    <ResourceDisplay resources={sortedAndFilteredResources} />
                  </TabsContent>
                  <TabsContent value="favorites" className="mt-0">
                    <ResourceDisplay resources={sortedAndFilteredResources} />
                  </TabsContent>
                  <TabsContent value="templates" className="mt-0">
                    <ResourceDisplay resources={sortedAndFilteredResources} />
                  </TabsContent>
                  <TabsContent value="recent" className="mt-0">
                    <ResourceDisplay resources={sortedAndFilteredResources} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Edit Resource Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Resource</DialogTitle>
              <DialogDescription>
                Update the resource information and settings.
              </DialogDescription>
            </DialogHeader>
            {selectedResource && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={selectedResource.title}
                      onChange={(e) => setSelectedResource({...selectedResource, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Type</Label>
                    <Select value={selectedResource.type} onValueChange={(value) => setSelectedResource({...selectedResource, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedResource.description}
                    onChange={(e) => setSelectedResource({...selectedResource, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={selectedResource.category}
                      onChange={(e) => setSelectedResource({...selectedResource, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-url">URL/Link</Label>
                    <Input
                      id="edit-url"
                      value={selectedResource.url}
                      onChange={(e) => setSelectedResource({...selectedResource, url: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-assignmentTemplate"
                    checked={selectedResource.assignmentTemplate}
                    onChange={(e) => setSelectedResource({...selectedResource, assignmentTemplate: e.target.checked})}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="edit-assignmentTemplate" className="text-sm">
                    Mark as Assignment Template
                  </Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditResource} className="bg-slate-900 hover:bg-slate-800">
                Update Resource
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Category Dialog */}
        <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category for organizing resources.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Assignments, Lectures, References"
                />
              </div>
              <div>
                <Label htmlFor="category-description">Description (Optional)</Label>
                <Textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="category-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="category-color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <span className="text-sm text-slate-600">{newCategoryColor}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} className="bg-slate-900 hover:bg-slate-800">
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default Resources;