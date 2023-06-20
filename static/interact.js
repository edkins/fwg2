"use strict";

const document_id = 'test';
let lines = [];

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

async function redisplay_textbox(textbox) {
    const textg = textbox.querySelector('.textg');
    textg.innerHTML = '';
    const line_id = parseInt(textbox.dataset.line_id);
    const pos = lines[line_id].pos;

    let x = 0;
    let y = 20;
    let cursor_x = 0;

    for (const breakdown of lines[line_id].breakdown) {
        const textelem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textelem.setAttribute('x', x);
        textelem.setAttribute('y', y);
        textelem.setAttribute('fill', {
            'unknown': 'grey',
            'keyword': 'green',
            'string': 'black',
        }[breakdown.type])
        textelem.style.fontVariantLigatures = 'none';
        textelem.style.whiteSpace = 'pre';
        textelem.textContent = breakdown.text;
        textg.appendChild(textelem);

        // Force a layout update
        await new Promise(resolve => window.requestAnimationFrame(resolve));

        if (pos >= breakdown.position && pos <= breakdown.position + breakdown.text.length) {
            if (pos === breakdown.position) {
                cursor_x = x;
            } else {
                cursor_x = textelem.getEndPositionOfChar(pos - breakdown.position - 1).x;
            }
        }

        if (breakdown.text !== '') {
            x = textelem.getEndPositionOfChar(breakdown.text.length - 1).x;
        }
    }

    const selg = textbox.querySelector('.selg');
    selg.innerHTML = '';
    const selrect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selrect.setAttribute('x', cursor_x);
    selrect.setAttribute('y', y - 20);
    selrect.setAttribute('width', '2');
    selrect.setAttribute('height', '20');
    selrect.setAttribute('fill', 'grey');
    selg.appendChild(selrect);
}

async function document_keydown(e) {
    const textbox = get_selected_textbox();
    if (textbox === undefined) {
        return;
    }
    let line_id = parseInt(textbox.dataset.line_id);
    let text = lines[line_id].text;
    let pos = lines[line_id].pos;

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
    } else {
        return;
    }
    lines[line_id].text = text;
    lines[line_id].pos = pos;

    await update_document_from_server();
    await redisplay_textbox(textbox);
}

async function update_document_from_server() {
    const response = await fetch(`/api/document/${document_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({lines})
    });
    if (!response.ok) {
        console.log('Error saving document');
        return;
    }
    const result = await response.json();
    lines = result.lines;
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

async function create_textbox(selected) {
    const line_id = lines.length;
    const textbox = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    textbox.classList.add('textbox');
    textbox.dataset.line_id = line_id;
    lines.push({
        text: '',
        pos: 0,
    });
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

    document.body.appendChild(textbox);

    await update_document_from_server();
    await redisplay_textbox(textbox);
}

async function load_stuff() {
    const textbox = await create_textbox(true);
    document.onkeydown = document_keydown;
}

window.onload = load_stuff;