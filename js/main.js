
// State
let currentProjectIndex = 0;
let projectFiles = []; // Populated dynamically
const projectDisplay = document.getElementById('injected-content');
const indicator = document.getElementById('project-indicator');
const displayArea = document.getElementById('project-display-area');
const progressFill = document.getElementById('progress-fill');

// GSAP & Lenis Init
const lenis = new Lenis();
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Reveal Animation & Sticky Logic
gsap.registerPlugin(ScrollTrigger);

// 1. REVEAL FUNCTION (Global for re-use)
function initReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => {
        if (el.getClientRects().length === 0) return;

        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 90%' }
            }
        );
    });
}

// 2. SCROLL & NAVBAR LOGIC
function initScrollLogic() {
    // Initial Reveal
    initReveal();

    // Navbar CROSSFADE Logic - Portfolio Section Swap
    const navbar = document.querySelector('.navbar-pill');
    const controls = document.querySelector('.slider-controls-custom');
    const portfolioSection = document.querySelector('#portfolio');

    if (controls && portfolioSection) {
        ScrollTrigger.create({
            trigger: "#portfolio",
            start: "top 80px", // Just after header enters
            end: "bottom bottom", // Stays active until the VERY END of the section
            toggleClass: { targets: "body", className: "in-portfolio-view" }
            // CSS handles the rest: hiding navbar, showing controls
        });
    }

    // Removed Automatic Walkthrough Trigger to prevent "blur thing"


    // ScrollSpy (Active Link Highlighting + Sliding Pill)
    const sections = ['hero', 'about', 'portfolio', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');
    const activePill = document.querySelector('.nav-active-bg');

    function updatePill(targetLink) {
        if (!targetLink || !activePill) return;

        // Calculate position relative to container
        const parent = targetLink.parentElement;
        const rect = targetLink.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const left = rect.left - parentRect.left;
        const width = rect.width;

        activePill.style.width = `${width}px`;
        activePill.style.left = `${left}px`;
        activePill.style.opacity = '1';
    }

    sections.forEach(secId => {
        ScrollTrigger.create({
            trigger: `#${secId}`,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
                if (self.isActive) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${secId}`) {
                            link.classList.add('active');
                            updatePill(link);
                        }
                    });
                }
            }
        });
    });
}
initScrollLogic();

// Mermaid Init
function initMermaid() {
    if (window.mermaid) {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'base',
            themeVariables: {
                primaryColor: '#000000',
                primaryTextColor: '#fff',
                primaryBorderColor: '#fff',
                lineColor: '#fff',
                background: '#000000',
                mainBkg: '#000000',
                fontFamily: 'Inter'
            }
        });
        setTimeout(() => {
            mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }, 100);
    }
}

// ---------------------------------------------------------
// PROJECT FILES - Hardcoded list for reliable loading
// ---------------------------------------------------------
async function initPortfolio() {
    if (displayArea) displayArea.classList.add('loading-active');

    // Hardcoded list of project files - add new projects here
    projectFiles = [
        'chat-with-pdf.html',
        'image-generation.html',
        'mitra.html',
        'gamers.html',
        'email_track.html',
        'reinforcement_Learning.html',
        'tiny_llm.html'
    ];

    loadProject(0);
}

function showErrorState(err) {
    if (displayArea) displayArea.classList.remove('loading-active');
    if (projectDisplay) {
        projectDisplay.innerHTML = `
            <div style="padding:40px; text-align:center;">
                <h3>Failed to Load Project</h3>
                <p>Could not fetch project file. Please ensure you're running through a local server (Live Server, etc.)</p>
            </div>`;
        projectDisplay.style.opacity = '1';
    }
}

// SLIDER LOGIC
async function loadProject(index) {
    if (projectFiles.length === 0) return;

    if (index < 0) index = projectFiles.length - 1;
    if (index >= projectFiles.length) index = 0;

    currentProjectIndex = index;
    const filename = projectFiles[index];

    if (displayArea) displayArea.classList.add('loading-active');
    if (projectDisplay) projectDisplay.style.opacity = '0';

    try {
        const response = await fetch(`pages/${filename}`);
        if (!response.ok) throw new Error("Status " + response.status);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract content
        const content = doc.querySelector('main') ? doc.querySelector('main').innerHTML : doc.body.innerHTML;

        // Extract Title
        const titleEl = doc.querySelector('.project-title-xl') || doc.querySelector('h2');
        const projectTitle = titleEl ? titleEl.innerText.trim() : filename.replace('.html', '');

        // UPDATE UI
        setTimeout(() => {
            if (projectDisplay) {
                projectDisplay.innerHTML = content;

                // Execute Scripts in Injected Content
                const scripts = projectDisplay.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
            if (indicator) indicator.innerText = `${projectTitle} (${index + 1} / ${projectFiles.length})`;

            // Progress Bar (0% -> 100%)
            let percent = 0;
            if (projectFiles.length > 1) {
                percent = (index / (projectFiles.length - 1)) * 100;
            } else {
                percent = 100;
            }
            if (progressFill) progressFill.style.width = `${percent}%`;

            // Re-Init
            initMermaid();
            setTimeout(() => {
                initReveal();
                ScrollTrigger.refresh();
            }, 100);

            if (projectDisplay) projectDisplay.style.opacity = '1';
            if (displayArea) displayArea.classList.remove('loading-active');

        }, 400);

    } catch (err) {
        console.error("Fetch Error:", err);
        showErrorState(err);
    }
}

// Helper to hide walkthrough
let isWalkthroughDismissed = false;

function hideWalkthrough() {
    isWalkthroughDismissed = true;
    const w = document.getElementById('walkthrough-overlay');
    if (w) w.style.display = 'none';

    const blur = document.getElementById('global-blur-mask');
    if (blur) {
        blur.style.opacity = '0';
        setTimeout(() => blur.style.display = 'none', 500);
    }
}

// Show Walkthrough
function showWalkthrough() {
    if (isWalkthroughDismissed) return;

    const w = document.getElementById('walkthrough-overlay');
    if (w) w.style.display = 'block';

    const blur = document.getElementById('global-blur-mask');
    if (blur) {
        blur.style.display = 'block';
        // Force reflow
        blur.offsetHeight;
        blur.style.opacity = '1';
    }
}

window.nextProject = function () {
    hideWalkthrough();
    loadProject(currentProjectIndex + 1);
    if (typeof lenis !== 'undefined') lenis.scrollTo('#portfolio', { offset: -20 });
}
window.prevProject = function () {
    hideWalkthrough();
    loadProject(currentProjectIndex - 1);
    if (typeof lenis !== 'undefined') lenis.scrollTo('#portfolio', { offset: -20 });
}

document.addEventListener('DOMContentLoaded', () => {
    initPortfolio();
});
