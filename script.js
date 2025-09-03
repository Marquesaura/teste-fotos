class PhotoPlatform {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.posts = this.loadPosts();
        this.likedPosts = this.loadLikedPosts();
        
        this.initializeElements();
        this.bindEvents();
        this.updatePhotoCount();
        this.renderPosts();
    }

    initializeElements() {
        this.startCameraBtn = document.getElementById('startCamera');
        this.capturePhotoBtn = document.getElementById('capturePhoto');
        this.uploadPhotoBtn = document.getElementById('uploadPhoto');
        this.stopCameraBtn = document.getElementById('stopCamera');
        this.photoPreview = document.getElementById('photoPreview');
        this.previewImage = document.getElementById('previewImage');
        this.photoCaption = document.getElementById('photoCaption');
        this.postPhotoBtn = document.getElementById('postPhoto');
        this.discardPhotoBtn = document.getElementById('discardPhoto');
        this.clearAllBtn = document.getElementById('clearAll');
        this.photoCount = document.getElementById('photoCount');
        this.postsContainer = document.getElementById('postsContainer');
        this.fileInput = document.getElementById('fileInput');
    }

    bindEvents() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.capturePhotoBtn.addEventListener('click', () => this.capturePhoto());
        this.uploadPhotoBtn.addEventListener('click', () => this.fileInput.click());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        this.postPhotoBtn.addEventListener('click', () => this.postPhoto());
        this.discardPhotoBtn.addEventListener('click', () => this.discardPhoto());
        this.clearAllBtn.addEventListener('click', () => this.clearAllPosts());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    async startCamera() {
        try {
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                this.showNotification('A captura da câmera requer HTTPS ou localhost.', 'warning');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showNotification('Este navegador não suporta acesso à câmera.', 'error');
                return;
            }

            // Desabilitar botões enquanto solicita permissão
            this.startCameraBtn.disabled = true;
            this.capturePhotoBtn.disabled = true;
            this.stopCameraBtn.disabled = true;

            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = this.stream;
            
            const onVideoReady = () => {
                if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
                    this.startCameraBtn.disabled = true;
                    this.capturePhotoBtn.disabled = false;
                    this.stopCameraBtn.disabled = false;
                    this.showNotification('Câmera iniciada com sucesso! 📷', 'success');
                    this.video.removeEventListener('loadedmetadata', onVideoReady);
                    this.video.removeEventListener('loadeddata', onVideoReady);
                    this.video.removeEventListener('canplay', onVideoReady);
                }
            };
            this.video.addEventListener('loadedmetadata', onVideoReady);
            this.video.addEventListener('loadeddata', onVideoReady);
            this.video.addEventListener('canplay', onVideoReady);
        } catch (error) {
            console.error('Erro ao acessar a câmera:', error);
            let msg = 'Erro ao acessar a câmera.';
            if (error && error.name) {
                switch (error.name) {
                    case 'NotAllowedError':
                    case 'SecurityError':
                        msg = 'Permissão para usar a câmera foi negada. Libere nas configurações do navegador e tente novamente.';
                        break;
                    case 'NotFoundError':
                    case 'OverconstrainedError':
                        msg = 'Nenhuma câmera compatível foi encontrada neste dispositivo.';
                        break;
                    case 'NotReadableError':
                        msg = 'A câmera está em uso por outro aplicativo. Feche-o e tente novamente.';
                        break;
                    case 'AbortError':
                        msg = 'A solicitação de câmera foi interrompida. Tente novamente.';
                        break;
                    default:
                        msg = 'Não foi possível acessar a câmera. Verifique permissões e tente novamente.';
                }
            }
            this.showNotification(msg, 'error');
            // Reabilitar botão de iniciar para tentativa novamente
            this.startCameraBtn.disabled = false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        
        this.startCameraBtn.disabled = false;
        this.capturePhotoBtn.disabled = true;
        this.stopCameraBtn.disabled = true;
        
        this.showNotification('Câmera parada', 'info');
    }

    capturePhoto() {
        try {
            if (!this.stream) {
                this.showNotification('Câmera não está ativa.', 'warning');
                return;
            }

            const vw = this.video.videoWidth;
            const vh = this.video.videoHeight;
            if (!vw || !vh) {
                this.showNotification('Vídeo não está pronto. Aguarde a câmera iniciar.', 'warning');
                return;
            }

            // Garantir contexto do canvas
            if (!this.ctx) {
                this.ctx = this.canvas.getContext('2d');
                if (!this.ctx) {
                    this.showNotification('Falha ao acessar o canvas.', 'error');
                    return;
                }
            }

            // Configurar dimensões e desenhar o frame
            this.canvas.width = vw;
            this.canvas.height = vh;
            this.ctx.drawImage(this.video, 0, 0, vw, vh);

            // Converter para base64 com fallback
            let photoData = '';
            try {
                photoData = this.canvas.toDataURL('image/jpeg', 0.9);
            } catch (e1) {
                try {
                    photoData = this.canvas.toDataURL('image/png');
                } catch (e2) {
                    console.error('Erro ao gerar imagem:', e1, e2);
                    this.showNotification('Erro ao gerar a imagem da captura.', 'error');
                    return;
                }
            }

            // Mostrar preview e armazenar
            this.previewImage.src = photoData;
            this.photoPreview.style.display = 'block';
            this.photoCaption.value = '';
            this.tempPhoto = photoData;

            this.showNotification('Foto capturada! Adicione uma legenda e poste.', 'success');
        } catch (err) {
            console.error('Erro ao capturar foto:', err);
            this.showNotification('Erro ao capturar a foto. Tente novamente.', 'error');
        }
    }

    handleFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecione um arquivo de imagem.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.tempPhoto = reader.result;
            this.previewImage.src = this.tempPhoto;
            this.photoPreview.style.display = 'block';
            this.photoCaption.value = '';
            this.showNotification('Imagem carregada! Adicione uma legenda e poste.', 'success');
            // limpar o input para permitir re-seleção do mesmo arquivo
            this.fileInput.value = '';
        };
        reader.onerror = () => {
            this.showNotification('Falha ao ler a imagem.', 'error');
        };
        reader.readAsDataURL(file);
    }

    postPhoto() {
        if (!this.tempPhoto) return;

        const caption = this.photoCaption.value.trim() || 'Foto sem legenda';
        
        const post = {
            id: Date.now(),
            image: this.tempPhoto,
            caption: caption,
            timestamp: new Date().toLocaleString('pt-BR'),
            likes: 0
        };

        this.posts.unshift(post); // Adicionar no início
        this.savePosts();
        this.updatePhotoCount();
        this.renderPosts();
        this.discardPhoto();
        
        this.showNotification('Foto postada com sucesso! 📤', 'success');
    }

    discardPhoto() {
        this.tempPhoto = null;
        this.photoPreview.style.display = 'none';
        this.previewImage.src = '';
        this.photoCaption.value = '';
    }

    renderPosts() {
        if (this.posts.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="empty-state">
                    <p>📷 Nenhuma foto postada ainda</p>
                    <p>Use a câmera acima para capturar sua primeira foto!</p>
                </div>
            `;
            return;
        }

        this.postsContainer.innerHTML = this.posts.map(post => {
            const isLiked = !!this.likedPosts[post.id];
            return `
            <div class="post-item" data-id="${post.id}">
                <img src="${post.image}" alt="Foto postada" class="post-image">
                <div class="post-caption">"${post.caption}"</div>
                <div class="post-meta">
                    <span>📅 ${post.timestamp}</span>
                    <div class="post-actions">
                        <button class="action-btn${isLiked ? ' liked' : ''}" ${isLiked ? 'disabled' : ''} onclick="photoPlatform.likePost(${post.id})" title="Curtir">
                            ❤️ ${post.likes}
                        </button>
                        <button class="action-btn" onclick="photoPlatform.deletePost(${post.id})" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    likePost(postId) {
        if (this.likedPosts[postId]) {
            this.showNotification('Você já curtiu esta foto neste dispositivo.', 'info');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        post.likes++;
        this.likedPosts[postId] = true;
        this.savePosts();
        this.saveLikedPosts();
        this.renderPosts();
        this.showNotification('Curtida adicionada! ❤️', 'success');
    }

    deletePost(postId) {
        if (confirm('Tem certeza que deseja excluir esta foto?')) {
            this.posts = this.posts.filter(p => p.id !== postId);
            this.savePosts();
            this.updatePhotoCount();
            this.renderPosts();
            this.showNotification('Foto excluída! 🗑️', 'info');
        }
    }

    clearAllPosts() {
        if (this.posts.length === 0) {
            this.showNotification('Não há fotos para limpar', 'info');
            return;
        }

        if (confirm('Tem certeza que deseja excluir TODAS as fotos? Esta ação não pode ser desfeita.')) {
            this.posts = [];
            this.savePosts();
            this.updatePhotoCount();
            this.renderPosts();
            this.showNotification('Todas as fotos foram excluídas! 🗑️', 'warning');
        }
    }

    updatePhotoCount() {
        const count = this.posts.length;
        this.photoCount.textContent = `${count} foto${count !== 1 ? 's' : ''}`;
    }

    savePosts() {
        localStorage.setItem('photoPlatform_posts', JSON.stringify(this.posts));
    }

    loadPosts() {
        const saved = localStorage.getItem('photoPlatform_posts');
        return saved ? JSON.parse(saved) : [];
    }

    saveLikedPosts() {
        try {
            localStorage.setItem('photoPlatform_likes', JSON.stringify(this.likedPosts || {}));
        } catch (_) {}
    }

    loadLikedPosts() {
        try {
            const saved = localStorage.getItem('photoPlatform_likes');
            return saved ? JSON.parse(saved) : {};
        } catch (_) {
            return {};
        }
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '1000',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Cores baseadas no tipo
        const colors = {
            success: 'linear-gradient(45deg, #fa8a1c, #c381cd)',
            error: 'linear-gradient(45deg, #b40000, #430030)',
            warning: 'linear-gradient(45deg, #fa8a1c, #9d1ea4)',
            info: 'linear-gradient(45deg, #c381cd, #85088c)'
        };
        
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar a plataforma quando a página carregar
let photoPlatform;
document.addEventListener('DOMContentLoaded', () => {
    photoPlatform = new PhotoPlatform();
});

// Adicionar suporte para teclas de atalho
document.addEventListener('keydown', (e) => {
    if (!photoPlatform) return;
    
    // Espaço para capturar foto (quando a câmera estiver ativa)
    if (e.code === 'Space' && !photoPlatform.capturePhotoBtn.disabled) {
        e.preventDefault();
        photoPlatform.capturePhoto();
    }
    
    // Enter para postar foto (quando o preview estiver visível)
    if (e.code === 'Enter' && photoPlatform.photoPreview.style.display !== 'none') {
        e.preventDefault();
        photoPlatform.postPhoto();
    }
    
    // Escape para descartar foto
    if (e.code === 'Escape' && photoPlatform.photoPreview.style.display !== 'none') {
        photoPlatform.discardPhoto();
    }
});
