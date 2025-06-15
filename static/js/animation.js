export class AnimationManager {
  static initPageAnimations() {
    const artworks = document.querySelectorAll('.artwork');
    
    artworks.forEach((artwork, index) => {
      artwork.classList.add('artwork-entering');
      if (index < 6) {
        artwork.classList.add(`delay-${index + 1}`);
      }
    });
    
    setTimeout(() => {
      artworks.forEach(artwork => {
        artwork.classList.remove('artwork-entering');
        artwork.classList.add('artwork-visible');
        setTimeout(() => {
          artwork.classList.add('animation-done');
        }, 1000);
      });
    }, 100);
  }
  
  static animateNewArtwork(artworkElement) {
    artworkElement.classList.add('artwork-new');
    
    setTimeout(() => {
      artworkElement.classList.remove('artwork-new');
      artworkElement.classList.add('artwork-pulse');
      setTimeout(() => {
        artworkElement.classList.remove('artwork-pulse');
        artworkElement.classList.add('animation-done');
      }, 2000);
    }, 1200);
  }
  
  static animateRemoveArtwork(artworkElement) {
    return new Promise((resolve) => {
      artworkElement.classList.add('artwork-removing');
      setTimeout(() => {
        resolve();
      }, 800);
    });
  }
  
  static animateModalOpen(modal) {
    modal.classList.add('modal-entering');
    modal.style.display = 'block';
    requestAnimationFrame(() => {
      modal.classList.remove('modal-entering');
      modal.classList.add('modal-visible');
    });
  }
  
  static animateModalClose(modal) {
    return new Promise((resolve) => {
      modal.classList.remove('modal-visible');
      modal.classList.add('modal-entering');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('modal-entering');
        resolve();
      }, 300);
    });
  }
  
  static createLoadingSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'artwork artwork-skeleton';
    skeleton.innerHTML = `
      <div class="artwork-container">
        <div class="skeleton-img"></div>
      </div>
      <div class="artwork-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-desc"></div>
      </div>
    `;
    return skeleton;
  }
}

export class MemoryManager {
  static cleanupArtwork(artworkElement) {
    const img = artworkElement.querySelector('img');
    if (img && img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
    
    const buttons = artworkElement.querySelectorAll('button');
    buttons.forEach(btn => {
      const clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });
  }
}

export class LoadingManager {
  static setButtonLoading(button, loading = true) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      button.setAttribute('data-original-text', button.textContent);
      button.setAttribute('data-original-html', button.innerHTML);
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      const originalText = button.getAttribute('data-original-text');
      const originalHtml = button.getAttribute('data-original-html');
      if (originalHtml) {
        button.innerHTML = originalHtml;
      } else if (originalText) {
        button.textContent = originalText;
      }
    }
  }

  static showGlobalLoading(message = 'Loading...') {
    let loader = document.querySelector('.global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'global-loader';
      loader.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      `;
      document.body.appendChild(loader);
    }
    loader.style.display = 'block';
    return loader;
  }

  static hideGlobalLoading() {
    const loader = document.querySelector('.global-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }
}