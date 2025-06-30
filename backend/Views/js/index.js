const posts = [
    {
        id: 1,
        username: "Neksha DeSilva",
        handle: "@nekshavs",
        avatar: "https://www.github.com/nekshadesilva.png",
        time: "2h",
        content: "Just deployed our new quantum computing simulation framework! 🚀 The intersection of classical algorithms and quantum mechanics continues to blow my mind. Open source is the future of scientific computing.",
        hashtags: ["#QuantumComputing", "#OpenSource", "#Science"],
        likes: 342,
        replies: 67,
        reposts: 89,
        verified: false
    },
    {
        id: 2,
        username: "TheLadyADA",
        handle: "@ladyada",
        avatar: "https://www.github.com/ladyada.png",
        time: "4h",
        content: "Building distributed systems that can handle millions of requests per second isn't just about the code—it's about understanding the psychology of data flow. Every byte has a story. 📊",
        hashtags: ["#DistributedSystems", "#CloudComputing", "#Performance"],
        likes: 156,
        replies: 42,
        reposts: 23,
        verified:true
    },
    {
        id: 3,
        username: "SinDre",
        handle: "@sindresorhus",
        avatar: "https://www.github.com/sindresorhus.png",
        time: "6h",
        content: "The beauty of functional programming isn't in its syntax—it's in how it teaches you to think about problems as transformations rather than mutations. Pure functions, pure thoughts. ✨",
        hashtags: ["#FunctionalProgramming", "#CleanCode", "#Philosophy"],
        likes: 289,
        replies: 78,
        reposts: 145,
        verified:true
    },
    {
        id: 4,
        username: "Linus Torvalds",
        handle: "@torwalds",
        avatar: "https://www.github.com/torwalds.png",
        time: "8h",
        content: "Machine learning models are like digital dreams—they see patterns we never knew existed. Today's breakthrough: our AI can now predict code bugs before they're written. The future is collaborative intelligence. 🤖",
        hashtags: ["#MachineLearning", "#AI", "#CodeAnalysis"],
        likes: 521,
        replies: 134,
        reposts: 267,
        verified: true
    },
    {
        id: 5,
        username: "OpenRockets OSS",
        handle: "@OpenRockets",
        avatar: "https://www.github.com/openrockets.png",
        time: "12h",
        content: "Decentralization isn't just a technology—it's a philosophy of empowerment. Every smart contract we write is a small step toward a more transparent world. Building the infrastructure of tomorrow, one block at a time. 🔗",
        hashtags: ["#Blockchain", "#DeFi", "#Web3"],
        likes: 403,
        replies: 98,
        reposts: 187,
        verified: true
    }
];

class OpenThreadsApp {
    constructor(   ){
        this.currentTheme=localStorage.getItem('theme')||'dark';
        this.maxChars=280;
        this.init( );
    }

    init(   ){
        this.setTheme(this.currentTheme);
        this.showLoadingScreen( );
        this.setupEventListeners( );
        setTimeout(()=>{
            this.hideLoadingScreen();
            this.renderPosts( );
        },2000);
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
                e.target.classList.add('active');
            });
        });
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
        `;
        this.addPostInteractions(post);
        return post;
    }

    addPostInteractions(post){
        const likeBtn=post.querySelector('.heart-like-button');
        const repostBtn=post.querySelector('.share-again-button');
        const bookmarkBtn=post.querySelector('.save-later-button');
        likeBtn?.addEventListener('click',(e)=>{
            e.preventDefault();
            const icon=likeBtn.querySelector('i');
            const count=likeBtn.querySelector('span');
            const currentCount=parseInt(count.textContent);
            if(icon.classList.contains('bi-heart')){
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
                likeBtn.style.color='var(--danger-color)';
                count.textContent=currentCount+1;
            }else{
                icon.classList.remove('bi-heart-fill');
                icon.classList.add('bi-heart');
                likeBtn.style.color='var(--text-muted)';
                count.textContent=currentCount-1;
            }
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

    renderPosts( ){
        const postsContainer=document.getElementById('posts-feed');
        if(!postsContainer)return;
        posts.forEach(postData=>{
            const postElement=this.createPost(postData);
            postsContainer.appendChild(postElement);
        });
    }

    createNewPost(textarea){
        if(!textarea||!textarea.value.trim())return;
        const content=textarea.value.trim();
        const hashtagRegex=/#\w+/g;
        const hashtags=content.match(hashtagRegex)||[];
        const newPost={
            id:Date.now(),
            username:"You",
            handle:"@you",
            avatar:"https://www.github.com/openrockets.png",
            time:"now",
            content:content,
            hashtags:hashtags,
            likes:0,
            replies:0,
            reposts:0,
            verified:false
        };
        const postsContainer=document.getElementById('posts-feed');
        const postElement=this.createPost(newPost);
        postElement.style.opacity='0';
        postElement.style.transform='translateY(-20px)';
        postsContainer.insertBefore(postElement,postsContainer.firstChild);
        setTimeout(()=>{
            postElement.style.transition='all 0.3s ease';
            postElement.style.opacity='1';
            postElement.style.transform='translateY(0)';
        },10);
        textarea.value='';
        textarea.style.height='auto';
        const charCount=document.getElementById('charCount');
        const charCircle=document.getElementById('charCircle');
        const postBtn=document.getElementById('postBtn');
        if(charCount)charCount.textContent='280';
        if(charCircle){
            charCircle.style.strokeDashoffset='0';
            charCircle.style.stroke='var(--text-muted)';
        }
        if(postBtn)postBtn.disabled=true;
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