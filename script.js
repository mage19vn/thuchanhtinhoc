const consoleOutput = document.getElementById('consoleOutput');
const visualizerArea = document.getElementById('visualizerArea');
const runBtn = document.getElementById('runBtn');
const loader = document.getElementById('loader');
const langSelect = document.getElementById('langSelect');
const codeInput = document.getElementById('codeInput');
const stdInput = document.getElementById('stdInput');
const lineNumbers = document.getElementById('lineNumbers');
const activeLine = document.getElementById('activeLine');
const prevLine = document.getElementById('prevLine');
const codeHighlight = document.getElementById('codeHighlight');

const debugModal = document.getElementById('debugModal');
const modalOverlay = document.getElementById('modalOverlay');
const debugList = document.getElementById('debugList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let globalTraceData = [];
let globalOutput = "";
let currentStepIndex = 0;
let isDebugOpen = false;
let visibleVariables = new Set();
let currentErrorLine = -1;

let isVisualizerVisible = true;
let isActiveLineVisible = true;
let isPrevLineVisible = true;

function toggleVisualizer() {
    isVisualizerVisible = !isVisualizerVisible;
    const paneRight = document.querySelector('.pane-right');
    const workspace = document.querySelector('.workspace'); 
    const btnToggleVis = document.getElementById('btnToggleVis');
    const btnToggleActive = document.getElementById('btnToggleActive');
    const btnTogglePrev = document.getElementById('btnTogglePrev');

    if (isVisualizerVisible) {
        paneRight.style.display = 'flex'; 
        workspace.classList.remove('hide-vis'); 
        btnToggleVis.innerHTML = 'Ẩn Visualizer';

        if (isActiveLineVisible) {
            activeLine.classList.remove('hide-line');
            btnToggleActive.classList.remove('disabled');
        }
        if (isPrevLineVisible) {
            prevLine.classList.remove('hide-line');
            btnTogglePrev.classList.remove('disabled');
        }
    } else {
        paneRight.style.display = 'none'; 
        workspace.classList.add('hide-vis');
        btnToggleVis.innerHTML = 'Hiện Visualizer';

        activeLine.classList.add('hide-line');
        prevLine.classList.add('hide-line');
        btnToggleActive.classList.add('disabled');
        btnTogglePrev.classList.add('disabled');
    }
}

function toggleActiveLine() {
    if (!isVisualizerVisible) return; 

    isActiveLineVisible = !isActiveLineVisible;
    const btn = document.getElementById('btnToggleActive');
    if (isActiveLineVisible) {
        activeLine.classList.remove('hide-line');
        btn.classList.remove('disabled');
    } else {
        activeLine.classList.add('hide-line');
        btn.classList.add('disabled');
    }
}

function togglePrevLine() {
    if (!isVisualizerVisible) return; 

    isPrevLineVisible = !isPrevLineVisible;
    const btn = document.getElementById('btnTogglePrev');
    if (isPrevLineVisible) {
        prevLine.classList.remove('hide-line');
        btn.classList.remove('disabled');
    } else {
        prevLine.classList.add('hide-line');
        btn.classList.add('disabled');
    }
}

const ideKeywords = {
    python: ["print", "int", "input", "str", "float", "if", "else", "elif", "for", "while", "def", "return", "import", "from", "True", "False", "None", "len", "range", "list", "dict", "set", "class", "try", "except", "pass", "break", "continue"],
    cpp: ["#include", "using", "namespace", "std", "int", "float", "double", "char", "string", "bool", "if", "else", "for", "while", "do", "return", "cout", "cin", "endl", "main", "void", "class", "struct", "vector", "break", "continue"]
};

let isAutocompleting = false;
let currentSuggestionIndex = 0;

codeInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('searchBox').style.display = 'flex';
        document.getElementById('searchInput').focus();
        
        const selText = this.value.substring(this.selectionStart, this.selectionEnd);
        if (selText) {
            document.getElementById('searchInput').value = selText;
            doSearch();
        }
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        let start = this.selectionStart;
        let end = this.selectionEnd;
        let word = this.value.substring(start, end);
        
        if (!word) {
            const left = this.value.substring(0, start).match(/[a-zA-Z0-9_]+$/);
            const right = this.value.substring(start).match(/^[a-zA-Z0-9_]+/);
            word = (left ? left[0] : '') + (right ? right[0] : '');
        }
        
        if (word) {
            let newWord = prompt(`[Sửa đồng loạt]\nNhập từ thay thế cho "${word}":`, word);
            if (newWord !== null && newWord !== word) {
                const regex = new RegExp(`\\b${word}\\b`, 'g'); 
                this.value = this.value.replace(regex, newWord);
                updateEditor();
            }
        }
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        showAutocomplete(true);
        return;
    }

    if (isAutocompleting) {
        const list = document.getElementById('autocompleteList');
        const items = list.querySelectorAll('li');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[currentSuggestionIndex]?.classList.remove('active');
            currentSuggestionIndex = (currentSuggestionIndex + 1) % items.length;
            items[currentSuggestionIndex]?.classList.add('active');
            items[currentSuggestionIndex]?.scrollIntoView({block: 'nearest'});
            return;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[currentSuggestionIndex]?.classList.remove('active');
            currentSuggestionIndex = (currentSuggestionIndex - 1 + items.length) % items.length;
            items[currentSuggestionIndex]?.classList.add('active');
            items[currentSuggestionIndex]?.scrollIntoView({block: 'nearest'});
            return;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const activeItem = items[currentSuggestionIndex];
            if (activeItem) {
                const event = new MouseEvent('mousedown');
                activeItem.dispatchEvent(event);
            }
            return;
        } else if (e.key === 'Escape' || e.key === ' ') {
            closeAutocomplete();
            return; 
        }
    }

    if (e.key === 'Tab' && !isAutocompleting) {
        e.preventDefault(); 
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4; 
        updateEditor();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const lang = langSelect.value;
        const cmtSymbol = lang === 'cpp' ? '//' : '#'; 
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const val = this.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = val.indexOf('\n', end);
        if (lineEnd === -1) lineEnd = val.length;
        
        const lines = val.substring(lineStart, lineEnd).split('\n');
        const allCommented = lines.every(line => line.trim() === '' || line.trim().startsWith(cmtSymbol));
        
        let newLinesStr;
        if (allCommented) {
            newLinesStr = lines.map(line => {
                const trimmed = line.trimStart();
                if (trimmed.startsWith(cmtSymbol)) {
                    const hasSpace = trimmed.startsWith(cmtSymbol + ' ') ? 1 : 0;
                    return line.replace(cmtSymbol + (hasSpace ? ' ' : ''), '');
                }
                return line;
            }).join('\n');
        } else {
            newLinesStr = lines.map(line => cmtSymbol + ' ' + line).join('\n');
        }
        
        this.value = val.substring(0, lineStart) + newLinesStr + val.substring(lineEnd);
        this.selectionStart = lineStart;
        this.selectionEnd = lineStart + newLinesStr.length;
        updateEditor();
    }
});

