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
    textelem.textContent = textbox.dataset.text;
    textelem.setAttribute('x', '0');
    textelem.setAttribute('y', '20');
    textg.appendChild(textelem);
}

function document_keydown(e) {
    const textbox = get_selected_textbox();
    if (textbox === undefined) {
        return;
    }
    let text = textbox.dataset.text;
    text += e.key;
    textbox.dataset.text = text;
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
    textbox.setAttribute('width', '500');
    textbox.setAttribute('height', '100');
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

    return textbox;
}

function load_stuff() {
    const textbox = create_textbox(true);
    document.body.appendChild(textbox);
    document.onkeydown = document_keydown;
}

window.onload = load_stuff;