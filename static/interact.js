"use strict";

function get_textbox(e) {
    if (e.target.classList.contains('textbox')) {
        return e.target;
    }
    return undefined;
}

function get_selected_textbox() {
    const result = document.querySelector('.editing');
    if (result === null) {
        return undefined;
    }
    if (!result.classList.contains('textbox')) {
        return undefined;
    }
    return result;
}

function redisplay_textbox(textbox) {
    const textg = textbox.querySelector('.textg');
    textg.innerHTML = '';
    const textelem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const pos = parseInt(textbox.dataset.pos);

    textelem.setAttribute('x', '0');
    textelem.setAttribute('y', '20');
    textelem.style.fontVariantLigatures = 'none';
    textelem.textContent = textbox.dataset.text;
    textg.appendChild(textelem);

    // Force a layout update
    window.requestAnimationFrame(() => {
        const selg = textbox.querySelector('.selg');
        selg.innerHTML = '';
        const selrect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        let x = 0;
        let y = 0;
        if (pos === 0) {
            x = 0;
            y = 20;
        } else {
            const position = textelem.getEndPositionOfChar(pos - 1);
            x = position.x;
            y = position.y;
        }
        selrect.setAttribute('x', x);
        selrect.setAttribute('y', y - 20);
        selrect.setAttribute('width', '2');
        selrect.setAttribute('height', '20');
        selrect.setAttribute('fill', 'grey');
        selg.appendChild(selrect);
    });
}

function document_keydown(e) {
    const textbox = get_selected_textbox();
    if (textbox === undefined) {
        return;
    }
    let text = textbox.dataset.text;
    let pos = parseInt(textbox.dataset.pos);

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        text = text.slice(0, pos) + e.key + text.slice(pos);
        pos += 1;
    } else if (e.key === 'Backspace') {
        if (pos > 0) {
            text = text.slice(0, pos - 1) + text.slice(pos);
            pos -= 1;
        }
    } else if (e.key === 'Delete') {
        if (pos < text.length) {
            text = text.slice(0, pos) + text.slice(pos + 1);
        }
    } else if (e.key === 'ArrowLeft') {
        if (pos > 0) {
            pos -= 1;
        }
    } else if (e.key === 'ArrowRight') {
        if (pos < text.length) {
            pos += 1;
        }
    }
    textbox.dataset.text = text;
    textbox.dataset.pos = pos;
    redisplay_textbox(textbox);
}

function textbox_mousedown(e) {
    const previously_editing = document.querySelector('.editing');
    if (previously_editing !== null) {
        previously_editing.classList.remove('editing');
    }

    const textbox = get_textbox(e);
    if (textbox === undefined) {
        return;
    }
    textbox.classList.add('editing');
}

function create_textbox(selected) {
    const textbox = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    textbox.classList.add('textbox');
    textbox.dataset.text = '';
    textbox.dataset.pos = '0';
    textbox.setAttribute('width', '500');
    textbox.setAttribute('height', '100');

    const selg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    selg.classList.add('selg');
    textbox.appendChild(selg);

    const textg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textg.classList.add('textg');
    textbox.appendChild(textg);

    textbox.onmousedown = textbox_mousedown;

    if (selected) {
        const previously_editing = document.querySelector('.editing');
        if (previously_editing !== null) {
            previously_editing.classList.remove('editing');
        }
        textbox.classList.add('editing');
    }

    redisplay_textbox(textbox);

    return textbox;
}

function load_stuff() {
    const textbox = create_textbox(true);
    document.body.appendChild(textbox);
    document.onkeydown = document_keydown;
}

window.onload = load_stuff;