codeInput.addEventListener('input', (e) => {
    if (e.inputType === 'deleteContentBackward') {
        closeAutocomplete();
        return;
    }
    showAutocomplete(false);
});
codeInput.addEventListener('click', closeAutocomplete);
codeInput.addEventListener('scroll', closeAutocomplete);

function getDynamicWords() {
    const text = codeInput.value;
    const matches = text.match(/[a-zA-Z_]\w*/g) || [];
    return [...new Set(matches)]; 
}

function showAutocomplete(force = false) {
    const start = codeInput.selectionStart;
    const textToCursor = codeInput.value.substring(0, start);
    
    const match = textToCursor.match(/[a-zA-Z0-9_]+$/);
    const word = match ? match[0] : "";
    
    if (word.length < 1 && !force) {
        closeAutocomplete();
        return;
    }

    const lang = langSelect.value;
    const staticKeywords = ideKeywords[lang] || [];
    const dynamicWords = getDynamicWords();

    let suggestions = [];
    
    dynamicWords.forEach(w => {
        if (!staticKeywords.includes(w) && w.toLowerCase().startsWith(word.toLowerCase()) && w !== word) {
            suggestions.push({ text: w, type: 'variable', icon: 'V', class: 'icon-variable' });
        }
    });

    staticKeywords.forEach(w => {
        if (w.toLowerCase().startsWith(word.toLowerCase()) && w !== word) {
            suggestions.push({ text: w, type: 'keyword', icon: 'K', class: 'icon-keyword' });
        }
    });

    const list = document.getElementById('autocompleteList');
    list.innerHTML = '';
    
    if (suggestions.length === 0) {
        closeAutocomplete();
        return;
    }

    suggestions.sort((a, b) => a.text.localeCompare(b.text));

    suggestions.forEach((item, i) => {
        const li = document.createElement('li');
        if (i === 0) li.className = 'active';
        
        const matchedPart = item.text.substring(0, word.length);
        const restPart = item.text.substring(word.length);
        
        li.innerHTML = `
            <span class="suggest-icon ${item.class}">${item.icon}</span>
            <span class="suggest-text"><span class="suggest-match">${matchedPart}</span>${restPart}</span>
        `;

        li.onmousedown = function(e) { 
            e.preventDefault();
            insertAutocomplete(item.text, word.length);
        };
        list.appendChild(li);
    });

    const lines = textToCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentColIndex = lines[currentLineIndex].length;
    
    const top = 15 + (currentLineIndex * 24) - codeInput.scrollTop + 24; 
    const left = 45 + 10 + (currentColIndex * 7.8) - codeInput.scrollLeft;

    const finalTop = Math.min(top, codeInput.clientHeight - 100);
    const finalLeft = Math.min(left, codeInput.clientWidth - 200);

    list.style.top = finalTop + 'px';
    list.style.left = finalLeft + 'px';
    list.style.display = 'block';
    
    isAutocompleting = true;
    currentSuggestionIndex = 0;
}

