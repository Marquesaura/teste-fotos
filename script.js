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

        // Inicializar sincronização em nuvem se habilitada
        this.initializeCloudIfEnabled();
    }

    initializeElements() {
        this.startCameraBtn = document.getElementById('startCamera');
        this.capturePhotoBtn = document.getElementById('capturePhoto');
        this.uploadPhotoBtn = document.getElementById('uploadPhoto');
        this.stopCameraBtn = document.getElementById('stopCamera');
        this.photoPreview = document.getElementById('photoPreview');
        this.previewImage = document.getElementById('previewImage');
        this.editorCanvas = document.getElementById('editorCanvas');
        this.editorCtx = this.editorCanvas ? this.editorCanvas.getContext('2d') : null;
        this.opacityRange = document.getElementById('opacityRange');
        this.opacityValue = document.getElementById('opacityValue');
        this.resetEditBtn = document.getElementById('resetEdit');
        // Filtros/transformações
        this.brightnessRange = document.getElementById('brightnessRange');
        this.contrastRange = document.getElementById('contrastRange');
        this.saturateRange = document.getElementById('saturateRange');
        this.blurRange = document.getElementById('blurRange');
        this.grayscaleChk = document.getElementById('grayscaleChk');
        this.sepiaChk = document.getElementById('sepiaChk');
        this.rotateRange = document.getElementById('rotateRange');
        this.rotateValue = document.getElementById('rotateValue');
        this.flipHChk = document.getElementById('flipHChk');
        this.flipVChk = document.getElementById('flipVChk');
        this.aspectSelect = document.getElementById('aspectSelect');
        this.downloadEditedBtn = document.getElementById('downloadEdited');
        this.photoCaption = document.getElementById('photoCaption');
        this.postPhotoBtn = document.getElementById('postPhoto');
        this.discardPhotoBtn = document.getElementById('discardPhoto');
        this.clearAllBtn = document.getElementById('clearAll');
        this.photoCount = document.getElementById('photoCount');
        this.postsContainer = document.getElementById('postsContainer');
        this.fileInput = document.getElementById('fileInput');
        this.cameraPrompt = document.getElementById('cameraPrompt');
        this.allowCameraBtn = document.getElementById('allowCamera');
        this.denyCameraBtn = document.getElementById('denyCamera');
        // Tabs/views
        this.tabCapture = document.getElementById('tabCapture');
        this.tabPosts = document.getElementById('tabPosts');
        this.viewCapture = document.getElementById('viewCapture');
        this.viewPosts = document.getElementById('viewPosts');
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

        if (this.allowCameraBtn) {
            this.allowCameraBtn.addEventListener('click', async () => {
                this.hideCameraPrompt();
                await this.startCamera();
            });
        }
        if (this.denyCameraBtn) {
            this.denyCameraBtn.addEventListener('click', () => {
                this.hideCameraPrompt();
                this.showNotification('Você pode iniciar a câmera a qualquer momento.', 'info');
            });
        }

        this.initializePermissionPrompt();
        if (this.opacityRange) {
            this.opacityRange.addEventListener('input', () => this.updateOpacity());
        }
        if (this.resetEditBtn) {
            this.resetEditBtn.addEventListener('click', () => this.resetEditor());
        }
        if (this.downloadEditedBtn) {
            this.downloadEditedBtn.addEventListener('click', async () => {
                const out = await this.exportEditedImage();
                const link = document.createElement('a');
                link.href = out;
                link.download = `foto_editada_${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
        // Eventos dos filtros/transformações
        const rerender = () => this.renderEditor();
        [this.brightnessRange, this.contrastRange, this.saturateRange, this.blurRange, this.grayscaleChk, this.sepiaChk, this.flipHChk, this.flipVChk, this.aspectSelect]
            .forEach(el => { if (el) el.addEventListener('input', rerender); });
        if (this.rotateRange) {
            this.rotateRange.addEventListener('input', () => {
                if (this.rotateValue) this.rotateValue.textContent = `${this.rotateRange.value}°`;
                this.renderEditor();
            });
        }
        if (this.editorCanvas) {
            this.installCropHandlers();
        }
        // Tabs
        if (this.tabCapture && this.tabPosts) {
            this.tabCapture.addEventListener('click', () => this.switchView('capture'));
            this.tabPosts.addEventListener('click', () => this.switchView('posts'));
        }
    }

    switchView(target) {
        const toCapture = target === 'capture';
        if (this.viewCapture) this.viewCapture.style.display = toCapture ? '' : 'none';
        if (this.viewPosts) this.viewPosts.style.display = toCapture ? 'none' : '';
        if (this.tabCapture && this.tabPosts) {
            this.tabCapture.classList.toggle('active', toCapture);
            this.tabPosts.classList.toggle('active', !toCapture);
        }
        if (!toCapture && this.postsContainer) {
            this.postsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    installCropHandlers() {
        this.cropStart = null; // {x,y}
        this.cropRect = null;  // {x,y,w,h}
        const getPos = (e) => {
            const rect = this.editorCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: Math.max(0, Math.min(this.editorCanvas.width, (clientX - rect.left) * (this.editorCanvas.width / rect.width))),
                y: Math.max(0, Math.min(this.editorCanvas.height, (clientY - rect.top) * (this.editorCanvas.height / rect.height)))
            };
        };

        const draw = () => {
            this.renderEditor();
            if (this.cropRect) {
                this.editorCtx.save();
                this.editorCtx.strokeStyle = '#9d1ea4';
                this.editorCtx.lineWidth = 3;
                this.editorCtx.setLineDash([8, 6]);
                this.editorCtx.strokeRect(this.cropRect.x, this.cropRect.y, this.cropRect.w, this.cropRect.h);
                this.editorCtx.restore();
            }
        };

        const onDown = (e) => {
            e.preventDefault();
            this.cropStart = getPos(e);
            this.cropRect = { x: this.cropStart.x, y: this.cropStart.y, w: 0, h: 0 };
            draw();
        };
        const onMove = (e) => {
            if (!this.cropStart) return;
            const p = getPos(e);
            let x = Math.min(this.cropStart.x, p.x);
            let y = Math.min(this.cropStart.y, p.y);
            let w = Math.abs(p.x - this.cropStart.x);
            let h = Math.abs(p.y - this.cropStart.y);
            // Trava de proporção
            if (this.aspectSelect && this.aspectSelect.value !== 'free') {
                const [aw, ah] = this.aspectSelect.value.split(':').map(Number);
                if (aw > 0 && ah > 0) {
                    const target = aw / ah;
                    if (w / h > target) {
                        w = h * target;
                    } else {
                        h = w / target;
                    }
                }
            }
            this.cropRect = { x, y, w, h };
            draw();
        };
        const onUp = () => {
            this.cropStart = null;
            draw();
        };

        this.editorCanvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        this.editorCanvas.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
        this.editorCleanup = () => {
            this.editorCanvas.removeEventListener('mousedown', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            this.editorCanvas.removeEventListener('touchstart', onDown);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }

    updateOpacity() {
        const v = parseFloat(this.opacityRange.value || '1');
        if (this.opacityValue) this.opacityValue.textContent = `${Math.round(v * 100)}%`;
        this.renderEditor();
    }

    resetEditor() {
        this.cropRect = null;
        if (this.opacityRange) this.opacityRange.value = '1';
        if (this.opacityValue) this.opacityValue.textContent = '100%';
        this.renderEditor();
    }

    renderEditor() {
        if (!this.editorCanvas || !this.editorCtx || !this.tempPhoto) {
            // Fallback: mostrar imagem simples se não houver editor
            if (this.previewImage && this.tempPhoto) {
                this.previewImage.src = this.tempPhoto;
                this.previewImage.style.display = 'block';
            }
            return;
        }
        const img = new Image();
        img.onload = () => {
            // Ajustar canvas para caber a imagem mantendo proporção até um limite
            const maxW = 900;
            const scale = Math.min(1, maxW / img.width);
            this.editorCanvas.width = Math.round(img.width * scale);
            this.editorCanvas.height = Math.round(img.height * scale);

            // Limpar
            this.editorCtx.clearRect(0, 0, this.editorCanvas.width, this.editorCanvas.height);

            // Montar filtros
            const brightness = parseFloat(this.brightnessRange ? this.brightnessRange.value : '1') || 1;
            const contrast = parseFloat(this.contrastRange ? this.contrastRange.value : '1') || 1;
            const saturate = parseFloat(this.saturateRange ? this.saturateRange.value : '1') || 1;
            const blur = parseFloat(this.blurRange ? this.blurRange.value : '0') || 0;
            const grayscale = this.grayscaleChk && this.grayscaleChk.checked ? 1 : 0;
            const sepia = this.sepiaChk && this.sepiaChk.checked ? 1 : 0;
            const filterStr = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px) grayscale(${grayscale}) sepia(${sepia})`;

            // Transformações
            const rotateDeg = parseFloat(this.rotateRange ? this.rotateRange.value : '0') || 0;
            const flipH = !!(this.flipHChk && this.flipHChk.checked);
            const flipV = !!(this.flipVChk && this.flipVChk.checked);

            // Desenhar com opacidade e filtros/transformações
            const alpha = parseFloat(this.opacityRange ? this.opacityRange.value : '1') || 1;
            this.editorCtx.save();
            this.editorCtx.globalAlpha = alpha;
            this.editorCtx.filter = filterStr;
            // aplicar transformações no centro
            const cx = this.editorCanvas.width / 2;
            const cy = this.editorCanvas.height / 2;
            this.editorCtx.translate(cx, cy);
            if (rotateDeg) this.editorCtx.rotate(rotateDeg * Math.PI / 180);
            this.editorCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            this.editorCtx.drawImage(img, -cx, -cy, this.editorCanvas.width, this.editorCanvas.height);
            this.editorCtx.restore();

            // Escurecer fora da área recortada
            if (this.cropRect) {
                this.editorCtx.save();
                this.editorCtx.fillStyle = 'rgba(0,0,0,0.25)';
                this.editorCtx.fillRect(0, 0, this.editorCanvas.width, this.editorCanvas.height);
                this.editorCtx.clearRect(this.cropRect.x, this.cropRect.y, this.cropRect.w, this.cropRect.h);
                this.editorCtx.restore();
            }
            // Esconder fallback após renderizar
            if (this.previewImage) this.previewImage.style.display = 'none';
        };
        img.onerror = () => {
            // Fallback se falhar o load da imagem
            if (this.previewImage) {
                this.previewImage.src = this.tempPhoto;
                this.previewImage.style.display = 'block';
            }
        };
        img.src = this.tempPhoto;
    }

    async initializePermissionPrompt() {
        try {
            // Alguns navegadores suportam Permissions API
            if (navigator.permissions && navigator.permissions.query) {
                const status = await navigator.permissions.query({ name: 'camera' });
                if (status.state === 'granted') {
                    // Já concedido: inicia direto
                    await this.startCamera();
                } else if (status.state === 'prompt') {
                    // Mostra o modal para o usuário iniciar o fluxo
                    this.showCameraPrompt();
                } else {
                    // denied
                    this.showCameraPrompt();
                }
                // Atualiza UI se o estado mudar enquanto a página está aberta
                status.onchange = () => {
                    if (status.state === 'granted') {
                        this.hideCameraPrompt();
                        this.startCamera();
                    }
                };
                return;
            }
        } catch (_) {}
        // Fallback: se não houver Permissions API, apenas mostra o prompt inicial
        this.showCameraPrompt();
    }

    showCameraPrompt() {
        if (this.cameraPrompt) this.cameraPrompt.style.display = 'flex';
    }

    hideCameraPrompt() {
        if (this.cameraPrompt) this.cameraPrompt.style.display = 'none';
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
            this.resetEditor();
            this.renderEditor();

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
            this.resetEditor();
            this.renderEditor();
        };
        reader.onerror = () => {
            this.showNotification('Falha ao ler a imagem.', 'error');
        };
        reader.readAsDataURL(file);
    }

    async postPhoto() {
        if (!this.tempPhoto) return;

        const caption = this.photoCaption.value.trim() || 'Foto sem legenda';
        
        const finalImage = await this.exportEditedImage();
        const post = {
            id: Date.now(),
            image: finalImage,
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
        this.switchView('posts');

        // Enviar para nuvem, se habilitado
        this.pushPostToCloud(post).catch(() => {});
    }

    exportEditedImage() {
        // Se não houver editor, retorna a tempPhoto
        if (!this.editorCanvas || !this.tempPhoto) return this.tempPhoto;
        const img = new Image();
        const src = this.tempPhoto;
        return new Promise((resolve) => {
            img.onload = () => {
                // Render offscreen com os mesmos filtros/transformações do preview
                const off = document.createElement('canvas');
                off.width = this.editorCanvas.width;
                off.height = this.editorCanvas.height;
                const ctx = off.getContext('2d');

                const brightness = parseFloat(this.brightnessRange ? this.brightnessRange.value : '1') || 1;
                const contrast = parseFloat(this.contrastRange ? this.contrastRange.value : '1') || 1;
                const saturate = parseFloat(this.saturateRange ? this.saturateRange.value : '1') || 1;
                const blur = parseFloat(this.blurRange ? this.blurRange.value : '0') || 0;
                const grayscale = this.grayscaleChk && this.grayscaleChk.checked ? 1 : 0;
                const sepia = this.sepiaChk && this.sepiaChk.checked ? 1 : 0;
                const filterStr = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px) grayscale(${grayscale}) sepia(${sepia})`;

                const alpha = parseFloat(this.opacityRange ? this.opacityRange.value : '1') || 1;
                const rotateDeg = parseFloat(this.rotateRange ? this.rotateRange.value : '0') || 0;
                const flipH = !!(this.flipHChk && this.flipHChk.checked);
                const flipV = !!(this.flipVChk && this.flipVChk.checked);

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.filter = filterStr;
                const cx = off.width / 2;
                const cy = off.height / 2;
                ctx.translate(cx, cy);
                if (rotateDeg) ctx.rotate(rotateDeg * Math.PI / 180);
                ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
                ctx.drawImage(img, -cx, -cy, off.width, off.height);
                ctx.restore();

                // Cortar se houver cropRect
                const crop = this.cropRect || { x: 0, y: 0, w: off.width, h: off.height };
                const out = document.createElement('canvas');
                out.width = Math.max(1, Math.round(crop.w));
                out.height = Math.max(1, Math.round(crop.h));
                const octx = out.getContext('2d');
                octx.drawImage(off, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
                resolve(out.toDataURL('image/png'));
            };
            img.src = src;
        });
    }

    async pushPostToCloud(post) {
        if (!this.db) return;
        try {
            await this.db.collection('posts').doc(String(post.id)).set({
                id: post.id,
                image: post.image,
                caption: post.caption,
                timestamp: post.timestamp,
                likes: post.likes || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('Falha ao enviar post à nuvem:', e);
        }
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
                <div class="post-header">
                    <div class="left">
                        <div class="avatar"></div>
                        <div class="username">usuario</div>
                    </div>
                    <button class="more">⋯</button>
                </div>
                <img src="${post.image}" alt="Foto postada" class="post-image">
                <div class="post-actions">
                    <button class="action-btn${isLiked ? ' liked' : ''}" ${isLiked ? 'disabled' : ''} onclick="photoPlatform.likePost(${post.id})" title="Curtir">❤️</button>
                    <button class="action-btn" onclick="photoPlatform.downloadPost(${post.id})" title="Baixar">⬇️</button>
                    <button class="action-btn" onclick="photoPlatform.deletePost(${post.id})" title="Excluir">🗑️</button>
                </div>
                <div class="likes-row">${post.likes} curtida${post.likes !== 1 ? 's' : ''}</div>
                <div class="post-caption">${post.caption ? post.caption : ''}</div>
                <div class="timestamp">${post.timestamp}</div>
            </div>
        `;
        }).join('');
    }

    downloadPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        const link = document.createElement('a');
        link.href = post.image;
        const ts = new Date(post.timestamp).getTime() || post.id;
        const safeCaption = (post.caption || 'foto').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 40);
        link.download = `foto_${safeCaption}_${ts}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification('Download iniciado.', 'info');
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

        // Atualizar nuvem, se habilitada
        this.incrementLikeInCloud(postId).catch(() => {});
    }

    async incrementLikeInCloud(postId) {
        if (!this.db) return;
        try {
            const ref = this.db.collection('posts').doc(String(postId));
            await this.db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                const current = snap.exists ? (snap.data().likes || 0) : 0;
                tx.set(ref, { likes: current + 1 }, { merge: true });
            });
        } catch (e) {
            console.warn('Falha ao incrementar like na nuvem:', e);
        }
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

    async initializeCloudIfEnabled() {
        try {
            if (!window.firebaseConfig || !window.firebaseConfig.enabled) return;
            const { config } = window.firebaseConfig;
            if (!config || !config.apiKey) return;

            this.firebaseApp = firebase.initializeApp(config);
            this.db = firebase.firestore();

            // Sincronizar em tempo real
            this.unsubscribe = this.db.collection('posts')
                .orderBy('createdAt', 'desc')
                .onSnapshot((snap) => {
                    const cloudPosts = [];
                    snap.forEach(doc => {
                        const d = doc.data();
                        cloudPosts.push({
                            id: d.id,
                            image: d.image,
                            caption: d.caption,
                            timestamp: d.timestamp,
                            likes: d.likes || 0
                        });
                    });
                    // Atualiza localmente e salva cache
                    this.posts = cloudPosts;
                    this.savePosts();
                    this.updatePhotoCount();
                    this.renderPosts();
                });
        } catch (e) {
            console.warn('Falha ao inicializar nuvem (opcional):', e);
        }
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
