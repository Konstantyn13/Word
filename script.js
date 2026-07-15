let savedRange = null;

// Функція для запам'ятовування виділення тексту
function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }
}

// Повертаємо виділення назад перед виконанням команд форматування
function restoreSelection() {
    if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }
}

// Слухаємо мишку і клавіатуру на сторінках для збереження виділення
document.getElementById('pages-container').addEventListener('mouseup', saveSelection);
document.getElementById('pages-container').addEventListener('keyup', saveSelection);

// Форматування тексту (Жирний, Курсив тощо)
function format(command, value = null) {
    restoreSelection(); 
    document.execCommand(command, false, value);
    
    const selection = window.getSelection();
    if (selection.anchorNode) {
        const activePage = selection.anchorNode.parentElement.closest('.page');
        if (activePage) activePage.focus();
    }
    saveToLocalStorage();
}

// Збереження HTML файлу на комп'ютер
function saveDoc() {
    const title = document.querySelector(".doc-title").innerText;
    const content = document.getElementById('pages-container').innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
}

function applyFont(fontName) {
    restoreSelection(); // Повертаємо фокус на виділений текст
    const selection = window.getSelection();

    if (selection.rangeCount > 0 && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        
        // Створюємо span із потрібним сімейством шрифтів
        const span = document.createElement("span");
        span.style.fontFamily = fontName;

        // Підвантажуємо Google Font, якщо це не стандартний Arial
        if (fontName !== "Arial") {
            const fontId = `font-${fontName.replace(/\s+/g, '-')}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement("link");
                link.id = fontId;
                link.rel = "stylesheet";
                link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
                document.head.appendChild(link);
            }
        }

        // Огортаємо виділений текст у наш span
        span.appendChild(range.extractContents());
        range.insertNode(span);
    } else {
        // Якщо текст не виділено, просто застосовуємо шрифт до всієї сторінки, де стоїть курсор
        const activePage = selection.anchorNode ? selection.anchorNode.parentElement.closest('.page') : null;
        if (activePage) {
            activePage.style.fontFamily = fontName;
        }
    }
    saveToLocalStorage();
}

// Виконання додаткових команд (наприклад, кольору тексту)
function exec(command, value = null) {
    restoreSelection();
    document.execCommand(command, false, value);
    saveToLocalStorage();
}

// Розумне збереження в LocalStorage з очищенням порожніх сторінок
function saveToLocalStorage() {
    const pagesContent = [];
    const pages = document.querySelectorAll('.page');
    
    pages.forEach((p, index) => {
        // Якщо це не перша сторінка і вона абсолютно порожня (або містить лише пусті теги) — видаляємо її
        const textContent = p.textContent.trim();
        const hasImages = p.querySelector('img') !== null;
        
        if (index > 0 && textContent === "" && !hasImages) {
            p.remove();
        } else {
            pagesContent.push(p.innerHTML);
        }
    });
    
    const title = document.querySelector('.doc-title').innerText;
    document.title = title + " - Kostiuk Word"; 

    localStorage.setItem('myDocPages', JSON.stringify(pagesContent));
    localStorage.setItem('myDocTitle', title);
    
    console.log("Autosave Completed. Pages count: " + document.querySelectorAll('.page').length);
}

// Функція створення нової сторінки (тепер без різкого стрибка)
function createNewPage() {
    const container = document.getElementById('pages-container');
    const pages = document.querySelectorAll('.page');
    const newPageNum = pages.length + 1;
    
    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.contentEditable = 'true';
    newPage.id = `page-${newPageNum}`;
    
    container.appendChild(newPage);
    
    // Переносимо курсор на нову сторінку
    newPage.focus();
    
    // Плавно підтягуємо екран до нової сторінки, щоб користувач бачив, де пише
    newPage.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Оновлений слухач подій, який НЕ рухає екран при звичайному введенні
document.getElementById('pages-container').addEventListener('input', (e) => {
    const currentPage = e.target.closest('.page');
    
    if (currentPage) {
        // Перевіряємо, чи текст вийшов за межі поточної сторінки
        if (currentPage.scrollHeight > currentPage.offsetHeight) {
            // Перевіряємо, чи немає вже наступної сторінки
            const nextPage = currentPage.nextElementSibling;
            if (!nextPage || !nextPage.classList.contains('page')) {
                createNewPage();
            }
        }
    }
    
    // Викликаємо збереження, але тепер воно не буде чіпати фокус і скрол
    saveToLocalStorage();
});

// Обробка зображень (Base64)
function handleImage(file, targetPage) {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.cursor = "pointer";

        img.onclick = () => {
            if(confirm("Видалити це зображення?")) {
                img.remove();
                saveToLocalStorage();
            }
        };
        targetPage.appendChild(img);
        saveToLocalStorage();
    };
    reader.readAsDataURL(file);
}

// Drag & Drop події
const pagesContainer = document.getElementById("pages-container");
pagesContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'copy';
});

pagesContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetPage = e.target.closest('.page');
    if (!targetPage) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImage(files[0], targetPage);
    }
});

function changeFontSize(size) {
    restoreSelection(); // Повертаємо фокус
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        if (selection.toString().length > 0) {
            // Створюємо span із чітким розміром у пікселях (наприклад, "16px")
            const span = document.createElement("span");
            span.style.fontSize = size; 
            
            // Вирізаємо виділений вміст і вставляємо всередину span
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {
            // Якщо нічого не виділено, міняємо розмір за замовчуванням для всієї поточної сторінки
            const activePage = selection.anchorNode ? selection.anchorNode.parentElement.closest('.page') : null;
            if (activePage) {
                activePage.style.fontSize = size;
            }
        }
        saveToLocalStorage();
    }
}

// Завантаження програми при старті (контроль однієї сторінки)
window.onload = function() {
    const savedPages = JSON.parse(localStorage.getItem('myDocPages'));
    const savedTitle = localStorage.getItem('myDocTitle');
    const container = document.getElementById('pages-container');

    container.innerHTML = '';

    // Перевіряємо, чи є збережені дані і чи вони не порожні
    if (savedPages && savedPages.length > 0) {
        savedPages.forEach((content, index) => {
            const p = document.createElement('div');
            p.className = 'page';
            p.contentEditable = 'true';
            p.id = `page-${index + 1}`;
            p.innerHTML = content;
            container.appendChild(p);
        });
    } else {
        // Якщо збережень взагалі немає — створюється СУВОРО ОДНА сторінка
        const firstPage = document.createElement('div');
        firstPage.className = 'page';
        firstPage.contentEditable = 'true';
        firstPage.id = 'page-1';
        container.appendChild(firstPage);
    }
    
    if (savedTitle) {
        document.querySelector('.doc-title').innerText = savedTitle;
        document.title = savedTitle + " - Kostiuk Word";
    } else {
        document.title = "Документ без назви - Kostiuk Word";
    }
};