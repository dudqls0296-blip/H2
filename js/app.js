/**
 * 인덕대학교 언론부 2026 연말 매거진 - 메인 인터랙션 및 리더 앱
 * Induk University Press - Main Webzine Application & Reader
 */

class MagazineApp {
    constructor() {
        this.currentFilter = "all";
        this.searchQuery = "";
        this.wishes = [];
        this.snowEnabled = true;
        this.currentArticleId = null;

        this.init();
    }

    init() {
        this.loadWishes();
        this.initSnowCanvas();
        this.bindEvents();
        this.refreshMagazine();
        this.renderWishBoard();
    }

    // 소원 롤링페이퍼 데이터 로드
    loadWishes() {
        const stored = localStorage.getItem("induk_press_wishes");
        if (stored) {
            try {
                this.wishes = JSON.parse(stored);
            } catch (e) {
                this.wishes = [...DEFAULT_WISHES];
            }
        } else {
            this.wishes = [...DEFAULT_WISHES];
            localStorage.setItem("induk_press_wishes", JSON.stringify(this.wishes));
        }
    }

    saveWishes() {
        localStorage.setItem("induk_press_wishes", JSON.stringify(this.wishes));
    }

    bindEvents() {
        // 카테고리 필터 클릭
        const filterBtns = document.querySelectorAll(".filter-btn");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                filterBtns.forEach(b => {
                    b.classList.remove("bg-blue-900", "text-white", "shadow");
                    b.classList.add("bg-white", "text-stone-700", "border-stone-200");
                });
                btn.classList.remove("bg-white", "text-stone-700", "border-stone-200");
                btn.classList.add("bg-blue-900", "text-white", "shadow");

                this.currentFilter = btn.getAttribute("data-category");
                this.renderArticles();
            });
        });

        // 실시간 검색
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderArticles();
            });
        }

        // 눈 내리기 토글 버튼
        const snowToggleBtn = document.getElementById("snow-toggle-btn");
        if (snowToggleBtn) {
            snowToggleBtn.addEventListener("click", () => {
                this.snowEnabled = !this.snowEnabled;
                const canvas = document.getElementById("snow-canvas");
                if (canvas) canvas.style.opacity = this.snowEnabled ? "1" : "0";
                snowToggleBtn.innerHTML = this.snowEnabled ? "❄️ 눈 내림: ON" : "❄️ 눈 내림: OFF";
                snowToggleBtn.classList.toggle("bg-blue-100", this.snowEnabled);
                snowToggleBtn.classList.toggle("text-blue-900", this.snowEnabled);
            });
        }

        // 리더 모달 닫기
        const closeReaderBtn = document.getElementById("close-reader-btn");
        const readerModal = document.getElementById("reader-modal");
        if (closeReaderBtn) closeReaderBtn.addEventListener("click", () => this.closeReader());
        if (readerModal) {
            readerModal.addEventListener("click", (e) => {
                if (e.target === readerModal) this.closeReader();
            });
        }

        // 리더 글자 크기 조절
        const fontBigger = document.getElementById("font-size-up");
        const fontSmaller = document.getElementById("font-size-down");
        const readerBody = document.getElementById("reader-body");
        let currentFontSize = 1.125; // rem

        if (fontBigger && readerBody) {
            fontBigger.addEventListener("click", () => {
                if (currentFontSize < 1.4) {
                    currentFontSize += 0.08;
                    readerBody.style.fontSize = `${currentFontSize}rem`;
                }
            });
        }
        if (fontSmaller && readerBody) {
            fontSmaller.addEventListener("click", () => {
                if (currentFontSize > 0.95) {
                    currentFontSize -= 0.08;
                    readerBody.style.fontSize = `${currentFontSize}rem`;
                }
            });
        }

        // 기사 인쇄 버튼
        const printBtn = document.getElementById("reader-print-btn");
        if (printBtn) {
            printBtn.addEventListener("click", () => window.print());
        }

        // 기사 링크 복사
        const shareBtn = document.getElementById("reader-share-btn");
        if (shareBtn) {
            shareBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(window.location.href);
                alert("기사 웹 주소가 클립보드에 복사되었습니다!");
            });
        }

        // 롤링페이퍼 등록 폼
        const wishForm = document.getElementById("wish-form");
        if (wishForm) {
            wishForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleAddWish();
            });
        }

        // 롤링페이퍼 수정 모달 닫기
        const closeWishEditBtn = document.getElementById("close-wish-edit-btn");
        const cancelWishEditBtn = document.getElementById("cancel-wish-edit-btn");
        const wishEditModal = document.getElementById("wish-edit-modal");
        if (closeWishEditBtn) closeWishEditBtn.addEventListener("click", () => this.closeEditWishModal());
        if (cancelWishEditBtn) cancelWishEditBtn.addEventListener("click", () => this.closeEditWishModal());
        if (wishEditModal) {
            wishEditModal.addEventListener("click", (e) => {
                if (e.target === wishEditModal) this.closeEditWishModal();
            });
        }

        // 롤링페이퍼 수정 폼 제출
        const wishEditForm = document.getElementById("wish-edit-form");
        if (wishEditForm) {
            wishEditForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleUpdateWish();
            });
        }
    }

    refreshMagazine() {
        const articles = window.magazineEditor ? window.magazineEditor.articles : DEFAULT_ARTICLES;
        this.renderHeroCover(articles);
        this.renderArticles();
    }

    // 커버 스토리 (Hero 섹션) 렌더링
    renderHeroCover(articles) {
        const heroContainer = document.getElementById("hero-cover-content");
        if (!heroContainer) return;

        // 커버로 지정된 기사 찾기 (없으면 첫 번째 기사)
        const coverArticle = articles.find(a => a.isCover) || articles[0];
        if (!coverArticle) return;

        heroContainer.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <!-- 좌측 기사 헤드라인 및 요약 -->
                <div class="lg:col-span-7 space-y-6 text-white z-10">
                    <div class="inline-flex items-center gap-2">
                        <span class="gold-badge text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            ★ 2026 COVER STORY
                        </span>
                        <span class="text-xs text-blue-200 uppercase tracking-widest font-mono">
                            ${coverArticle.categoryEn || 'SPECIAL REPORT'}
                        </span>
                    </div>

                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-serif-kr font-bold leading-tight text-white drop-shadow">
                        ${coverArticle.title}
                    </h1>

                    <p class="text-stone-300 font-serif-kr text-base sm:text-lg leading-relaxed line-clamp-3">
                        ${coverArticle.subtitle || coverArticle.summary}
                    </p>

                    <div class="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-2 border-t border-white/10">
                        <span class="flex items-center gap-1.5 font-medium">
                            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                            ${coverArticle.reporter}
                        </span>
                        <span>•</span>
                        <span>📅 ${coverArticle.date}</span>
                        <span>•</span>
                        <span>⏱️ 읽는 시간 약 ${coverArticle.readTime || '5분'}</span>
                    </div>

                    <div class="pt-4 flex flex-wrap items-center gap-3">
                        <button type="button" class="btn-read-cover bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2" data-id="${coverArticle.id}">
                            <span>커버 스토리 전문 읽기</span>
                            <span>→</span>
                        </button>
                        <a href="#article-grid-section" class="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition">
                            전체 기사 목차 보기
                        </a>
                    </div>
                </div>

                <!-- 우측 매거진 커버 비주얼 프레임 -->
                <div class="lg:col-span-5 relative group">
                    <div class="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    <div class="relative bg-slate-900 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <img src="${coverArticle.coverImage}" alt="${coverArticle.title}" class="w-full h-[380px] sm:h-[420px] object-cover group-hover:scale-105 transition duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                            <span class="text-amber-400 text-xs tracking-widest uppercase font-mono mb-1">INDUK UNIVERSITY PRESS</span>
                            <span class="text-white text-sm font-serif-kr line-clamp-2">${coverArticle.title}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const readCoverBtn = heroContainer.querySelector(".btn-read-cover");
        if (readCoverBtn) {
            readCoverBtn.addEventListener("click", () => {
                this.openReader(coverArticle.id);
            });
        }
    }

    // 기사 그리드 렌더링
    renderArticles() {
        const gridContainer = document.getElementById("articles-grid");
        const countSpan = document.getElementById("article-count");
        if (!gridContainer) return;

        let articles = window.magazineEditor ? window.magazineEditor.articles : DEFAULT_ARTICLES;

        // 카테고리 필터링
        if (this.currentFilter !== "all") {
            articles = articles.filter(a => a.category === this.currentFilter);
        }

        // 검색어 필터링
        if (this.searchQuery) {
            articles = articles.filter(a => 
                a.title.toLowerCase().includes(this.searchQuery) ||
                (a.subtitle && a.subtitle.toLowerCase().includes(this.searchQuery)) ||
                (a.reporter && a.reporter.toLowerCase().includes(this.searchQuery)) ||
                (a.tags && a.tags.some(t => t.toLowerCase().includes(this.searchQuery)))
            );
        }

        if (countSpan) countSpan.innerText = `${articles.length}편의 기사`;

        if (articles.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-span-full py-16 text-center bg-white rounded-xl border border-stone-200">
                    <p class="text-3xl mb-3">📰</p>
                    <h3 class="text-lg font-bold text-stone-800 font-serif-kr">해당하는 기사가 없습니다.</h3>
                    <p class="text-sm text-stone-500 mt-1">검색어를 변경하시거나 새 기사 작성 폼을 통해 기사를 등록해 보세요!</p>
                    <button type="button" onclick="window.magazineEditor.openEditor()" class="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition">
                        ✍️ 새 기사 작성하기
                    </button>
                </div>
            `;
            return;
        }

        gridContainer.innerHTML = articles.map(article => `
            <article class="article-card rounded-xl overflow-hidden flex flex-col cursor-pointer group" data-id="${article.id}">
                <div class="card-thumb-container relative h-52 bg-stone-100 overflow-hidden">
                    <img src="${article.coverImage}" alt="${article.title}" class="card-thumb w-full h-full object-cover">
                    <div class="absolute top-3 left-3 flex gap-1.5">
                        <span class="category-pill bg-blue-950/80 backdrop-blur-md text-white border border-white/10">
                            ${article.category}
                        </span>
                        ${article.isCover ? '<span class="category-pill bg-amber-500 text-stone-900 font-bold">커버</span>' : ''}
                    </div>
                    <span class="absolute bottom-3 right-3 text-[11px] bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded font-mono">
                        ⏱️ ${article.readTime || '4분'}
                    </span>
                </div>

                <div class="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="text-xs text-stone-400 font-sans mb-2 flex items-center gap-1.5">
                            <span>${article.date}</span>
                            <span>•</span>
                            <span class="text-stone-600 font-medium">${article.reporter}</span>
                        </div>
                        <h3 class="text-xl font-serif-kr font-bold text-stone-900 group-hover:text-blue-900 transition leading-snug line-clamp-2 mb-2">
                            ${article.title}
                        </h3>
                        <p class="text-xs text-stone-600 line-clamp-2 leading-relaxed font-serif-kr">
                            ${article.subtitle || article.summary || ''}
                        </p>
                    </div>

                    <div class="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                        <div class="flex flex-wrap gap-1">
                            ${(article.tags || []).slice(0, 2).map(tag => `<span class="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">#${tag}</span>`).join('')}
                        </div>
                        <span class="text-xs font-bold text-blue-900 flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                            기사 읽기 <span>→</span>
                        </span>
                    </div>
                </div>
            </article>
        `).join("");

        // 기사 카드 클릭 시 상세 읽기 모달
        gridContainer.querySelectorAll(".article-card").forEach(card => {
            card.addEventListener("click", () => {
                const id = card.getAttribute("data-id");
                this.openReader(id);
            });
        });
    }

    // 상세 기사 리더 모달 열기
    openReader(articleId) {
        const articles = window.magazineEditor ? window.magazineEditor.articles : DEFAULT_ARTICLES;
        const article = articles.find(a => a.id === articleId);
        if (!article) return;

        this.currentArticleId = articleId;

        document.getElementById("reader-category").innerText = article.category;
        document.getElementById("reader-date").innerText = `발행일: ${article.date}`;
        document.getElementById("reader-readtime").innerText = `소요시간: ${article.readTime || '4분'}`;
        document.getElementById("reader-title").innerText = article.title;
        document.getElementById("reader-subtitle").innerText = article.subtitle || "";
        document.getElementById("reader-reporter").innerText = article.reporter;
        document.getElementById("reader-reporter-avatar").innerText = article.reporter.charAt(0);
        document.getElementById("reader-cover-img").src = article.coverImage;

        // 본문
        document.getElementById("reader-body").innerHTML = article.content;

        // 태그
        const tagsContainer = document.getElementById("reader-tags");
        if (tagsContainer) {
            tagsContainer.innerHTML = (article.tags || []).map(t => `<span class="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">#${t}</span>`).join("");
        }

        const modal = document.getElementById("reader-modal");
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        // 모달 스크롤 맨 위로 이동
        const modalScroll = document.getElementById("reader-scroll-box");
        if (modalScroll) modalScroll.scrollTop = 0;
    }

    closeReader() {
        const modal = document.getElementById("reader-modal");
        if (modal) modal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    // 롤링페이퍼 렌더링
    renderWishBoard() {
        const container = document.getElementById("wish-cards-container");
        if (!container) return;

        // 스티커 메모 회전 각도 랜덤감
        const angles = [-2, 1, -1.5, 2, -1, 1.5, 0];

        container.innerHTML = this.wishes.map((w, index) => {
            const rot = angles[index % angles.length];
            return `
                <div class="wish-note wish-${w.color || 'yellow'} p-5 rounded-lg flex flex-col justify-between min-h-[185px] relative group" style="transform: rotate(${rot}deg);" data-id="${w.id}">
                    <!-- 상단 미니 툴바 (수정 / 삭제 버튼) -->
                    <div class="flex items-center justify-between gap-1 mb-2">
                        <span class="text-[10px] font-mono uppercase tracking-wider opacity-60 font-bold">2026 WISH</span>
                        <div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                            <button type="button" class="btn-edit-wish px-2 py-0.5 rounded text-[11px] bg-black/5 hover:bg-black/15 font-semibold text-stone-800 transition flex items-center gap-1" data-id="${w.id}" title="메모 수정">
                                <span>✏️</span> <span>수정</span>
                            </button>
                            <button type="button" class="btn-delete-wish px-1.5 py-0.5 rounded text-[11px] bg-black/5 hover:bg-red-500 hover:text-white font-semibold text-stone-700 transition" data-id="${w.id}" title="메모 삭제">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>

                    <p class="font-serif-kr text-sm leading-relaxed mb-4">"${w.text}"</p>

                    <div class="flex items-center justify-between text-xs pt-2 border-t border-black/10 font-sans">
                        <span class="font-bold truncate max-w-[120px]">${w.author}</span>
                        <span class="opacity-70 text-[11px]">${w.date}</span>
                    </div>
                </div>
            `;
        }).join("");

        // 수정 & 삭제 버튼 클릭 이벤트 바인딩
        container.querySelectorAll(".btn-edit-wish").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                this.openEditWishModal(id);
            });
        });

        container.querySelectorAll(".btn-delete-wish").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                this.handleDeleteWish(id);
            });
        });
    }

    // 롤링페이퍼 메모 수정 모달 열기
    openEditWishModal(id) {
        const wish = this.wishes.find(w => w.id === id);
        if (!wish) return;

        document.getElementById("edit-wish-id").value = wish.id;
        document.getElementById("edit-wish-author").value = wish.author || "";
        document.getElementById("edit-wish-text").value = wish.text || "";

        // 해당 색상 라디오 버튼 체크
        const colorRadio = document.querySelector(`input[name="edit-wish-color"][value="${wish.color || 'yellow'}"]`);
        if (colorRadio) colorRadio.checked = true;

        const modal = document.getElementById("wish-edit-modal");
        if (modal) {
            modal.classList.remove("hidden");
            document.body.style.overflow = "hidden";
        }
    }

    closeEditWishModal() {
        const modal = document.getElementById("wish-edit-modal");
        if (modal) modal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    // 롤링페이퍼 메모 수정 저장 처리
    handleUpdateWish() {
        const id = document.getElementById("edit-wish-id").value;
        const author = document.getElementById("edit-wish-author").value.trim() || "익명의 인덕인";
        const text = document.getElementById("edit-wish-text").value.trim();
        const colorInput = document.querySelector('input[name="edit-wish-color"]:checked') || { value: "yellow" };

        if (!text) {
            alert("응원 메시지 내용을 입력해 주세요!");
            return;
        }

        const wishIndex = this.wishes.findIndex(w => w.id === id);
        if (wishIndex !== -1) {
            this.wishes[wishIndex].author = author;
            this.wishes[wishIndex].text = text;
            this.wishes[wishIndex].color = colorInput.value;

            // 수정 표시
            const today = new Date();
            const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} (수정됨)`;
            this.wishes[wishIndex].date = dateStr;

            this.saveWishes();
            this.renderWishBoard();
            this.closeEditWishModal();
            alert("롤링페이퍼 메모가 성공적으로 수정되었습니다! ✨");
        }
    }

    // 롤링페이퍼 메모 삭제 처리
    handleDeleteWish(id) {
        if (confirm("이 롤링페이퍼 메모를 삭제하시겠습니까?")) {
            this.wishes = this.wishes.filter(w => w.id !== id);
            this.saveWishes();
            this.renderWishBoard();
            alert("메모가 삭제되었습니다.");
        }
    }

    // 소원 메모 추가
    handleAddWish() {
        const authorInput = document.getElementById("wish-author");
        const textInput = document.getElementById("wish-text");
        const colorInput = document.querySelector('input[name="wish-color"]:checked') || { value: "yellow" };

        const author = authorInput.value.trim() || "익명의 인덕인";
        const text = textInput.value.trim();

        if (!text) {
            alert("연말 한마디 내용을 작성해 주세요!");
            return;
        }

        const today = new Date();
        const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

        const newWish = {
            id: `w-${Date.now()}`,
            author,
            text,
            color: colorInput.value,
            date: dateStr
        };

        this.wishes.unshift(newWish);
        this.saveWishes();
        this.renderWishBoard();

        authorInput.value = "";
        textInput.value = "";
        alert("연말 응원 메시지가 소원 보드에 부착되었습니다! 🎄");
    }

    // 겨울 눈 내리는 효과 캔버스
    initSnowCanvas() {
        const canvas = document.getElementById("snow-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const flakes = [];
        const flakeCount = 55;

        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2.8 + 1,
                d: Math.random() * flakeCount,
                speed: Math.random() * 0.8 + 0.3,
                opacity: Math.random() * 0.6 + 0.3
            });
        }

        let angle = 0;
        const drawFlakes = () => {
            if (!this.snowEnabled) {
                ctx.clearRect(0, 0, width, height);
                requestAnimationFrame(drawFlakes);
                return;
            }

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            angle += 0.01;

            for (let i = 0; i < flakeCount; i++) {
                const f = flakes[i];
                f.y += f.speed;
                f.x += Math.sin(angle + f.d) * 0.5;

                if (f.y > height) {
                    flakes[i] = {
                        x: Math.random() * width,
                        y: 0,
                        r: f.r,
                        d: f.d,
                        speed: f.speed,
                        opacity: f.opacity
                    };
                }

                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
                ctx.fillStyle = `rgba(235, 245, 255, ${f.opacity})`;
                ctx.fill();
            }

            requestAnimationFrame(drawFlakes);
        };

        requestAnimationFrame(drawFlakes);
    }
}

// 글로벌 인스턴스 초기화
document.addEventListener("DOMContentLoaded", () => {
    window.magazineEditor = new MagazineEditor();
    window.magazineApp = new MagazineApp();
});
