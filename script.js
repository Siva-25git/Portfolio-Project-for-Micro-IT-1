// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mainHeader = document.querySelector('.main-header');
    const heroSection = document.querySelector('.hero-section');
    const blogPostsListSection = document.getElementById('blog-posts');
    const singlePostViewSection = document.getElementById('single-post-view');
    const createPostSection = document.getElementById('create-post-section'); // NEW
    const postsContainer = document.getElementById('posts-container');
    const backToPostsButton = document.getElementById('back-to-posts');
    const postDetailTitle = document.getElementById('post-detail-title');
    const postDetailAuthor = document.getElementById('post-detail-author');
    const postDetailDate = document.getElementById('post-detail-date');
    const postDetailContent = document.getElementById('post-detail-content');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const scrollDownButton = document.querySelector('.scroll-down-button');

    // New post form elements
    const createPostButton = document.getElementById('create-post-button'); // NEW
    const backFromCreateButton = document.getElementById('back-from-create'); // NEW
    const newPostForm = document.getElementById('new-post-form'); // NEW
    const formMessage = document.getElementById('form-message'); // NEW


    // --- State Variables ---
    let allPosts = []; // Stores all post summaries
    let currentActiveSection = blogPostsListSection; // Default active section

    // --- Utility Functions ---

    // Function to fetch all blog post summaries
    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allPosts = await response.json();
            renderPostSummaries(allPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            postsContainer.innerHTML = '<p class="error-message">Failed to load blog posts. Please try again later.</p>';
        }
    }

    // Function to fetch a single blog post by ID
    async function fetchSinglePost(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Post not found.");
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching single post:", error);
            postDetailContent.innerHTML = `<p class="error-message">${error.message || 'Failed to load post content.'}</p>`;
            return null;
        }
    }

    // Renders blog post summaries on the home page
    function renderPostSummaries(postsToRender) {
        postsContainer.innerHTML = ''; // Clear existing posts
        if (postsToRender.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts-message">No posts yet! Be the first to create one.</p>';
        }
        postsToRender.forEach(post => {
            const postCard = document.createElement('a');
            postCard.href = `#/posts/${post.id}`; // Use hash for internal navigation
            postCard.className = 'post-card animate-on-scroll'; // Add class for scroll animation

            postCard.innerHTML = `
                <div class="post-card-content">
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-meta">By ${post.author} on ${new Date(post.date).toLocaleDateString()}</p>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    <span class="read-more-button">Read More &rarr;</span>
                </div>
            `;
            postsContainer.appendChild(postCard);
        });
        setupScrollAnimations(); // Setup observer for newly rendered cards
    }

    // Renders the full content of a single post
    function renderSinglePost(post) {
        if (!post) {
            // Error message already handled by fetchSinglePost
            postDetailTitle.textContent = 'Error Loading Post';
            postDetailAuthor.textContent = '';
            postDetailDate.textContent = '';
            return;
        }
        postDetailTitle.textContent = post.title;
        postDetailAuthor.textContent = `By ${post.author}`;
        postDetailDate.textContent = new Date(post.date).toLocaleDateString();
        postDetailContent.innerHTML = post.content; // Inject HTML content
        setupScrollAnimations(); // Setup observer for single post content
    }

    // Displays a temporary message on the form
    function showFormMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`; // Add success or error class
        formMessage.style.opacity = 1; // Fade in

        setTimeout(() => {
            formMessage.style.opacity = 0; // Fade out
            setTimeout(() => {
                formMessage.className = 'form-message'; // Reset classes
            }, 300); // Wait for fade out transition
        }, 3000); // Display for 3 seconds
    }


    // --- Section Management & Animations ---

    // Hides the current active section and shows the new one
    function showSection(sectionToShow, animate = true) {
        if (currentActiveSection === sectionToShow) return;

        // Hide all potential sections first
        document.querySelectorAll('.main-content section').forEach(sec => {
            sec.classList.add('hidden-section');
            sec.classList.remove('active-section');
        });

        // Show the target section
        sectionToShow.classList.remove('hidden-section');
        sectionToShow.classList.add('active-section');

        // Re-apply scroll animations if needed for the new section
        if (sectionToShow.id === 'blog-posts') {
            document.querySelectorAll('#posts-container .post-card').forEach(el => el.classList.remove('visible'));
        } else if (sectionToShow.id === 'single-post-view') {
             document.querySelectorAll('#single-post-view .animate-on-scroll').forEach(el => el.classList.remove('visible'));
        } else if (sectionToShow.id === 'create-post-section') {
            document.querySelectorAll('#create-post-section .animate-on-scroll').forEach(el => el.classList.remove('visible'));
        }
        setupScrollAnimations();


        currentActiveSection = sectionToShow;
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on section change
    }

    // --- Router-like Navigation ---

    // Handles URL changes and loads appropriate content
    async function handleLocationChange() {
        const path = window.location.hash.substring(1); // Get hash path (e.g., /posts/id)

        if (path.startsWith('/posts/')) {
            const postId = path.substring('/posts/'.length);
            const post = await fetchSinglePost(postId);
            if (post) {
                renderSinglePost(post);
                showSection(singlePostViewSection);
            } else {
                // Fallback if post not found
                window.location.hash = ''; // Go back to main posts list
            }
        } else if (path === '/create') { // NEW: Handle create post route
            showSection(createPostSection);
            newPostForm.reset(); // Clear form on entry
            formMessage.className = 'form-message'; // Clear any previous messages
        } else if (path === '/about') {
            showSection(document.getElementById('about'));
        } else if (path === '/contact') {
            showSection(document.getElementById('contact'));
        } else {
            // Default to blog posts list
            showSection(blogPostsListSection);
        }
    }

    // --- Scroll Animations (Intersection Observer) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // observer.unobserve(entry.target); // Optional: unobserve after animating once
            } else {
                // Optional: remove visible class if out of view (for repeated animations)
                // entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: '0px 0px -100px 0px' // Start observing a bit earlier than viewport end
    });

    function setupScrollAnimations() {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.unobserve(el); // Prevent observing elements multiple times
            observer.observe(el);
        });
    }

    // --- New Post Form Submission ---
    async function submitNewPost(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        const formData = new FormData(newPostForm);
        const postData = {};
        formData.forEach((value, key) => {
            postData[key] = value;
        });

        // Basic client-side validation
        if (!postData.title || !postData.author || !postData.excerpt || !postData.content) {
            showFormMessage("All fields are required!", "error");
            return;
        }

        try {
            const response = await fetch('/api/posts/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const result = await response.json();

            if (response.ok) {
                showFormMessage("Post published successfully!", "success");
                newPostForm.reset(); // Clear the form
                // Redirect back to main posts list after a short delay
                setTimeout(() => {
                    window.location.hash = ''; // Go back to main posts list
                    fetchPosts(); // Re-fetch posts to show the new one
                }, 1500);
            } else {
                showFormMessage(`Error: ${result.error || 'Failed to create post.'}`, "error");
            }
        } catch (error) {
            console.error("Network or server error during post creation:", error);
            showFormMessage("A network error occurred. Please try again.", "error");
        }
    }


    // --- Event Listeners ---

    // Initial page load and hash change listener
    window.addEventListener('hashchange', handleLocationChange);

    // Initial load for blog posts
    fetchPosts().then(() => {
        handleLocationChange(); // Handle initial URL hash
        // Initial animation for hero section after content is loaded
        heroSection.classList.add('animate-on-load');
    });

    // Back to posts button (from single post view)
    backToPostsButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = ''; // Clear hash to go to main posts list
    });

    // Back to posts button (from create post view)
    backFromCreateButton.addEventListener('click', (e) => { // NEW
        e.preventDefault();
        window.location.hash = ''; // Go back to main posts list
    });

    // Handle navigation links (for SPA feel)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent full page reload
            const targetId = link.getAttribute('href').substring(1); // Get section ID
            window.location.hash = targetId; // Update hash, handleLocationChange will pick it up
        });
    });

    // Smooth scroll for hero section button
    scrollDownButton.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = document.getElementById('blog-posts');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Create New Post Button click
    createPostButton.addEventListener('click', (e) => { // NEW
        e.preventDefault();
        window.location.hash = 'create'; // Change hash to show create form
    });

    // New Post Form submission
    newPostForm.addEventListener('submit', submitNewPost); // NEW

    // Optional: Add a subtle animation to header on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });
    // Add CSS for .main-header.scrolled if you enable this
    // .main-header.scrolled { background: var(--dark-bg); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); }
});