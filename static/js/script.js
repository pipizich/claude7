import { debounce } from './utils.js';
import { ToastManager } from './toast.js';
import { LazyImageLoader } from './lazy_image.js';
import { NetworkMonitor, enhancedFetch } from './network.js';
import { AnimationManager, MemoryManager, LoadingManager } from './animation.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  const toast = new ToastManager();
  window.toast = toast;
  const networkMonitor = new NetworkMonitor();
  window.networkMonitor = networkMonitor;
  const lazyLoader = new LazyImageLoader();

  // Initialize lazy loading
  const lazyImages = document.querySelectorAll('img.lazy');
  lazyLoader.observe(lazyImages);

  // Modals
  const addArtworkModal = document.getElementById('add-artwork-modal');
  const editArtworkModal = document.getElementById('edit-artwork-modal');
  const viewDescriptionModal = document.getElementById('view-description-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');

  // Image counter
  const counterSpan = document.getElementById('image-total');
  const updateImageCounter = debounce(() => {
    const totalImages = document.querySelectorAll('.gallery .artwork:not(.artwork-skeleton)').length;
    if (counterSpan) {
      counterSpan.style.transform = 'scale(1.2)';
      counterSpan.textContent = totalImages;
      setTimeout(() => {
        counterSpan.style.transform = 'scale(1)';
      }, 200);
    }
  }, 300);

  updateImageCounter();

  // File validation
  function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 15 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select: JPG, PNG, GIF, WebP, or SVG');
      return false;
    }
    
    if (file.size > maxSize) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size: 15MB`);
      return false;
    }
    
    return true;
  }

  // File handling
  function handleFile(file, container) {
    if (!validateImageFile(file)) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.classList.add('preview-wrapper');

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      toast.success(`Image loaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    };

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.title = 'Remove image';
    btn.addEventListener('click', () => {
      wrapper.remove();
      toast.info('Image preview removed');
    });

    wrapper.appendChild(img);
    wrapper.appendChild(btn);
    container.appendChild(wrapper);
  }

  function handleEditFile(file, container) {
    if (!validateImageFile(file)) return;
    
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.classList.add('preview-wrapper');

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      toast.success(`New image loaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    };

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.title = 'Remove image';
    btn.addEventListener('click', () => {
      wrapper.remove();
      toast.info('Image preview removed');
    });

    wrapper.appendChild(img);
    wrapper.appendChild(btn);
    container.appendChild(wrapper);
  }

  // Event listeners
  let currentEditId = null;
  let artworkToDelete = null;

  document.getElementById('add-artwork-btn')?.addEventListener('click', () => {
    AnimationManager.animateModalOpen(addArtworkModal);
    toast.info('Ready to add new artwork');
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      currentEditId = btn.dataset.id;
      const title = btn.dataset.title;
      const desc = btn.dataset.description;
      
      document.getElementById('edit-title').value = title || '';
      document.getElementById('edit-description').value = desc;
      AnimationManager.animateModalOpen(editArtworkModal);
      
      toast.info(`Editing artwork: "${title || 'Untitled'}"`);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      artworkToDelete = btn.dataset.id;
      const title = btn.dataset.title || 'this artwork';
      AnimationManager.animateModalOpen(deleteConfirmModal);
      toast.warning(`Confirm deletion of "${title}"`);
    });
  });

  document.getElementById('confirm-delete')?.addEventListener('click', async () => {
    if (!artworkToDelete) return;
    
    const deleteBtn = document.getElementById('confirm-delete');
    LoadingManager.setButtonLoading(deleteBtn, true);
    
    try {
      const result = await enhancedFetch(`/delete/${artworkToDelete}`, { 
        method: 'POST'
      });
      
      if (result.success) {
        const artworkElement = document.querySelector(`[data-id="${artworkToDelete}"]`);
        if (artworkElement) {
          await AnimationManager.animateRemoveArtwork(artworkElement);
          MemoryManager.cleanupArtwork(artworkElement);
          artworkElement.remove();
          updateImageCounter();
        }
        
        toast.success(result.message || 'Artwork deleted successfully!');
        await AnimationManager.animateModalClose(deleteConfirmModal);
        artworkToDelete = null;
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete artwork: ${error.message}`);
    } finally {
      LoadingManager.setButtonLoading(deleteBtn, false);
    }
  });

  document.getElementById('cancel-delete')?.addEventListener('click', async () => {
    await AnimationManager.animateModalClose(deleteConfirmModal);
    artworkToDelete = null;
    toast.info('Delete cancelled');
  });

  const viewTitle = document.getElementById('view-title');
  const viewDesc = document.getElementById('view-description-text');
  
  const fetchDescription = async (id) => {
    const loader = LoadingManager.showGlobalLoading('Loading description...');
    
    try {
      const data = await enhancedFetch(`/get_description/${id}`);
      
      if (data.success) {
        viewTitle.textContent = data.title || 'Untitled';
        viewDesc.textContent = data.description || 'No description available.';
        AnimationManager.animateModalOpen(viewDescriptionModal);
        toast.info('Description loaded');
      } else {
        throw new Error(data.message || 'Failed to load description');
      }
    } catch (error) {
      console.error('Fetch description error:', error);
      toast.error(`Failed to load description: ${error.message}`);
    } finally {
      LoadingManager.hideGlobalLoading();
    }
  };

  document.querySelectorAll('.btn-see-more').forEach(b => {
    b.addEventListener('click', () => fetchDescription(b.dataset.id));
  });

  document.querySelectorAll('.artwork-title').forEach(t => {
    if (t.offsetWidth < t.scrollWidth) {
      t.style.cursor = 'pointer';
      t.title = 'Click to view full description';
      t.addEventListener('click', () => fetchDescription(t.dataset.id));
    }
  });

  document.querySelectorAll('.close').forEach(x => {
    x.addEventListener('click', async () => {
      const modal = x.closest('.modal');
      await AnimationManager.animateModalClose(modal);
      toast.info('Modal closed');
    });
  });

  window.addEventListener('click', async (e) => {
    if (e.target.classList.contains('modal')) {
      await AnimationManager.animateModalClose(e.target);
      toast.info('Modal closed');
    }
  });

  // Drag & drop
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');

  dropZone?.addEventListener('click', () => {
    fileInput.click();
    toast.info('Select an image file');
  });
  
  fileInput?.addEventListener('change', () => {
    if (fileInput.files.length) {
      handleFile(fileInput.files[0], previewContainer);
    }
  });

  dropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    fileInput.files = e.dataTransfer.files;
    handleFile(file, previewContainer);
  });

  const editDropZone = document.getElementById('edit-drop-zone');
  const editFileInput = document.getElementById('edit-file-input');
  const editPreviewContainer = document.getElementById('edit-preview-container');

  editDropZone?.addEventListener('click', () => {
    editFileInput.click();
    toast.info('Select a new image file');
  });
  
  editFileInput?.addEventListener('change', () => {
    if (editFileInput.files.length) {
      handleEditFile(editFileInput.files[0], editPreviewContainer);
    }
  });

  editDropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    editDropZone.classList.add('dragover');
  });

  editDropZone?.addEventListener('dragleave', () => {
    editDropZone.classList.remove('dragover');
  });

  editDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    editDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    editFileInput.files = e.dataTransfer.files;
    handleEditFile(file, editPreviewContainer);
  });

  // Paste support
  document.addEventListener('paste', e => {
    const items = Array.from(e.clipboardData.files);
    if (!items.length) return;
    
    const file = items[0];
    if (addArtworkModal.style.display === 'block') {
      fileInput.files = e.clipboardData.files;
      handleFile(file, previewContainer);
      toast.success('Image pasted from clipboard');
    } else if (editArtworkModal.style.display === 'block') {
      editFileInput.files = e.clipboardData.files;
      handleEditFile(file, editPreviewContainer);
      toast.success('Image pasted from clipboard');
    }
  });

  // Form submissions
  document.getElementById('add-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    LoadingManager.setButtonLoading(submitBtn, true);
    toast.info('Uploading artwork...');
    
    try {
      const formData = new FormData(this);
      const imageFile = formData.get('image');
      
      // Chỉ cần kiểm tra image file, description không bắt buộc
      if (!imageFile || imageFile.size === 0) {
        throw new Error('Please select an image file');
      }
      
      const gallery = document.getElementById('gallery');
      const skeleton = AnimationManager.createLoadingSkeleton();
      // Thêm skeleton vào đầu gallery để ảnh mới xuất hiện ở đầu tiên
      gallery.insertBefore(skeleton, gallery.firstChild);
      
      const response = await fetch('/add', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        this.reset();
        document.getElementById('preview-container').innerHTML = '';
        await AnimationManager.animateModalClose(addArtworkModal);
        skeleton.remove();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        skeleton.remove();
        throw new Error(result.message);
      }
      
    } catch (error) {
      const skeleton = document.querySelector('.artwork-skeleton');
      if (skeleton) skeleton.remove();
      console.error('Add artwork error:', error);
      toast.error(error.message || 'Failed to add artwork. Please try again.');
    } finally {
      LoadingManager.setButtonLoading(submitBtn, false);
    }
  });

  document.getElementById('edit-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentEditId) {
      toast.error('No artwork selected for editing');
      return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    LoadingManager.setButtonLoading(submitBtn, true);
    toast.info('Updating artwork...');
    
    try {
      const formData = new FormData(this);
      // Description không bắt buộc trong edit form
      
      const response = await fetch(`/edit/${currentEditId}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        await AnimationManager.animateModalClose(editArtworkModal);
        document.getElementById('edit-preview-container').innerHTML = '';
        currentEditId = null;
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('Edit artwork error:', error);
      toast.error(error.message || 'Failed to update artwork. Please try again.');
    } finally {
      LoadingManager.setButtonLoading(submitBtn, false);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal[style*="block"]');
      for (const modal of openModals) {
        await AnimationManager.animateModalClose(modal);
        toast.info('Modal closed');
      }
    }
    
    if (e.ctrlKey && e.key === 'a' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      if (addArtworkModal) {
        AnimationManager.animateModalOpen(addArtworkModal);
        toast.info('Add artwork modal opened');
      }
    }
  });

  // Global error handler
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    toast.error('An unexpected error occurred. Please refresh the page.');
  });

  // Initialize animations
  AnimationManager.initPageAnimations();

  // Welcome message
  setTimeout(() => {
    toast.success('Gallery loaded successfully!', 3000);
  }, 1000);
});