class OpenThreadsApp {
    user = null;
    isAnonymous = false;
    oprcId = null;

    selectedMedia = null;
    selectedGif = null;
    links = [];
    constructor(){
        this.currentTheme=localStorage.getItem('theme')||'dark';
        this.maxChars=280;
        this.init();
    }



    async init(){
        this.setTheme(this.currentTheme);
        this.showLoadingScreen();
        this.setupOPRC();
        this.setupAuthModal();
        this.setupEventListeners();
        try {
            await this.checkAuth();
            await this.fetchAndRenderPosts();
        } catch (err) {
            // Optionally log error
        } finally {
            this.hideLoadingScreen();
            // Always show app container after loading
            const appContainer = document.getElementById('appContainer');
            if (appContainer) {
                appContainer.style.display = 'block';
                appContainer.style.opacity = '1';
            }
        }
    }

    setupOPRC(){
        let id=localStorage.getItem('OPRC_id');
        if(!id){
            id='oprc_'+Math.random().toString(36).slice(2)+Date.now();
            localStorage.setItem('OPRC_id',id);
        }
        this.oprcId=id;
    }

    setupAuthModal(){
        const authModal=document.getElementById('authModal');
        const showLogin=document.getElementById('showLogin');
        const showRegister=document.getElementById('showRegister');
        const loginForm=document.getElementById('loginForm');
        const registerForm=document.getElementById('registerForm');
        showLogin.onclick=()=>{
            showLogin.classList.add('active');
            showRegister.classList.remove('active');
            loginForm.style.display='flex';
            registerForm.style.display='none';
        };
        showRegister.onclick=()=>{
            showRegister.classList.add('active');
            showLogin.classList.remove('active');
            loginForm.style.display='none';
            registerForm.style.display='flex';
        };
        loginForm.onsubmit=async(e)=>{
            e.preventDefault();
            const username=document.getElementById('loginUsername').value.trim();
            const password=document.getElementById('loginPassword').value;
            const error=document.getElementById('loginError');
            error.textContent='';
            const res=await fetch('/api/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({username,password})
            });
            if(res.ok){
                await this.checkAuth();
                authModal.style.display='none';
                await this.fetchAndRenderPosts();
            }else{
                const data=await res.json();
                error.textContent=data.message||'Login failed';
            }
        };
        registerForm.onsubmit=async(e)=>{
            e.preventDefault();
            const username=document.getElementById('registerUsername').value.trim();
            const name=document.getElementById('registerName').value.trim();
            const email=document.getElementById('registerEmail').value.trim();
            const age=document.getElementById('registerAge').value;
            const password=document.getElementById('registerPassword').value;
            const contact=document.getElementById('registerContact').value.trim();
            const error=document.getElementById('registerError');
            error.textContent='';
            const res=await fetch('/api/register',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({username,name,email,age,password,contact})
            });
            if(res.ok){
                await this.checkAuth();
                authModal.style.display='none';
                await this.fetchAndRenderPosts();
            }else{
                const data=await res.json();
                error.textContent=data.message||'Registration failed';
            }
        };
    }

    async checkAuth(){
        try{
            const res=await fetch('/api/me');
            if(res.ok){
                const data=await res.json();
                this.user=data.user;
                this.isAnonymous=false;
                this.setAuthUI(true);
            }else{
                this.user=null;
                this.isAnonymous=true;
                this.setAuthUI(false);
            }
        }catch{
            this.user=null;
            this.isAnonymous=true;
            this.setAuthUI(false);
        }
    }

    setAuthUI(isLoggedIn){
        const authModal=document.getElementById('authModal');
        const appContainer=document.getElementById('appContainer');
        if(isLoggedIn){
            authModal.style.display='none';
            appContainer.style.display='block';
        }else{
            authModal.style.display='none';
            appContainer.style.display='block';
        }
    }

    async logout(){
        await fetch('/api/logout',{method:'POST'});
        this.user=null;
        this.setAuthUI(false);
        await this.fetchAndRenderPosts();
    }

    async fetchAndRenderPosts(tab = 'recent') {
        const postsContainer = document.getElementById('posts-feed');
        const skeleton = document.getElementById('skeletonLoader');
        const tabSpinners = document.querySelectorAll('.tab-loader');
        if (!postsContainer) return;
        postsContainer.innerHTML = '';
        skeleton.style.display = 'flex';
        tabSpinners.forEach(spinner => spinner.style.display = 'none');
        const activeTab = document.querySelector(`.switch-tab-thing[data-tab="${tab}"]`);
        const activeSpinner = activeTab?.querySelector('.tab-loader');
        if (activeSpinner) activeSpinner.style.display = 'inline-flex';
        let data = null;
        let threads = [];
        try {
            const res = await fetch('/api/posts');
            if (!res.ok) throw new Error('Failed to fetch posts');
            data = await res.json();
            threads = data.threads || [];
        } catch (err) {
            // Show error message in feed
            postsContainer.innerHTML = '<div class="feed-error">Failed to load posts. Please try again later.</div>';
        } finally {
            skeleton.style.display = 'none';
            if (activeSpinner) activeSpinner.style.display = 'none';
        }
        if (!threads.length) return;
        for (const thread of threads) {
            const user = await this.fetchUser(thread.user_ID);
            const postData = {
                id: thread._id,
                username: user?.name || 'User',
                handle: user ? ('@' + user.username) : '@user',
                avatar: user?.avatar || 'https://www.github.com/openrockets.png',
                time: this.timeAgo(thread.date),
                content: thread.content,
                hashtags: thread.hashtags,
                likes: thread.likes?.number || 0,
                replies: thread.comments?.length || 0,
                reposts: thread.reposts?.number || 0,
                verified: user?.admin || false
            };
            const postElement = this.createPost(postData, thread);
            postsContainer.appendChild(postElement);
        }
    }

    async fetchUser(userId){
        const res=await fetch('/api/user/'+userId);
        if(!res.ok)return null;
        const data=await res.json();
        return data.user;
    }

    timeAgo(dateStr){
        const date=new Date(dateStr);
        const now=new Date();
        const diff=Math.floor((now-date)/1000);
        if(diff<60)return 'now';
        if(diff<3600)return Math.floor(diff/60)+'m';
        if(diff<86400)return Math.floor(diff/3600)+'h';
        return Math.floor(diff/86400)+'d';
    }

    showLoadingScreen( ){
        const loadingScreen=document.getElementById('loadingScreen');
        loadingScreen.style.display='flex';
    }

    hideLoadingScreen( ){
        const loadingScreen=document.getElementById('loadingScreen');
        const appContainer=document.getElementById('appContainer');
        loadingScreen.classList.add('hidden');
        setTimeout(()=>{
            loadingScreen.style.display='none';
            appContainer.style.opacity='1';
        },500);
    }

    setTheme(theme){
        document.body.setAttribute('data-theme',theme);
        const themeToggle=document.getElementById('themeToggle');
        const themeIcon=themeToggle?.querySelector('.color-switch-icon');
        const themeText=themeToggle?.querySelector('.theme-text');
        if(theme==='dark'){
            themeIcon?.classList.remove('bi-sun-fill');
            themeIcon?.classList.add('bi-moon-fill');
            if(themeText)themeText.textContent='Dark Mode';
        }else{
            themeIcon?.classList.remove('bi-moon-fill');
            themeIcon?.classList.add('bi-sun-fill');
            if(themeText)themeText.textContent='Light Mode';
        }
        localStorage.setItem('theme',theme);
        this.currentTheme=theme;
    }

    toggleTheme( ){
        const newTheme=this.currentTheme==='dark'?'light':'dark';
        this.setTheme(newTheme);
    }

    setupEventListeners( ){
        const themeToggle=document.getElementById('themeToggle');
        themeToggle?.addEventListener('click',()=>this.toggleTheme());
        const textarea=document.getElementById('postTextarea');
        const postBtn=document.getElementById('postBtn');
        const charCount=document.getElementById('charCount');
        const charCircle=document.getElementById('charCircle');
        textarea?.addEventListener('input',(e)=>{
            this.handleTextareaInput(e.target,charCount,charCircle,postBtn);
        });
        postBtn?.addEventListener('click',()=>{
            this.createNewPost(textarea);
        });
        const feedTabs=document.querySelectorAll('.switch-tab-thing');
        feedTabs.forEach(tab=>{
            tab.addEventListener('click',(e)=>{
                feedTabs.forEach(t=>t.classList.remove('active'));
                tab.classList.add('active');
                const tabType = tab.getAttribute('data-tab') || 'recent';
                this.fetchAndRenderPosts(tabType);
            });
        });

        // Media, GIF, Link picker logic
        const addImageBtn = document.getElementById('media-picker-btn');
        const addGifBtn = document.getElementById('gif-picker-btn');
        const addLinkBtn = document.getElementById('link-picker-btn');
        const mediaPickerModal = document.getElementById('media-picker-modal');
        const gifPickerModal = document.getElementById('gif-picker-modal');
        const linkPickerModal = document.getElementById('link-picker-modal');
        const mediaDropZone = document.getElementById('media-drop-zone');
        const mediaInput = document.getElementById('media-input');
        const gifSearchInput = document.getElementById('gif-search-input');
        const gifResults = document.getElementById('gif-results');
        const linkUrlInput = document.getElementById('link-url-input');
        const linkTextInput = document.getElementById('link-text-input');
        const linkAddBtn = document.getElementById('link-add-btn');
        const linkList = document.getElementById('link-list');

        addImageBtn?.addEventListener('click', () => {
            mediaPickerModal.style.display = 'block';
        });
        addGifBtn?.addEventListener('click', () => {
            gifPickerModal.style.display = 'block';
        });
        addLinkBtn?.addEventListener('click', () => {
            linkPickerModal.style.display = 'block';
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => {
                btn.closest('.modal').style.display = 'none';
            };
        });

        mediaDropZone.ondragover = e => {
            e.preventDefault();
            mediaDropZone.classList.add('dragover');
        };
        mediaDropZone.ondragleave = () => {
            mediaDropZone.classList.remove('dragover');
        };
        mediaDropZone.ondrop = e => {
            e.preventDefault();
            mediaDropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.selectedMedia = file;
                this.selectedGif = null;
                this.showMediaPreview(file);
                mediaPickerModal.style.display = 'none';
            }
        };
        mediaInput.onchange = e => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.selectedMedia = file;
                this.selectedGif = null;
                this.showMediaPreview(file);
                mediaPickerModal.style.display = 'none';
            }
        };
        gifSearchInput.oninput = async e => {
            const q = e.target.value.trim();
            if (!q) return;
            gifResults.innerHTML = '<div class="spinner"></div>';
            const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=LIVDSRZULELA&limit=10`);
            const data = await res.json();
            gifResults.innerHTML = '';
            data.results.forEach(gif => {
                const img = document.createElement('img');
                img.src = gif.media_formats.gif.url;
                img.className = 'gif-thumb';
                img.onclick = () => {
                    this.selectedGif = gif.media_formats.gif.url;
                    this.selectedMedia = null;
                    this.showGifPreview(this.selectedGif);
                    gifPickerModal.style.display = 'none';
                };
                gifResults.appendChild(img);
            });
        };
        linkAddBtn.onclick = () => {
            const url = linkUrlInput.value.trim();
            const text = linkTextInput.value.trim();
            if (url && text) {
                this.links.push({ url, text });
                this.renderLinks(linkList);
                linkUrlInput.value = '';
                linkTextInput.value = '';
                linkPickerModal.style.display = 'none';
            }
        };
    }

    showMediaPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('media-preview').src = e.target.result;
            document.getElementById('media-preview').style.display = 'block';
            document.getElementById('gif-preview').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
    showGifPreview(url) {
        document.getElementById('gif-preview').src = url;
        document.getElementById('gif-preview').style.display = 'block';
        document.getElementById('media-preview').style.display = 'none';
    }
    renderLinks(linkList) {
        linkList.innerHTML = '';
        this.links.forEach((l, i) => {
            const a = document.createElement('a');
            a.href = l.url;
            a.textContent = l.text;
            a.target = '_blank';
            linkList.appendChild(a);
            const rm = document.createElement('span');
            rm.textContent = ' ×';
            rm.className = 'link-remove';
            rm.onclick = () => {
                this.links.splice(i, 1);
                this.renderLinks(linkList);
            };
            linkList.appendChild(rm);
            linkList.appendChild(document.createElement('br'));
        });
    }
    resetMediaAndLinks() {
        this.selectedMedia = null;
        this.selectedGif = null;
        this.links = [];
        document.getElementById('media-preview').style.display = 'none';
        document.getElementById('gif-preview').style.display = 'none';
        document.getElementById('link-list').innerHTML = '';
    }

    handleTextareaInput(textarea,charCount,charCircle,postBtn){
        textarea.style.height='auto';
        textarea.style.height=textarea.scrollHeight+'px';
        const length=textarea.value.length;
        const remaining=this.maxChars-length;
        if(charCount){
            charCount.textContent=remaining;
            charCount.style.color=remaining<20?'var(--danger-color)':'var(--text-muted)';
        }
        if(charCircle){
            const circumference=2*Math.PI*8;
            const progress=length/this.maxChars;
            const offset=circumference*progress;
            charCircle.style.strokeDashoffset=offset;
            if(length>this.maxChars){
                charCircle.style.stroke='var(--danger-color)';
            }else if(length>this.maxChars*0.8){
                charCircle.style.stroke='var(--warning-color)';
            }else{
                charCircle.style.stroke='var(--accent-color)';
            }
        }
        if(postBtn){
            postBtn.disabled=length===0||length>this.maxChars;
        }
    }

    createPost(postData){
        const post=document.createElement('div');
        post.className='single-post-thing';
        const hashtags=postData.hashtags?
            `<div class="tag-link-things">${postData.hashtags.map(tag=>
                `<a href="#" class="single-tag-link">${tag}</a>`).join('')}</div>`:'';
        post.innerHTML=`
            <div class="post-top-info">
                <div class="user-small-pic">
                    <img src="${postData.avatar}" alt="${postData.username}">
                </div>
                <div class="person-detail-stuff">
                    <div class="person-name-text">
                        ${postData.username}
                        ${postData.verified?'<i class="bi bi-patch-check-fill   check-mark-verified"></i>':''}
                    </div>
                    <div class="at-username-text">${postData.handle}</div>
                </div>
                <div class="when-posted-time">${postData.time}</div>
            </div>
            <div class="message-text-content">
                ${postData.content}
                ${hashtags}
            </div>
            <div class="button-row-actions">
                <button class="action-click-button talk-back-button" title="Reply">
                    <i class="bi bi-chat"></i>
                    <span>${postData.replies||0}</span>
                </button>
                <button class="action-click-button share-again-button" title="Repost">
                    <i class="bi bi-arrow-repeat"></i>
                    <span>${postData.reposts||0}</span>
                </button>
                <button class="action-click-button heart-like-button" title="Like">
                    <i class="bi bi-heart"></i>
                    <span>${postData.likes||0}</span>
                </button>
                <button class="action-click-button send-other-button" title="Share">
                    <i class="bi bi-share"></i>
                </button>
                <button class="action-click-button save-later-button" title="Bookmark">
                    <i class="bi bi-bookmark"></i>
                </button>
            </div>
            <div class="comments-section"></div>
            <div class="add-comment-box">
                <input class="comment-input" type="text" placeholder="Reply...">
                <button class="send-comment-btn"><i class="bi bi-send"></i></button>
            </div>
        `;
        this.addPostInteractions(post, threadObj);
        this.renderComments(post, threadObj);
        this.setupCommentInput(post, threadObj);
        return post;
    }

    addPostInteractions(post){
        const likeBtn=post.querySelector('.heart-like-button');
        const repostBtn=post.querySelector('.share-again-button');
        const bookmarkBtn=post.querySelector('.save-later-button');
        likeBtn?.addEventListener('click',async(e)=>{
            e.preventDefault();
            likeBtn.classList.add('like-anim');
            setTimeout(()=>likeBtn.classList.remove('like-anim'),300);
            await fetch('/api/post/like',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({thread_ID:threadObj._id})
            });
            this.fetchAndRenderPosts();
        });
        repostBtn?.addEventListener('click',(e)=>{
            e.preventDefault();
            const icon=repostBtn.querySelector('i');
            const count=repostBtn.querySelector('span');
            const currentCount=parseInt(count.textContent);
            if(!repostBtn.classList.contains('reposted')){
                repostBtn.classList.add('reposted');
                repostBtn.style.color='var(--success-color)';
                count.textContent=currentCount+1;
            }else{
                repostBtn.classList.remove('reposted');
                repostBtn.style.color='var(--text-muted)';
                count.textContent=currentCount-1;
            }
        });
        bookmarkBtn?.addEventListener('click',(e)=>{
            e.preventDefault();
            const icon=bookmarkBtn.querySelector('i');
            if(icon.classList.contains('bi-bookmark')){
                icon.classList.remove('bi-bookmark');
                icon.classList.add('bi-bookmark-fill');
                bookmarkBtn.style.color='var(--accent-color)';
            }else{
                icon.classList.remove('bi-bookmark-fill');
                icon.classList.add('bi-bookmark');
                bookmarkBtn.style.color='var(--text-muted)';
            }
        });
    }




    async createNewPost(textarea) {
        if (!textarea || !textarea.value.trim()) return;
        const content = textarea.value.trim();
        const spinner = document.getElementById('spinnerOverlay');
        spinner.style.display = 'flex';
        let res;
        if (this.isAnonymous) {
            res = await fetch('/api/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, anonymous: true, oprc_id: this.oprcId })
            });
        } else {
            res = await fetch('/api/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
        }
        spinner.style.display = 'none';
        if (res.ok) {
            textarea.value = '';
            textarea.style.height = 'auto';
            const charCount = document.getElementById('charCount');
            const charCircle = document.getElementById('charCircle');
            const postBtn = document.getElementById('postBtn');
            if (charCount) charCount.textContent = '280';
            if (charCircle) {
                charCircle.style.strokeDashoffset = '0';
                charCircle.style.stroke = 'var(--text-muted)';
            }
            if (postBtn) postBtn.disabled = true;
            await this.fetchAndRenderPosts();
        }
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    new OpenThreadsApp();
});

if(window.matchMedia){
    const mediaQuery=window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change',(e)=>{
        if(!localStorage.getItem('theme')){
            const app=window.openThreadsApp;
            if(app){
                app.setTheme(e.matches?'dark':'light');
            }
        }
    });
}