function insertAutocomplete(word, replaceLength) {
    const start = codeInput.selectionStart;
    const val = codeInput.value;
    
    const beforeCursor = val.substring(0, start - replaceLength);
    const afterCursor = val.substring(start);
    
    codeInput.value = beforeCursor + word + afterCursor;
    
    const newCursorPos = start - replaceLength + word.length;
    codeInput.selectionStart = codeInput.selectionEnd = newCursorPos;
    
    updateEditor();
    closeAutocomplete();
    
    codeInput.focus();
}

function closeAutocomplete() {
    document.getElementById('autocompleteList').style.display = 'none';
    isAutocompleting = false;
}

function doSearch() { updateEditor(); }

function closeSearch() {
    document.getElementById('searchBox').style.display = 'none';
    document.getElementById('searchInput').value = '';
    updateEditor();
    codeInput.focus();
}

codeInput.addEventListener('input', () => {
    if (isAutocompleting) showAutocomplete(); 
});
codeInput.addEventListener('click', closeAutocomplete);

function changeLanguage() {
    const lang = langSelect.value;
    codeHighlight.className = lang === 'cpp' ? 'language-cpp' : 'language-python';
    
    if (lang === 'cpp' && codeInput.value.includes('print("Chương trình')) {
        codeInput.value = `#include <iostream>\nusing namespace std;\n\nint arr[3] = {1, 2, 3}; // Biến Global\n\nint TinhTong(int x, int y) {\n    return x + y;\n}\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    int tong = TinhTong(a, b);\n    cout << "Tong la: " << tong << endl;\n    return 0;\n}`;
        stdInput.value = "10 20";
    } else if (lang === 'python' && codeInput.value.includes('#include')) {
        codeInput.value = `print("Chương trình tính tổng")\na = int(input())\nb = int(input())\ntong = a + b\nprint(f"Tổng là: {tong}")`;
        stdInput.value = "10\n20";
    }
    updateEditor();
}

