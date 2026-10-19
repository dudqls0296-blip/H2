/**
 * 인덕대학교 언론부 2026 연말 매거진 - 기사 제작 및 관리 폼 엔진
 * Induk University Press - Magazine Creator & Article Form Engine
 */

class MagazineEditor {
    constructor() {
        this.articles = [];
        this.currentEditingId = null;
        this.presetImages = [
            { label: "캠퍼스 도서관", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80" },
            { label: "카메라 & 미디어", url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80" },
            { label: "강의실 & 토론", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80" },
            { label: "겨울 카페 & 감성", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80" },
            { label: "캠퍼스 설경", url: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?auto=format&fit=crop&w=1000&q=80" },
            { label: "청춘 & 팀 프로젝트", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80" },
            { label: "만년필 & 취재수첩", url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80" },
            { label: "동아리 공연 & 축제", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80" }
        ];

        this.init();
    }

    init() {
        this.loadArticles();
        this.bindEvents();
        this.renderPresetSelector();
    }

    // 로컬 스토리지 또는 기본 데이터 로드
    loadArticles() {
        const stored = localStorage.getItem("induk_press_articles");
        if (stored) {
            try {
                this.articles = JSON.parse(stored);
            } catch (e) {
                console.error("저장된 기사 데이터를 파싱하는 중 오류 발생:", e);
                this.articles = [...DEFAULT_ARTICLES];
            }
        } else {
            this.articles = [...DEFAULT_ARTICLES];
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem("induk_press_articles", JSON.stringify(this.articles));
    }

    bindEvents() {
        // 모달 열기/닫기
        const openBtn = document.getElementById("open-editor-btn");
        const fabBtn = document.getElementById("fab-editor-btn");
        const closeBtn = document.getElementById("close-editor-btn");
        const modal = document.getElementById("editor-modal");

        if (openBtn) openBtn.addEventListener("click", () => this.openEditor());
        if (fabBtn) fabBtn.addEventListener("click", () => this.openEditor());
        if (closeBtn) closeBtn.addEventListener("click", () => this.closeEditor());

        // 탭 전환 (폼 작성 vs 실시간 미리보기 vs 전체 기사 관리)
        const tabForm = document.getElementById("tab-form-btn");
        const tabPreview = document.getElementById("tab-preview-btn");
        const tabList = document.getElementById("tab-list-btn");

        if (tabForm) tabForm.addEventListener("click", () => this.switchTab("form"));
        if (tabPreview) tabPreview.addEventListener("click", () => {
            this.updateLivePreview();
            this.switchTab("preview");
        });
        if (tabList) tabList.addEventListener("click", () => {
            this.renderArticlesManagementList();
            this.switchTab("list");
        });

        // 폼 제출 (기사 저장)
        const articleForm = document.getElementById("article-form");
        if (articleForm) {
            articleForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSaveArticle();
            });
        }

        // 새 기사 작성 폼 초기화 버튼
        const resetFormBtn = document.getElementById("reset-form-btn");
        if (resetFormBtn) {
            resetFormBtn.addEventListener("click", () => this.resetForm());
        }

        // 이미지 파일 직접 첨부 (Base64 변환)
        const fileInput = document.getElementById("form-image-file");
        if (fileInput) {
            fileInput.addEventListener("change", (e) => this.handleImageFileUpload(e));
        }

        // 이미지 URL 직접 입력 시 미리보기 변경
        const urlInput = document.getElementById("form-image-url");
        if (urlInput) {
            urlInput.addEventListener("input", (e) => this.updateImagePreview(e.target.value));
        }

        // 서식 툴바 도구 버튼 바인딩
        this.bindToolbarButtons();

        // JSON 내보내기 & 가져오기
        const exportBtn = document.getElementById("export-json-btn");
        if (exportBtn) exportBtn.addEventListener("click", () => this.exportArticlesJSON());

        const importInput = document.getElementById("import-json-input");
        if (importInput) importInput.addEventListener("change", (e) => this.importArticlesJSON(e));

        const resetDefaultBtn = document.getElementById("reset-default-btn");
        if (resetDefaultBtn) resetDefaultBtn.addEventListener("click", () => this.resetToDefault());
    }

    // 프리셋 추천 이미지 렌더링
    renderPresetSelector() {
        const container = document.getElementById("preset-images-container");
        if (!container) return;

        container.innerHTML = this.presetImages.map(img => `
            <button type="button" class="preset-img-btn group relative rounded overflow-hidden border border-gray-200 hover:border-blue-700 transition" data-url="${img.url}">
                <img src="${img.url}" alt="${img.label}" class="w-full h-12 object-cover group-hover:scale-105 transition duration-300">
                <span class="absolute inset-0 bg-black/40 text-white text-[10px] flex items-center justify-center font-medium p-1 text-center">
                    ${img.label}
                </span>
            </button>
        `).join("");

        container.querySelectorAll(".preset-img-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const url = btn.getAttribute("data-url");
                const urlInput = document.getElementById("form-image-url");
                if (urlInput) {
                    urlInput.value = url;
                    this.updateImagePreview(url);
                }
            });
        });
    }

    // 로컬 파일 업로드 Base64 변환
    handleImageFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            alert("이미지 용량이 너무 큽니다. (최대 4MB 권장)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            const urlInput = document.getElementById("form-image-url");
            if (urlInput) urlInput.value = base64Data;
            this.updateImagePreview(base64Data);
        };
        reader.readAsDataURL(file);
    }

    updateImagePreview(url) {
        const previewImg = document.getElementById("image-preview-thumb");
        const placeholder = document.getElementById("image-preview-placeholder");
        if (!previewImg || !placeholder) return;

        if (url && url.trim().length > 0) {
            previewImg.src = url;
            previewImg.classList.remove("hidden");
            placeholder.classList.add("hidden");
        } else {
            previewImg.classList.add("hidden");
            placeholder.classList.remove("hidden");
        }
    }

    // 서식 툴바 버튼
    bindToolbarButtons() {
        const textarea = document.getElementById("form-content");
        if (!textarea) return;

        const insertAtCursor = (textToInsert) => {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            textarea.value = text.substring(0, start) + textToInsert + text.substring(end);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        };

        const tools = [
            { id: "tool-h3", snippet: '\n<h3 class="article-subheading">소제목을 입력하세요</h3>\n' },
            { id: "tool-p", snippet: '\n<p>본문 단락 내용을 작성하세요.</p>\n' },
            { id: "tool-quote", snippet: '\n<blockquote class="magazine-quote">\n    "학우들의 목소리를 담은 핵심 명언 또는 인용구를 입력하세요."\n    <cite>— 인터뷰이 또는 출처</cite>\n</blockquote>\n' },
            { id: "tool-img", snippet: '\n<div class="article-inline-image">\n    <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80" alt="사진 설명">\n    <span class="caption">▲ 사진에 대한 캡션 설명을 입력하세요.</span>\n</div>\n' },
            { id: "tool-hr", snippet: '\n<hr class="my-8 border-t border-gray-200">\n' }
        ];

        tools.forEach(t => {
            const btn = document.getElementById(t.id);
            if (btn) {
                btn.addEventListener("click", () => insertAtCursor(t.snippet));
            }
        });
    }

    // 모달 제어
    openEditor(articleId = null) {
        const modal = document.getElementById("editor-modal");
        if (!modal) return;

        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        if (articleId) {
            this.loadArticleIntoForm(articleId);
        } else {
            this.resetForm();
        }
        this.switchTab("form");
    }

    closeEditor() {
        const modal = document.getElementById("editor-modal");
        if (!modal) return;
        modal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    switchTab(tabName) {
        const formView = document.getElementById("view-form");
        const previewView = document.getElementById("view-preview");
        const listView = document.getElementById("view-list");

        const tabForm = document.getElementById("tab-form-btn");
        const tabPreview = document.getElementById("tab-preview-btn");
        const tabList = document.getElementById("tab-list-btn");

        [formView, previewView, listView].forEach(v => v && v.classList.add("hidden"));
        [tabForm, tabPreview, tabList].forEach(b => {
            if (b) {
                b.classList.remove("text-blue-900", "border-b-2", "border-blue-900", "font-bold");
                b.classList.add("text-gray-500");
            }
        });

        if (tabName === "form") {
            formView.classList.remove("hidden");
            tabForm.classList.add("text-blue-900", "border-b-2", "border-blue-900", "font-bold");
            tabForm.classList.remove("text-gray-500");
        } else if (tabName === "preview") {
            previewView.classList.remove("hidden");
            tabPreview.classList.add("text-blue-900", "border-b-2", "border-blue-900", "font-bold");
            tabPreview.classList.remove("text-gray-500");
        } else if (tabName === "list") {
            listView.classList.remove("hidden");
            tabList.classList.add("text-blue-900", "border-b-2", "border-blue-900", "font-bold");
            tabList.classList.remove("text-gray-500");
        }
    }

    // 폼 초기화
    resetForm() {
        this.currentEditingId = null;
        document.getElementById("form-editing-id").value = "";
        document.getElementById("form-title").value = "";
        document.getElementById("form-subtitle").value = "";
        document.getElementById("form-category").value = "캠퍼스 보도";
        document.getElementById("form-reporter").value = "언론부 취재기자";
        document.getElementById("form-readtime").value = "4분";
        
        // 오늘 날짜 기본 입력
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
        document.getElementById("form-date").value = dateStr;
        
        document.getElementById("form-image-url").value = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80";
        this.updateImagePreview("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80");
        document.getElementById("form-image-file").value = "";
        document.getElementById("form-summary").value = "";
        document.getElementById("form-tags").value = "인덕대학교, 언론부, 2026연말";
        document.getElementById("form-is-cover").checked = false;

        document.getElementById("form-content").value = `<p class="lead-paragraph">여기에 기사의 도입부(리드 문단)를 작성하세요. 잡지 스타일로 첫 글자가 강조되어 우아하게 시작됩니다.</p>

<h3 class="article-subheading">취재 배경과 주요 핵심 내용</h3>
<p>기사의 구체적인 본문 내용을 작성해 주세요. 인덕대학교 학우들의 이야기와 생생한 캠퍼스 현장을 기술합니다.</p>

<blockquote class="magazine-quote">
    "인덕대학교 언론부는 학우들의 목소리를 가장 가까이서 듣고 진실하게 전달합니다."
    <cite>— 취재 인터뷰 중</cite>
</blockquote>

<p>마무리 문단을 작성하세요. 연말을 맞아 학우들에게 전하는 따스한 격려와 메시지로 맺을 수 있습니다.</p>`;

        document.getElementById("form-status-badge").innerText = "신규 기사 작성 모드";
        document.getElementById("form-status-badge").className = "text-xs px-2.5 py-1 rounded bg-green-100 text-green-800 font-semibold";
        document.getElementById("save-btn-text").innerText = "잡지에 기사 발행하기";
    }

    // 기존 기사 폼으로 불러오기
    loadArticleIntoForm(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) return;

        this.currentEditingId = id;
        document.getElementById("form-editing-id").value = article.id;
        document.getElementById("form-title").value = article.title || "";
        document.getElementById("form-subtitle").value = article.subtitle || "";
        document.getElementById("form-category").value = article.category || "캠퍼스 보도";
        document.getElementById("form-reporter").value = article.reporter || "";
        document.getElementById("form-date").value = article.date || "";
        document.getElementById("form-readtime").value = article.readTime || "4분";
        document.getElementById("form-image-url").value = article.coverImage || "";
        this.updateImagePreview(article.coverImage || "");
        document.getElementById("form-summary").value = article.summary || "";
        document.getElementById("form-tags").value = (article.tags || []).join(", ");
        document.getElementById("form-is-cover").checked = !!article.isCover;
        document.getElementById("form-content").value = article.content || "";

        document.getElementById("form-status-badge").innerText = `기사 수정 중 (#${article.id})`;
        document.getElementById("form-status-badge").className = "text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold";
        document.getElementById("save-btn-text").innerText = "수정 내용 저장하기";
    }

    // 기사 저장 처리 (신규 생성 or 기존 수정)
    handleSaveArticle() {
        const title = document.getElementById("form-title").value.trim();
        const subtitle = document.getElementById("form-subtitle").value.trim();
        const category = document.getElementById("form-category").value;
        const reporter = document.getElementById("form-reporter").value.trim();
        const date = document.getElementById("form-date").value.trim();
        const readTime = document.getElementById("form-readtime").value.trim() || "3분";
        const coverImage = document.getElementById("form-image-url").value.trim() || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80";
        const summary = document.getElementById("form-summary").value.trim();
        const tagsRaw = document.getElementById("form-tags").value.trim();
        const isCover = document.getElementById("form-is-cover").checked;
        const content = document.getElementById("form-content").value.trim();

        if (!title) {
            alert("기사 제목을 입력해 주세요!");
            return;
        }

        const tags = tagsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0);

        // 카테고리 영문 매핑
        const categoryEnMap = {
            "커버 스토리": "COVER STORY",
            "캠퍼스 보도": "CAMPUS REPORT",
            "인덕 피플": "PEOPLE & INTERVIEW",
            "문화 & 라이프": "CULTURE & LIFE",
            "포토 에세이": "PHOTO ESSAY",
            "기획 르포": "SPECIAL REPORT",
            "언론부 후기": "EDITORIAL NOTE",
            "자유 투고": "OPINION"
        };

        // 만약 커버 스토리로 지정했으면 다른 기사들의 isCover는 해제
        if (isCover) {
            this.articles.forEach(a => a.isCover = false);
        }

        if (this.currentEditingId) {
            // 수정
            const index = this.articles.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                this.articles[index] = {
                    ...this.articles[index],
                    title,
                    subtitle,
                    category,
                    categoryEn: categoryEnMap[category] || "ARTICLE",
                    reporter,
                    date,
                    readTime,
                    coverImage,
                    summary: summary || title,
                    tags,
                    isCover,
                    content
                };
            }
        } else {
            // 신규 등록
            const newArticle = {
                id: `art-${Date.now()}`,
                isCover,
                category,
                categoryEn: categoryEnMap[category] || "ARTICLE",
                title,
                subtitle,
                reporter,
                date,
                readTime,
                tags,
                coverImage,
                summary: summary || title,
                content
            };
            this.articles.unshift(newArticle);
        }

        this.saveToStorage();
        
        // 메인 웹진 새로고침 렌더링 호출
        if (window.magazineApp) {
            window.magazineApp.refreshMagazine();
        }

        alert(this.currentEditingId ? "기사가 성공적으로 수정되었습니다!" : "새로운 기사가 연말 잡지에 발행되었습니다!");
        
        // 관리 탭으로 이동하여 결과 확인
        this.renderArticlesManagementList();
        this.switchTab("list");
    }

    // 실시간 미리보기 렌더링
    updateLivePreview() {
        const previewContainer = document.getElementById("live-preview-content");
        if (!previewContainer) return;

        const title = document.getElementById("form-title").value || "기사 제목이 이곳에 표시됩니다";
        const subtitle = document.getElementById("form-subtitle").value || "부제목과 기사 요약문이 표시됩니다.";
        const category = document.getElementById("form-category").value;
        const reporter = document.getElementById("form-reporter").value || "언론부 기자";
        const date = document.getElementById("form-date").value || "2026.12.30";
        const readTime = document.getElementById("form-readtime").value || "4분";
        const coverImage = document.getElementById("form-image-url").value || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80";
        const content = document.getElementById("form-content").value || "<p>기사 본문을 작성하면 실시간으로 잡지 스타일이 적용됩니다.</p>";
        const tags = document.getElementById("form-tags").value.split(",").map(t => t.trim()).filter(Boolean);

        previewContainer.innerHTML = `
            <div class="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-stone-200">
                <div class="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
                    <span class="category-pill bg-blue-900 text-white font-bold">${category}</span>
                    <div class="text-xs text-stone-500 font-sans space-x-2">
                        <span>📅 ${date}</span>
                        <span>•</span>
                        <span>⏱️ 소요시간 ${readTime}</span>
                    </div>
                </div>

                <h1 class="text-2xl sm:text-3xl font-serif-kr font-bold text-slate-900 leading-snug mb-3">
                    ${title}
                </h1>
                
                ${subtitle ? `<p class="text-stone-600 font-serif-kr text-base mb-6 pb-4 border-b border-stone-100">${subtitle}</p>` : ''}

                <div class="flex items-center gap-3 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <div class="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                        ${reporter.charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-stone-800">${reporter}</div>
                        <div class="text-xs text-stone-500">인덕대학교 언론부 취재보도국</div>
                    </div>
                </div>

                <div class="mb-8 rounded-lg overflow-hidden border border-stone-200 shadow-inner">
                    <img src="${coverImage}" alt="기사 대표 이미지" class="w-full max-h-[380px] object-cover">
                </div>

                <div class="article-reader-content">
                    ${content}
                </div>

                <div class="mt-8 pt-6 border-t border-stone-200 flex flex-wrap gap-2">
                    ${tags.map(tag => `<span class="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-sans">#${tag}</span>`).join("")}
                </div>
            </div>
        `;
    }

    // 작성된 기사 전체 관리 목록 렌더링
    renderArticlesManagementList() {
        const listContainer = document.getElementById("articles-management-list");
        if (!listContainer) return;

        listContainer.innerHTML = this.articles.map(article => `
            <div class="bg-white border border-stone-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <img src="${article.coverImage}" class="w-20 h-16 object-cover rounded border border-stone-200 flex-shrink-0" alt="">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs px-2 py-0.5 rounded font-bold ${article.isCover ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-stone-100 text-stone-700'}">
                                ${article.isCover ? '⭐ 커버 기사' : article.category}
                            </span>
                            <span class="text-xs text-stone-400 font-sans">${article.date}</span>
                        </div>
                        <h4 class="font-serif-kr font-bold text-stone-900 truncate text-base">${article.title}</h4>
                        <p class="text-xs text-stone-500 truncate">${article.reporter} • ${article.subtitle || '부제목 없음'}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                    <button type="button" class="btn-edit-article px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-md border border-blue-200 transition" data-id="${article.id}">
                        ✏️ 편집
                    </button>
                    <button type="button" class="btn-toggle-cover px-3 py-1.5 text-xs font-semibold ${article.isCover ? 'bg-amber-100 text-amber-800' : 'bg-stone-50 text-stone-600'} hover:bg-amber-50 rounded-md border border-stone-200 transition" data-id="${article.id}">
                        ${article.isCover ? '★ 커버 해제' : '☆ 커버 지정'}
                    </button>
                    <button type="button" class="btn-delete-article px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition" data-id="${article.id}">
                        🗑️ 삭제
                    </button>
                </div>
            </div>
        `).join("");

        // 이벤트 연결
        listContainer.querySelectorAll(".btn-edit-article").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                this.loadArticleIntoForm(id);
                this.switchTab("form");
            });
        });

        listContainer.querySelectorAll(".btn-toggle-cover").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const target = this.articles.find(a => a.id === id);
                if (target) {
                    const willBeCover = !target.isCover;
                    if (willBeCover) {
                        this.articles.forEach(a => a.isCover = false);
                        target.isCover = true;
                    } else {
                        target.isCover = false;
                    }
                    this.saveToStorage();
                    this.renderArticlesManagementList();
                    if (window.magazineApp) window.magazineApp.refreshMagazine();
                }
            });
        });

        listContainer.querySelectorAll(".btn-delete-article").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                if (confirm("정말로 이 기사를 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)")) {
                    this.articles = this.articles.filter(a => a.id !== id);
                    this.saveToStorage();
                    this.renderArticlesManagementList();
                    if (window.magazineApp) window.magazineApp.refreshMagazine();
                }
            });
        });
    }

    // JSON 파일로 전체 기사 내보내기 (백업)
    exportArticlesJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.articles, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `induk_press_articles_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    // JSON 파일 불러오기
    importArticlesJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    if (confirm(`가져온 파일에서 총 ${imported.length}개의 기사를 발견했습니다. 현재 잡지 목록에 덮어쓸까요?`)) {
                        this.articles = imported;
                        this.saveToStorage();
                        this.renderArticlesManagementList();
                        if (window.magazineApp) window.magazineApp.refreshMagazine();
                        alert("기사 데이터를 성공적으로 불러왔습니다!");
                    }
                } else {
                    alert("올바른 기사 데이터 형식이 아닙니다.");
                }
            } catch (err) {
                alert("JSON 파일을 파싱하는 데 실패했습니다.");
            }
        };
        reader.readAsText(file);
    }

    // 기본 샘플 기사로 초기화
    resetToDefault() {
        if (confirm("모든 기사를 초기 샘플 데이터로 복원하시겠습니까? (직접 작성한 기사는 사라집니다)")) {
            this.articles = [...DEFAULT_ARTICLES];
            this.saveToStorage();
            this.renderArticlesManagementList();
            if (window.magazineApp) window.magazineApp.refreshMagazine();
            alert("초기 샘플 데이터로 복원되었습니다.");
        }
    }
}
