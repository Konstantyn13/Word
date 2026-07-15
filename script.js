let savedRange = null;


function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }
}


function restoreSelection() {
    if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
    }
}


document.getElementById('pages-container').addEventListener('mouseup', saveSelection);
document.getElementById('pages-container').addEventListener('keyup', saveSelection);


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
    restoreSelection(); 
    const selection = window.getSelection();

    if (selection.rangeCount > 0 && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        
 
        const span = document.createElement("span");
        span.style.fontFamily = fontName;

      
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

 
        span.appendChild(range.extractContents());
        range.insertNode(span);
    } else {

        const activePage = selection.anchorNode ? selection.anchorNode.parentElement.closest('.page') : null;
        if (activePage) {
            activePage.style.fontFamily = fontName;
        }
    }
    saveToLocalStorage();
}

function exec(command, value = null) {
    restoreSelection();
    document.execCommand(command, false, value);
    saveToLocalStorage();
}


function saveToLocalStorage() {
    const pagesContent = [];
    const pages = document.querySelectorAll('.page');
    
    pages.forEach((p, index) => {
        
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


function createNewPage() {
    const container = document.getElementById('pages-container');
    const pages = document.querySelectorAll('.page');
    const newPageNum = pages.length + 1;
    
    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.contentEditable = 'true';
    newPage.id = `page-${newPageNum}`;
    
    container.appendChild(newPage);
    

    newPage.focus();
    

    newPage.scrollIntoView({ behavior: 'smooth', block: 'end' });
}


document.getElementById('pages-container').addEventListener('input', (e) => {
    const currentPage = e.target.closest('.page');
    
    if (currentPage) {
    
        if (currentPage.scrollHeight > currentPage.offsetHeight) {

            const nextPage = currentPage.nextElementSibling;
            if (!nextPage || !nextPage.classList.contains('page')) {
                createNewPage();
            }
        }
    }
    

    saveToLocalStorage();
});


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
    restoreSelection(); 
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        if (selection.toString().length > 0) {
         
            const span = document.createElement("span");
            span.style.fontSize = size; 
            
         
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } else {

            const activePage = selection.anchorNode ? selection.anchorNode.parentElement.closest('.page') : null;
            if (activePage) {
                activePage.style.fontSize = size;
            }
        }
        saveToLocalStorage();
    }
}


window.onload = function() {
    const savedPages = JSON.parse(localStorage.getItem('myDocPages'));
    const savedTitle = localStorage.getItem('myDocTitle');
    const container = document.getElementById('pages-container');

    container.innerHTML = '';


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
function updateToolbar() {
    const btnBold = document.getElementById('btn-bold');
    const btnItalic = document.getElementById('btn-italic');
    const btnUnderline = document.getElementById('btn-underline');

    
    if (btnBold) {
        if (document.queryCommandState("bold")) {
            btnBold.classList.add("active");
    }
    else {
        btnBold.classList.remove("active");
    }
}
if (btnItalic) {
    if (document.queryCommandState("italic")) {
        btnItalic.classList.add("active");
    } 
    else {
        btnItalic.classList.remove("active");
    }
}
if (btnUnderline) {
    if (document.queryCommandState("underline")) {
        btnUnderline.classList.add("active");
    } 
    else {
        btnUnderline.classList.remove("active");
    }
}
 }

 document.getElementById("pages-container").addEventListener("keyup", updateToolbar);
document.getElementById("pages-container").addEventListener("mouseup", updateToolbar);

document.querySelectorAll(".toolbar button").forEach(button => {
    button.addEventListener('click', () => {
        setTimeout(updateToolbar, 50);
    });
});