function updateEditor() {
    const text = codeInput.value;
    const lines = text.split('\n').length;
    lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    let escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (escapedText[escapedText.length - 1] === "\n") escapedText += " "; 
    
    codeHighlight.innerHTML = escapedText;
    Prism.highlightElement(codeHighlight);

    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    if (searchBox && searchBox.style.display !== 'none' && searchInput.value) {
        const regex = new RegExp(`(?![^<]*>)(${searchInput.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        let matchCount = 0;
        codeHighlight.innerHTML = codeHighlight.innerHTML.replace(regex, (match) => {
            matchCount++;
            return `<mark class="search-match">${match}</mark>`;
        });
        document.getElementById('searchCount').innerText = matchCount;
    }
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
    document.getElementById('highlightLayer').scrollTop = codeInput.scrollTop;
    document.getElementById('highlightLayer').scrollLeft = codeInput.scrollLeft;
    updateArrowPosition();
}

function updateArrowPosition() {
    const errorLineEl = document.getElementById('errorLine');
    if (currentErrorLine > 0) {
        const errTopPos = 15 + ((currentErrorLine - 1) * 24) - codeInput.scrollTop;
        errorLineEl.style.top = errTopPos + 'px';
        errorLineEl.style.display = 'block';
    } else {
        errorLineEl.style.display = 'none';
    }

    if (globalTraceData.length > 0 && currentStepIndex >= 0) {
        const current_line_num = globalTraceData[currentStepIndex].line;
        const topPos = 15 + ((current_line_num - 1) * 24) - codeInput.scrollTop;
        activeLine.style.top = topPos + 'px';
        
        if (currentStepIndex > 0) {
            const previous_line_num = globalTraceData[currentStepIndex - 1].line;
            const prevTopPos = 15 + ((previous_line_num - 1) * 24) - codeInput.scrollTop;
            prevLine.style.top = prevTopPos + 'px';
            prevLine.style.display = 'block';
        } else {
            prevLine.style.display = 'none'; 
        }
    }
}
updateEditor();

function toggleDebug() {
    isDebugOpen = !isDebugOpen;
    debugModal.style.display = isDebugOpen ? 'block' : 'none';
    modalOverlay.style.display = isDebugOpen ? 'block' : 'none';
}

function initializeDebugMenu(traceData) {
    let allUnique = new Set();
    visibleVariables.clear();

    traceData.forEach(step => {
        if (step.vars) {
            Object.keys(step.vars).forEach(varName => {
                if (!varName.startsWith('__')) allUnique.add(varName);
            });
        }
    });

    allUnique.forEach(v => visibleVariables.add(v));
    if (allUnique.size === 0) return;

    debugList.innerHTML = '';
    allUnique.forEach(varName => {
        const item = document.createElement('label');
        item.className = 'var-toggle-item';
        item.innerHTML = `<input type="checkbox" checked onchange="toggleVar('${varName}', this.checked)"> <span>${varName}</span>`;
        debugList.appendChild(item);
    });
}

function toggleVar(varName, isVisible) {
    isVisible ? visibleVariables.add(varName) : visibleVariables.delete(varName);
    if (globalTraceData.length > 0) renderMemory(globalTraceData[currentStepIndex]);
}

function printToConsole(text, type = "normal") {
    const span = document.createElement('span');
    span.textContent = text + '\n';
    if (type === "error") span.className = "text-err";
    if (type === "system") span.className = "text-sys";
    consoleOutput.appendChild(span);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// --- TRACE LOGIC TẠO CALL STACK BẰNG JAVASCRIPT ---
function setupTrace(traceData, fullOutput) {
    globalTraceData = traceData || [];
    globalOutput = fullOutput || "";
    currentStepIndex = 0;
    
    let simulatedStack = [];
    globalTraceData.forEach(step => {
        let stepGlobals = {};
        let stepLocals = {};

        if (step.vars) {
            Object.entries(step.vars).forEach(([k, v]) => {
                if (k.startsWith('[Global] ')) {
                    stepGlobals[k] = v;
                } else {
                    stepLocals[k] = v;
                }
            });
        }

        if (simulatedStack.length === 0) {
            if (step.func_name) simulatedStack.push({ funcName: step.func_name, vars: stepLocals });
        } else {
            let topFrame = simulatedStack[simulatedStack.length - 1];
            if (topFrame.funcName === step.func_name) {
                topFrame.vars = stepLocals; 
            } else {
                let existingIndex = simulatedStack.findIndex(f => f.funcName === step.func_name);
                if (existingIndex !== -1) {
                    simulatedStack = simulatedStack.slice(0, existingIndex + 1); 
                    simulatedStack[simulatedStack.length - 1].vars = stepLocals;
                } else {
                    simulatedStack.push({ funcName: step.func_name, vars: stepLocals });
                }
            }
        }

        step.callStackSnapshot = JSON.parse(JSON.stringify(simulatedStack));
        step.globalsSnapshot = JSON.parse(JSON.stringify(stepGlobals));
    });

    runBtn.disabled = false;
    initializeDebugMenu(globalTraceData);

    if (globalTraceData.length > 0) {
        if (!isVisualizerVisible) {
            currentStepIndex = globalTraceData.length - 1;
        } else {
            currentStepIndex = 0;
        }
        renderStep(currentStepIndex);
    } else {
        activeLine.style.display = 'none';
        printToConsole(globalOutput);
    }
}

function renderStep(index) {
    const step = globalTraceData[index];
    const prevStep = index > 0 ? globalTraceData[index - 1] : null; 
    
    if (!step) return;

    renderMemory(step, prevStep); 

    activeLine.style.display = 'block';
    updateArrowPosition();

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === globalTraceData.length - 1;

    consoleOutput.innerHTML = '';
    if (index === globalTraceData.length - 1) {
        printToConsole(globalOutput);
    } else {
        printToConsole("> Đang chạy từng bước...", "system");
    }
}

// --- RENDER GIAO DIỆN CALL STACK ---
// Thêm tham số prevStep
function renderMemory(step, prevStep) {
    visualizerArea.innerHTML = '';
    let hasData = false;

    // BƯỚC 1: Lập bản đồ (Map) các biến của bước trước để so sánh
    let prevVarsMap = {};
    if (prevStep) {
        if (prevStep.globalsSnapshot) {
            Object.entries(prevStep.globalsSnapshot).forEach(([k, v]) => prevVarsMap['global_' + k] = JSON.stringify(v));
        }
        if (prevStep.callStackSnapshot) {
            prevStep.callStackSnapshot.forEach(frame => {
                Object.entries(frame.vars).forEach(([k, v]) => prevVarsMap[frame.funcName + '_' + k] = JSON.stringify(v));
            });
        }
    }

    const createFrameUI = (title, varsObj, isGlobal) => {
        const entries = Object.entries(varsObj || {}).filter(([k]) => !k.startsWith('__') && visibleVariables.has(k));
        
        const frameDiv = document.createElement('div');
        frameDiv.className = 'memory-frame';

        const header = document.createElement('div');
        header.className = 'frame-header' + (isGlobal ? ' global' : '');
        header.innerHTML = isGlobal ? `🌐 Biến Toàn Cục (Global)` : `📍 Frame: <span>${title}()</span>`;
        frameDiv.appendChild(header);

        if (entries.length === 0 && !isGlobal) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'color:#8b949e; font-size:13px; font-style:italic;';
            emptyMsg.textContent = 'Trống (Chưa có biến cục bộ)';
            frameDiv.appendChild(emptyMsg);
            visualizerArea.appendChild(frameDiv);
            hasData = true;
            return;
        } else if (entries.length === 0 && isGlobal) {
            return; 
        }

        for (const [k, data] of entries) {
            const name = isGlobal ? k.replace('[Global] ', '') : k;
            const row = document.createElement('div');
            row.className = 'var-row';
            
            // --- THUẬT TOÁN DIFFING ---
            const mapKey = (isGlobal ? 'global_' : title + '_') + k;
            const currentValStr = JSON.stringify(data);
            
            if (!prevVarsMap.hasOwnProperty(mapKey)) {
                row.classList.add('var-new'); // Biến mới xuất hiện
            } else if (prevVarsMap[mapKey] !== currentValStr) {
                row.classList.add('var-updated'); // Biến bị thay đổi giá trị
            }
            // --------------------------

            const nameDiv = document.createElement('div');
            nameDiv.className = 'var-name';
            nameDiv.textContent = name;
            
            const eqDiv = document.createElement('div');
            eqDiv.className = 'var-eq';
            eqDiv.textContent = '=';

            const valsDiv = document.createElement('div');
            valsDiv.className = 'var-values';

            let dataType = data.type || "prim";
            let dataVal = data.val !== undefined ? data.val : data;

            if (dataType === 'list') {
                const bOpen = document.createElement('span'); bOpen.className = 'var-symbol'; bOpen.textContent = '[';
                valsDiv.appendChild(bOpen);
                (Array.isArray(dataVal) ? dataVal : []).forEach(item => {
                    const block = document.createElement('div');
                    block.className = 'var-block';
                    block.textContent = item;
                    valsDiv.appendChild(block);
                });
                const bClose = document.createElement('span'); bClose.className = 'var-symbol'; bClose.textContent = ']';
                valsDiv.appendChild(bClose);
            } else if (dataType === 'object' || dataType === 'dict') {
                const objBox = document.createElement('div');
                objBox.className = 'var-obj-box';
                const header = document.createElement('div');
                header.className = 'var-obj-header';
                header.textContent = dataType === 'object' ? `Class: ${data.class_name}` : `Dictionary`;
                objBox.appendChild(header);

                const subEntries = Object.entries(dataVal || {});
                if (subEntries.length === 0) {
                    const empty = document.createElement('div');
                    empty.style.color = 'var(--text-muted)';
                    empty.style.fontSize = '12px';
                    empty.textContent = '{} (Trống)';
                    objBox.appendChild(empty);
                } else {
                    subEntries.forEach(([key, val]) => {
                        const objRow = document.createElement('div');
                        objRow.className = 'var-obj-row';
                        objRow.innerHTML = `<span class="var-obj-key">${key}:</span> <span class="var-obj-val">${val}</span>`;
                        objBox.appendChild(objRow);
                    });
                }
                valsDiv.appendChild(objBox);
            } else {
                const block = document.createElement('div');
                block.className = 'var-block';
                block.textContent = dataVal;
                valsDiv.appendChild(block);
            }

            row.appendChild(nameDiv);
            row.appendChild(eqDiv);
            row.appendChild(valsDiv);
            frameDiv.appendChild(row);
        }
        visualizerArea.appendChild(frameDiv);
        hasData = true;
    };

    if (step.globalsSnapshot) {
        createFrameUI('', step.globalsSnapshot, true);
    }

    if (step.callStackSnapshot && step.callStackSnapshot.length > 0) {
        step.callStackSnapshot.forEach(frame => {
            createFrameUI(frame.funcName, frame.vars, false);
        });
    }

    if (!hasData) {
        visualizerArea.innerHTML = '<div style="color:#8b949e; font-size:13px; text-align:center; margin-top:40px;">Chưa có dữ liệu biến.</div>';
    }
}

function nextStep() {
    if (currentStepIndex < globalTraceData.length - 1) {
        currentStepIndex++;
        renderStep(currentStepIndex);
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep(currentStepIndex);
    }
}

async function runCode() {
    const code = codeInput.value;
    const lang = langSelect.value;
    const inputs = stdInput.value; 
    
    consoleOutput.innerHTML = '';
    visualizerArea.innerHTML = '';
    runBtn.disabled = true;
    loader.style.display = 'inline-block';
    currentErrorLine = -1;
    updateArrowPosition();

    try {
        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang, code: code, inputs: inputs }) 
        };

        let response;
        try {
            response = await fetch('http://10.60.50.228:8000/api/visualize', fetchOptions);
        } catch (localErr) {
            response = await fetch('https://unicornscodevisualier-production.up.railway.app/api/visualize', fetchOptions);
        }

        if (!response.ok) {
            throw new Error(`Server trả về lỗi: ${response.status}`);
        }

        const result = await response.json();

        if (result.time_ms !== undefined) {
            document.getElementById('timeMetric').innerText = result.time_ms.toFixed(2);
            document.getElementById('memMetric').innerText = result.memory_kb.toFixed(2);
        } else {
            document.getElementById('timeMetric').innerText = "0.00";
            document.getElementById('memMetric').innerText = "0.00";
        }

        if (result.error) {
            printToConsole("[" + lang.toUpperCase() + " Error] " + result.error, "error");
            runBtn.disabled = false;
            activeLine.style.display = 'none';
            prevLine.style.display = 'none';

            if (result.error_line && result.error_line > 0) {
                currentErrorLine = result.error_line;
                updateArrowPosition();
            }
            return;
        }

        setupTrace(result.trace, result.output);
        
    } catch (err) {
        printToConsole("[Lỗi Kết Nối] " + err.message, "error");
        printToConsole("⚠️ Hãy đảm bảo Backend Server đang chạy tại http://localhost:8000/api/visualize", "system");
        runBtn.disabled = false;
    } finally {
        loader.style.display = 'none';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
            e.preventDefault(); 
            if (!nextBtn.disabled) {
                nextStep();
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (!prevBtn.disabled) {
                prevStep();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (!runBtn.disabled) {
                runCode();
            }
        }
    }
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        codeInput.value = e.target.result;
        
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.cpp') || fileName.endsWith('.c') || fileName.endsWith('.h')) {
            langSelect.value = 'cpp';
            codeHighlight.className = 'language-cpp';
        } else if (fileName.endsWith('.py')) {
            langSelect.value = 'python';
            codeHighlight.className = 'language-python';
        }
        
        updateEditor();
    };
    reader.readAsText(file);
    
    this.value = '';
});

function saveCode() {
    const code = codeInput.value;
    const lang = langSelect.value;
    const ext = lang === 'cpp' ? 'cpp' : 'py';
    const filename = `my_code.${ext}`;
    
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}